import * as Phaser from 'phaser';
import {
    EventBus, MathStrategy, EmotionContext,
    SadState, HappyState, LevelBuilder, UIFacade,
    NumberItem, SuperHappyState, SuperSadState, DifficultyEvaluator
} from './patterns';
import {audioManager} from "@/game/scenes/audioManager";

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private itemsGroup!: Phaser.Physics.Arcade.Group;
    private ui!: UIFacade;
    private emotionState!: EmotionContext;
    private doorStrategy!: MathStrategy;
    private bgMusic!: Phaser.Sound.BaseSound;
    private currentDifficulty: number = 2;

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
        this.gameState = { collectedNumbers: [], elapsedTime: 0, lastEmittedTime: 0, doorFailed: false,
            isGameOver: false, isPaused: false, lives: startingLives };
        console.log("4. GameScene inicializado con:", data);
        if (data && data.config) {
            this.levelData = data.config;

            if (data.mode) {
                this.levelData.gameMode = data.mode;
            }

            this.currentElement = this.levelData.element || 'tierra';

            this.currentDifficulty = data.dificultad || 2;

            const problemasDelNivel = this.levelData.problemas || {};
            const problemaActual = problemasDelNivel[this.currentDifficulty as keyof typeof problemasDelNivel];

            if (problemaActual) {
                this.levelConfig.targetNumbers = problemaActual.cifras.map(Number);
                this.levelConfig.trapNumbers = problemaActual.trampas.map(Number);
                this.levelConfig.solution = Number(problemaActual.resultado);
            } else {
                console.warn("No se encontraron problemas para la dificultad:", this.currentDifficulty);
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

        const backgroundKey = this.currentElement === 'agua' ? 'bg_agua' : 'bg_tierra';
        const barBgKey = this.currentElement === 'agua' ? 'bar_bg_agua' : 'bar_bg_tierra';
        const platformKey = this.currentElement === 'agua' ? 'platform_agua' : 'platform_tierra';
        this.add.image(0, 0, backgroundKey)
            .setOrigin(0,0)
            .setDisplaySize(gameWidth, playableHeight);

        this.ui = new UIFacade(this);
        this.ui.createBottomBar(gameWidth, gameHeight, barHeight, barBgKey,this.gameState.lives);
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
        this.doorStrategy = new MathStrategy(this.levelConfig.targetNumbers);
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

        let equationString = "? x ? = ?";

        if (this.levelData) {
            let symbol = '+';
            switch(this.levelData.operation) {
                case 'suma': symbol = '+'; break;
                case 'resta': symbol = '-'; break;
                case 'multiplicacion': symbol = 'x'; break;
                case 'division': symbol = '÷'; break;
            }

            const numCifras = this.levelData.numCifras || this.levelConfig.targetNumbers.length;
            const questionMarks = Array(numCifras).fill('?').join(` ${symbol} `);
            equationString = `${questionMarks} = ${this.levelConfig.solution}`;
        }

        this.ui.setEquationText(equationString);

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


        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.physics.overlap(this.player, this.itemsGroup,
                this.handleItemCollection as
                    Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
                undefined, this);
        }

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const {left, right, up} = this.cursors;

        if (left.isDown){
            this.player.setVelocityX(-160);
            this.player.play('walk', true);
            this.player.setFlipX(true);
        } else if (right.isDown){
            this.player.setVelocityX(160);
            this.player.play('walk', true);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
            this.player.play('idle', true);
        }

        const isGrounded = body.blocked.down || body.touching.down;
        if (up.isDown && isGrounded) {
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
            const isCorrectNumber = this.levelConfig.targetNumbers.includes(numItem.itemValue);

            if (!isCorrectNumber) {
                this.emotionState.transitionTo(new SadState());
                this.gameState.doorFailed = true;
            } else if (!this.gameState.doorFailed) {
                this.emotionState.transitionTo(new HappyState());
            }
            numItem.destroy();
        }
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

                this.add.text(this.scale.width / 2, this.scale.height / 2, 'Vuelve a intentarlo', {
                    fontSize: '40px', color: '#ff0', stroke: '#000', strokeThickness: 6
                }).setOrigin(0.5);

                const btn = this.add.image(this.scale.width / 2, (this.scale.height / 2) + 120,'btn_volver_a_jugar_0')
                    .setOrigin(0.5).setInteractive({ useHandCursor: true });

                btn.on('pointerover', () => btn.setTexture('btn_volver_a_jugar_1'));
                btn.on('pointerout', () => btn.setTexture('btn_volver_a_jugar_0'));
                btn.on('pointerdown', () => {
                    this.scene.restart({ config: this.levelData, lives: this.gameState.lives, dificultad: this.currentDifficulty });
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

        const nextDifficulty = DifficultyEvaluator.evaluate(this.currentDifficulty, tiempoFinal, estrellasObtenidas, false);

        const stats = {
            Tiempo: tiempoFinal,
            Dificultad: this.currentDifficulty,
            Puntos: (this.gameState.collectedNumbers.length * 10) + (estrellasObtenidas * 20),
            Emocion: estrellasObtenidas === 3 ? 3 : 2,
            Monedas: estrellasObtenidas
        };
        EventBus.emit('gameOverStats', stats);

        const textoEstrellas = estrellasObtenidas === 1 ? 'estrella' : 'estrellas';

        this.add.text(this.scale.width / 2, this.scale.height / 2, 'NIVEL COMPLETADO', {
            fontSize: '40px', color: '#0f0', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, (this.scale.height / 2) + 50, `Ganaste ${estrellasObtenidas} ${textoEstrellas}`, {
            fontSize: '30px', color: '#ff0', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        EventBus.emit('updateCoins', estrellasObtenidas);
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
                    nextData: { win: true, config: this.levelData, dificultad: nextDifficulty }
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
            Puntos: this.gameState.collectedNumbers.length * 10,
            Emocion: 1,
            Monedas: 0
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
            this.scene.restart({ config: this.levelData, lives: 3, dificultad: loweredDifficulty });
        });
    }
}