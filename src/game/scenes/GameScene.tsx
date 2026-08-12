import * as Phaser from 'phaser';
import {
    EventBus, MathStrategy, EmotionContext,
    SadState, HappyState, LevelBuilder, UIFacade,
    NumberItem, SuperHappyState, SuperSadState, DifficultyEvaluator,
    TouchControls
} from './patterns';
import {audioManager} from "@/game/scenes/audioManager";
import { generateProblema } from './exerciseGenerator';
import type { DificultadNum, ProblemaMatematico } from './LevelsData';

// Un evento por cada numero recogido durante la partida (correcto o
// trampa), en el orden en que el alumno lo recogio.
interface DesgloseEvento {
    orden: number;
    valor: number;
    tipo: 'objetivo' | 'trampa';
    correcta: boolean;
    tiempo: number;
}

// Un sub-intento por cada vez que el alumno choco con la puerta: una vida
// perdida genera un sub-intento fallido y reinicia el mismo problema; el
// ultimo sub-intento puede ser exitoso o, si se quedo sin vidas, fallido.
interface SubIntentoDesglose {
    numero: number;
    exitoso: boolean;
    vidasRestantes: number;
    eventos: DesgloseEvento[];
}

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private itemsGroup!: Phaser.Physics.Arcade.Group;
    private ui!: UIFacade;
    private emotionState!: EmotionContext;
    private doorStrategy!: MathStrategy;
    private touchControls!: TouchControls;
    private bgMusic!: Phaser.Sound.BaseSound;
    private currentDifficulty: number = 2;
    private totalStarsHistorical: number = 0;
    // Problema procedural generado para este intento (Modo Historia). Se
    // reutiliza en los reintentos con vidas restantes para no cambiar el
    // ejercicio a media partida; se regenera en un intento nuevo/nivel nuevo.
    private currentProblema: ProblemaMatematico | null = null;

    private levelData: any = null;
    private currentElement: 'tierra' | 'agua' = 'tierra';

    private levelConfig = {
        targetNumbers: [] as number[],
        solution: 0,
        platformCount: 7,
        trapNumbers: [] as number[]
    };

    private gameState = {
        collectedNumbers: [] as number[],
        desglose: [] as DesgloseEvento[],
        // Sub-intentos fallidos de esta misma partida (se recibe y se
        // reenvia a traves de scene.restart para sobrevivir a los
        // reintentos con vidas restantes; se reinicia solo en una partida
        // realmente nueva).
        historialIntentos: [] as SubIntentoDesglose[],
        elapsedTime: 0,
        lastEmittedTime: 0,
        doorFailed: false,
        isGameOver: false,
        isPaused: false,
        lives: 3
    };

    constructor() {
        super('GameScene');
    }

    init(data: any) {
        const startingLives = data && data.lives !== undefined ? data.lives : 3;
        this.gameState = { collectedNumbers: [], desglose: [], historialIntentos: data?.historialIntentos ?? [],
            elapsedTime: 0, lastEmittedTime: 0, doorFailed: false,
            isGameOver: false, isPaused: false, lives: startingLives };
        console.log("4. GameScene inicializado con:", data);
        this.totalStarsHistorical = this.registry.get('totalStars') || 0;
        if (data && data.config) {
            this.levelData = data.config;

            if (data.mode) {
                this.levelData.gameMode = data.mode;
            }

            this.currentElement = this.levelData.element || 'tierra';

            if (this.levelData.gameMode === 'custom' || this.levelData.mode === 'custom') {
                this.currentDifficulty = 4;

                this.levelConfig.targetNumbers = (this.levelData.cifras || [])
                    .filter((c: any) => c !== '').map(Number);
                this.levelConfig.trapNumbers = (this.levelData.trampas || [])
                    .filter((c: any) => c !== '').map(Number);
                this.levelConfig.solution = Number(this.levelData.resultado);

            } else {
                this.currentDifficulty = data.dificultad || 2;
                const dificultadGenerador = Phaser.Math.Clamp(this.currentDifficulty, 1, 3) as DificultadNum;
                const esPrueba = this.levelData.type === 'prueba';

                // Si venimos de un reintento con vidas restantes (mismo nivel),
                // reutilizamos el problema ya generado en vez de crear uno nuevo.
                const problemaActual: ProblemaMatematico = data.problema
                    ?? generateProblema(this.levelData.operation, dificultadGenerador, esPrueba);

                this.currentProblema = problemaActual;
                this.levelConfig.targetNumbers = problemaActual.cifras;
                this.levelConfig.trapNumbers = problemaActual.trampas;
                this.levelConfig.solution = problemaActual.resultado;
            }

            this.levelConfig.platformCount = this.levelConfig.targetNumbers.length + this.levelConfig.trapNumbers.length + 2;
        }
    }

    create() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const barHeight = 120;
        const playableHeight = gameHeight - barHeight;

        this.physics.world.setBounds(0, 0, gameWidth, playableHeight);

        // En PC (sin touch) mostramos el fondo con el tutorial de controles de teclado.
        const isTouchDevice = this.sys.game.device.input.touch;
        const backgroundKey = this.currentElement === 'agua'
            ? (isTouchDevice ? 'bg_agua' : 'bg_agua_tutorial')
            : (isTouchDevice ? 'bg_tierra' : 'bg_tierra_tutorial');
        const barBgKey = this.currentElement === 'agua' ? 'bar_bg_agua' : 'bar_bg_tierra';
        const platformKey = this.currentElement === 'agua' ? 'platform_agua' : 'platform_tierra';
        this.add.image(0, 0, backgroundKey)
            .setOrigin(0,0)
            .setDisplaySize(gameWidth, playableHeight);

        this.ui = new UIFacade(this);
        this.ui.createBottomBar(gameWidth, gameHeight, barHeight, barBgKey,this.gameState.lives, this.totalStarsHistorical);
        this.ui.createControlButtons(gameWidth);

        const builder = new LevelBuilder(this);
        const numbersForThisLevel = [...this.levelConfig.targetNumbers, ...this.levelConfig.trapNumbers];

        const level = builder
            .setPlayableBounds(gameWidth, playableHeight)
            .addDoor(gameWidth - 50, playableHeight - 50)
            .addRandomPlatformsWithItems(this.levelConfig.platformCount, numbersForThisLevel, platformKey)
            .build();

        this.player = this.physics.add.sprite(50, playableHeight - 50, 'axolotl_idle').setScale(1.5);
        this.player.setBounce(0.1).setCollideWorldBounds(true);

        this.emotionState = new EmotionContext(this.player, this.ui.getEmotionImageObject());
        this.doorStrategy = new MathStrategy(this.levelConfig.targetNumbers, this.levelData?.operation);
        this.itemsGroup = level.items;

        this.physics.add.collider(this.player, level.platforms);
        this.physics.add.collider(level.items, level.platforms);

        if (level.door) {
            this.physics.add.overlap(this.player, level.door,
                this.handleDoorCollision as
                    Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
                undefined, this);
        }

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.touchControls = new TouchControls(this, gameWidth, playableHeight);

        this.ui.setEquationText(this.buildEquationString());

        if (this.textures.exists('axolotl_idle') && this.textures.exists('axolotl_walking')) {
            if (!this.anims.exists('idle')) {
                this.anims.create({
                    key: 'idle',
                    frames: this.anims.generateFrameNumbers('axolotl_idle', { start: 0, end: 3 }),
                    frameRate: 5,
                    repeat: -1
                });
            }
            if (!this.anims.exists('walk')) {
                this.anims.create({
                    key: 'walk',
                    frames: this.anims.generateFrameNumbers('axolotl_walking', { start: 0, end: 3 }),
                    frameRate: 7,
                    repeat: -1
                });
        }
            if (this.anims.exists('idle')) {
                this.player.play('idle');
            }
        } else {
            console.warn("Texturas del Axolote no encontradas. Saltando animaciones.");
        }

        audioManager(this, 'bg_music');

        EventBus.on('togglePause', (paused: boolean) => {
            this.gameState.isPaused = paused;
            if (paused) {
                this.physics.pause();
                this.player.anims.pause();
            } else {
                this.physics.resume();
                this.player.anims.resume();
            }
        }, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off('togglePause');
            EventBus.off('restartGame');
        });
    }

    update(_time: number, delta: number) {
        if (this.gameState.isGameOver|| this.gameState.isPaused)
            return;
        this.gameState.elapsedTime += delta / 1000;
        const currentSecond = Math.floor(this.gameState.elapsedTime);

        if (this.levelData && this.levelData.type === 'prueba') {
            const timeLimit = Number(this.levelData.timeLimit);
            const timeLeft = timeLimit - currentSecond;

            if (currentSecond > this.gameState.lastEmittedTime) {
                EventBus.emit('updateTime', timeLeft > 0 ? timeLeft : 0);
                this.gameState.lastEmittedTime = currentSecond;
            }

            if (timeLeft <= 0) {
                this.triggerLoss('SE ACABÓ EL TIEMPO');
            }
        } else {
            if (currentSecond > this.gameState.lastEmittedTime) {
                EventBus.emit('updateTime', currentSecond);
                this.gameState.lastEmittedTime = currentSecond;
            }
        }


        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.touchControls.consumeInteract()) {
            this.physics.overlap(this.player, this.itemsGroup,
                this.handleItemCollection as
                    Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
                undefined, this);
        }

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const {left, right, up} = this.cursors;

        const moveLeft = left.isDown || this.touchControls.isLeftDown();
        const moveRight = right.isDown || this.touchControls.isRightDown();
        const jump = up.isDown || this.touchControls.isJumpDown();

        if (moveLeft){
            this.player.setVelocityX(-160);
            this.player.play('walk', true);
            this.player.setFlipX(true);
        } else if (moveRight){
            this.player.setVelocityX(160);
            this.player.play('walk', true);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
            this.player.play('idle', true);
        }

        const isGrounded = body.blocked.down || body.touching.down;
        if (jump && isGrounded) {
            this.player.setVelocityY(-550);
        }
    }

    private handleItemCollection(player: Phaser.GameObjects.GameObject, item: Phaser.GameObjects.GameObject) {
        const limit = this.levelConfig.targetNumbers.length;
        if (this.gameState.collectedNumbers.length >= limit) {
            return;
        }

        const numItem = item as NumberItem;

        if (numItem.itemType === 'number') {
            this.gameState.collectedNumbers.push(numItem.itemValue);

            // Resta y division no son conmutativas: la cifra recogida debe
            // coincidir con la posicion esperada, no solo con el conjunto.
            const isOrderSensitive = this.levelData?.operation === 'resta' || this.levelData?.operation === 'division';
            const collectedIndex = this.gameState.collectedNumbers.length - 1;
            const isCorrectNumber = isOrderSensitive
                ? this.levelConfig.targetNumbers[collectedIndex] === numItem.itemValue
                : this.levelConfig.targetNumbers.includes(numItem.itemValue);

            this.gameState.desglose.push({
                orden: collectedIndex + 1,
                valor: numItem.itemValue,
                tipo: this.levelConfig.trapNumbers.includes(numItem.itemValue) && !isCorrectNumber ? 'trampa' : 'objetivo',
                correcta: isCorrectNumber,
                tiempo: Math.floor(this.gameState.elapsedTime)
            });

            if (!isCorrectNumber) {
                this.emotionState.transitionTo(new SadState());
                this.gameState.doorFailed = true;
            } else if (!this.gameState.doorFailed) {
                this.emotionState.transitionTo(new HappyState());
            }
            numItem.destroy();
            this.ui.setEquationText(this.buildEquationString());
        }
    }

    private buildEquationString(): string {
        let symbol = '+';
        if (this.levelData) {
            switch (this.levelData.operation) {
                case 'suma': symbol = '+'; break;
                case 'resta': symbol = '-'; break;
                case 'multiplicacion': symbol = 'x'; break;
                case 'division': symbol = '÷'; break;
            }
        }

        const numCifras = (this.levelData && this.levelData.numCifras) || this.levelConfig.targetNumbers.length;
        const collected = this.gameState.collectedNumbers;
        const slots = Array.from({ length: numCifras }, (_, i) =>
            i < collected.length ? String(collected[i]) : '?'
        );

        return `${slots.join(` ${symbol} `)} = ${this.levelConfig.solution}`;
    }
    private handleDoorCollision(player: Phaser.GameObjects.GameObject, door: Phaser.GameObjects.GameObject) {
        if (this.gameState.isGameOver) return;

        const doorSprite = door as Phaser.Physics.Arcade.Sprite;

        const canOpen = this.doorStrategy.validate(this.gameState.collectedNumbers) && !this.gameState.doorFailed;

        if (!canOpen) {
            this.gameState.lives--;
            EventBus.emit('updateLives', this.gameState.lives);

            if (this.gameState.lives > 0) {
                this.gameState.isGameOver = true;
                this.emotionState.transitionTo(new SuperSadState());
                const currentMusicKey = this.registry.get('currentMusicKey');
                if (currentMusicKey) {
                    const currentMusic = this.sound.get(currentMusicKey);
                    if (currentMusic && currentMusic.isPlaying) {
                        currentMusic.stop();
                    }
                    this.registry.set('currentMusicKey', null);
                }
                this.physics.pause();

                // Este sub-intento fallo: lo guardamos en el historial para
                // que sobreviva al reinicio de la escena (mismo problema).
                const historialActualizado: SubIntentoDesglose[] = [
                    ...this.gameState.historialIntentos,
                    {
                        numero: this.gameState.historialIntentos.length + 1,
                        exitoso: false,
                        vidasRestantes: this.gameState.lives,
                        eventos: this.gameState.desglose
                    }
                ];

                this.add.text(this.scale.width / 2, this.scale.height / 2, 'Vuelve a intentarlo', {
                    fontSize: '40px', color: '#ff0', stroke: '#000', strokeThickness: 6
                }).setOrigin(0.5);

                const btn = this.add.image(this.scale.width / 2, (this.scale.height / 2) + 120,'btn_volver_a_jugar_0')
                    .setOrigin(0.5).setInteractive({ useHandCursor: true });

                btn.on('pointerover', () => btn.setTexture('btn_volver_a_jugar_1'));
                btn.on('pointerout', () => btn.setTexture('btn_volver_a_jugar_0'));
                btn.on('pointerdown', () => {
                    this.scene.restart({ config: this.levelData, lives: this.gameState.lives, dificultad: this.currentDifficulty, totalStars: this.totalStarsHistorical, problema: this.currentProblema, historialIntentos: historialActualizado });
                });
            } else {
                this.triggerLoss('TE QUEDASTE SIN VIDAS');
            }
            return;
        }

        // Logica de victoria
        this.gameState.isGameOver = true;
        this.emotionState.transitionTo(new SuperHappyState());
        doorSprite.setTexture('door_open');
            const currentMusicKey = this.registry.get('currentMusicKey');
            if (currentMusicKey) {
                const currentMusic = this.sound.get(currentMusicKey);
                if (currentMusic && currentMusic.isPlaying) {
                    currentMusic.stop();
                    this.bgMusic = this.sound.add('fanfare', { volume: 0.4, loop: false });
                    this.bgMusic.play();
                }
                this.registry.set('currentMusicKey', null);
            }
        this.physics.pause();

        const estrellasObtenidas = this.gameState.lives;
        const tiempoFinal = Math.floor(this.gameState.elapsedTime);
        this.totalStarsHistorical += estrellasObtenidas;
        this.registry.set('totalStars', this.totalStarsHistorical);

        const nextDifficulty = DifficultyEvaluator.evaluate(this.currentDifficulty, tiempoFinal, estrellasObtenidas, false);

        const stats = {
            Tiempo: tiempoFinal,
            Dificultad: this.currentDifficulty,
            Puntos: (estrellasObtenidas * 20) + this.getTiempoBonus(tiempoFinal),
            Emocion: estrellasObtenidas === 3 ? 3 : 2,
            Monedas: estrellasObtenidas,
            Operacion: this.levelData.operation,
            Vidas: this.gameState.lives,
            Desglose: this.buildDesglose(true)
        };
        EventBus.emit('gameOverStats', stats);

        const textoEstrellas = estrellasObtenidas === 1 ? 'estrella' : 'estrellas';

        this.add.text(this.scale.width / 2, this.scale.height / 2, 'NIVEL COMPLETADO', {
            fontSize: '40px', color: '#0f0', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, (this.scale.height / 2) + 50, `Ganaste ${estrellasObtenidas} ${textoEstrellas}`, {
            fontSize: '30px', color: '#ff0', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        EventBus.emit('updateCoins', this.totalStarsHistorical);
        const isStoryMode = this.levelData && this.levelData.gameMode === 'historia';

        if (isStoryMode) {
            const btn = this.add.image(this.scale.width / 2, (this.scale.height / 2) + 120,'btn_continuar_0')
                .setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setTexture('btn_continuar_1'));
            btn.on('pointerout', () => btn.setTexture('btn_continuar_0'));
            btn.on('pointerdown', () => {
                this.scene.start('TransitionScene', {
                    next: 'MapScene',
                    message: this.levelData.successText,
                    bg: this.levelData.bgKey,
                    nextData: { win: true, config: this.levelData, dificultad: nextDifficulty, totalStars: this.totalStarsHistorical }
                });
            });
        }
    }

    private triggerLoss(mensaje: string) {
        this.gameState.isGameOver = true;
        this.emotionState.transitionTo(new SuperSadState());

        const currentMusicKey = this.registry.get('currentMusicKey');

        if (currentMusicKey) {
            const currentMusic = this.sound.get(currentMusicKey);
            if (currentMusic && currentMusic.isPlaying) {
                currentMusic.stop();
            }
            this.registry.set('currentMusicKey', null);
        }
        this.physics.pause();
        const tiempoFinal = Math.floor(this.gameState.elapsedTime);

        const loweredDifficulty = DifficultyEvaluator.evaluate(this.currentDifficulty, tiempoFinal, 0, true);

        const stats = {
            Tiempo: tiempoFinal,
            Dificultad: this.currentDifficulty,
            Puntos: 0,
            Emocion: 1,
            Monedas: 0,
            Operacion: this.levelData.operation,
            Vidas: this.gameState.lives,
            Desglose: this.buildDesglose(false)
        };
        EventBus.emit('gameOverStats', stats);

        this.add.text(this.scale.width / 2, this.scale.height / 2, mensaje, {
            fontSize: '40px', color: '#f00', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        const btn = this.add.image(this.scale.width / 2, (this.scale.height / 2) + 120,'btn_reiniciar_0')
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setTexture('btn_reiniciar_1'));
        btn.on('pointerout', () => btn.setTexture('btn_reiniciar_0'));
        btn.on('pointerdown', () => {
            this.scene.restart({ config: this.levelData, lives: 3, dificultad: loweredDifficulty,totalStars: this.totalStarsHistorical });
        });
    }

    private buildDesglose(exitoso: boolean) {
        const intentoFinal: SubIntentoDesglose = {
            numero: this.gameState.historialIntentos.length + 1,
            exitoso,
            vidasRestantes: this.gameState.lives,
            eventos: this.gameState.desglose
        };

        return {
            objetivo: this.levelConfig.targetNumbers,
            trampas: this.levelConfig.trapNumbers,
            resultado: this.levelConfig.solution,
            intentos: [...this.gameState.historialIntentos, intentoFinal]
        };
    }

    private getTiempoBonus(tiempoSegundos: number): number {
        if (tiempoSegundos <= 30) return 40;
        if (tiempoSegundos <= 60) return 25;
        if (tiempoSegundos <= 90) return 10;
        return 0;
    }
}