import Phaser from 'phaser';
import {
    EventBus, MathStrategy, EmotionContext,
    SadState, HappyState, LevelBuilder, UIFacade, NumberItem, SuperHappyState, SuperSadState
} from './patterns';

export class MainScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private itemsGroup!: Phaser.Physics.Arcade.Group;
    private ui!: UIFacade;
    private emotionState!: EmotionContext;
    private doorStrategy!: MathStrategy;
    private bgMusic!: Phaser.Sound.BaseSound;

    // Variable para guardar la configuración cruda que viene de React
    private customModeData: any = null;

    private levelConfig = {
        targetNumbers: [400, 30],
        solution: 12000,
        platformCount: 7,
        trapNumbers: [200, 20, 150]
    };

    private gameState = {
        collectedNumbers: [] as number[],
        elapsedTime: 0,
        lastEmittedTime: 0,
        doorFailed: false,
        isGameOver: false
    };

    constructor() {
        super('MainScene');
    }

    init(data: any) {
        this.gameState = { collectedNumbers: [], elapsedTime: 0, lastEmittedTime: 0, doorFailed: false, isGameOver: false };

        if (data && data.config) {
            this.customModeData = data.config;

            // Convertimos los strings del formulario a números reales para Phaser
            this.levelConfig.targetNumbers = this.customModeData.cifras.map(Number);
            this.levelConfig.trapNumbers = this.customModeData.trampas.map(Number);
            this.levelConfig.solution = Number(this.customModeData.resultado);

            // Calculamos cuántas plataformas necesitamos.
            // Sumamos los buenos + las trampas + 2 plataformas extra de colchón
            this.levelConfig.platformCount = this.levelConfig.targetNumbers.length + this.levelConfig.trapNumbers.length + 2;
        }
    }
    preload() {
        this.load.image('bg', '/assets/bg.jpg');
        this.load.image('platform', '/assets/platform.png');
        this.load.image('door', '/assets/door.png');
        this.load.image("door_open", "/assets/door_open.png");
        this.load.image('axolotl', '/assets/axolote_standing.png');
        this.load.spritesheet('axolotl_idle', '/assets/axolote_idle32x32.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('axolotl_walking', '/assets/axolote_walking32x32.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('bar_bg', '/assets/bar_background4.png');
        this.load.image('avatar_normal', '/assets/avatar_normal.png');
        this.load.image('avatar_supersad', '/assets/avatar_muytriste.png');
        this.load.image('avatar_superhappy', '/assets/avatar_muyfeliz.png');
        this.load.image('avatar_sad', '/assets/avatar_triste.png');
        this.load.image('avatar_happy', '/assets/avatar_feliz.png');
        this.load.audio('bg_music', '/assets/bg_sound.mp3');
    }

    create() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const barHeight = 120;
        const playableHeight = gameHeight - barHeight;

        this.physics.world.setBounds(0, 0, gameWidth, playableHeight);

        this.add.image(0, 0, 'bg').setOrigin(0,0).setDisplaySize(gameWidth, playableHeight);

        this.ui = new UIFacade(this);
        this.ui.createBottomBar(gameWidth, gameHeight, barHeight);

        const builder = new LevelBuilder(this);
        const numbersForThisLevel = [...this.levelConfig.targetNumbers, ...this.levelConfig.trapNumbers];

        const level = builder
            .setPlayableBounds(gameWidth, playableHeight)
            .addDoor(gameWidth - 50, playableHeight - 50)
            .addRandomPlatformsWithItems(this.levelConfig.platformCount, numbersForThisLevel)
            .build();

        this.player = this.physics.add.sprite(50, playableHeight - 50, 'axolotl_idle').setScale(1.5);
        this.player.setBounce(0.1).setCollideWorldBounds(true);

        this.emotionState = new EmotionContext(this.player, this.ui.getEmotionImageObject());
        this.doorStrategy = new MathStrategy(this.levelConfig.targetNumbers);
        this.itemsGroup = level.items;

        this.physics.add.collider(this.player, level.platforms);
        this.physics.add.collider(level.items, level.platforms);

        if (level.door) {
            this.physics.add.overlap(this.player, level.door, this.handleDoorCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        }

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // 2. CONSTRUIMOS LA ECUACIÓN DINÁMICA DE LA INTERFAZ
        let equationString = "? x ? = 50"; // Por defecto

        if (this.customModeData) {
            let symbol = '+';
            switch(this.customModeData.operation) {
                case 'suma': symbol = '+'; break;
                case 'resta': symbol = '-'; break;
                case 'multiplicacion': symbol = 'x'; break;
                case 'division': symbol = '÷'; break;
            }

            // Si son 3 cifras, genera "? + ? + ?", si son 2 genera "? + ?"
            const questionMarks = Array(this.customModeData.numCifras).fill('?').join(` ${symbol} `);
            equationString = `${questionMarks} = ${this.levelConfig.solution}`;
        }

        this.ui.setEquationText(equationString);
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
        this.player.play('idle');

        this.bgMusic = this.sound.add('bg_music', { volume: 0.3, loop: true });
        this.bgMusic.play();
    }

    update(_time: number, delta: number) {
        if (!this.gameState.isGameOver) {
            this.gameState.elapsedTime += delta / 1000;
            const currentSecond = Math.floor(this.gameState.elapsedTime);

            // Verificamos si es una "prueba" con tiempo límite
            if (this.customModeData && this.customModeData.type === 'prueba') {
                const timeLimit = Number(this.customModeData.timeLimit);
                const timeLeft = timeLimit - currentSecond;

                // Solo actualizamos la UI cada segundo
                if (currentSecond > this.gameState.lastEmittedTime) {
                    EventBus.emit('updateTime', timeLeft > 0 ? timeLeft : 0);
                    this.gameState.lastEmittedTime = currentSecond;
                }

                // SI SE ACABA EL TIEMPO:
                if (timeLeft <= 0) {
                    this.triggerTimeOut();
                }

            } else {
                // Modo Repaso o Historia (Cronómetro normal ascendente)
                if (currentSecond > this.gameState.lastEmittedTime) {
                    EventBus.emit('updateTime', currentSecond);
                    this.gameState.lastEmittedTime = currentSecond;
                }
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.physics.overlap(this.player, this.itemsGroup, this.handleItemCollection as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
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

        if (this.gameState.doorFailed) {
            this.emotionState.transitionTo(new SuperSadState());
            this.gameState.isGameOver = true;
            if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();
            this.physics.pause();
            this.add.text(this.scale.width / 2, this.scale.height / 2, 'Vuelve a intentarlo', {
                fontSize: '40px', fill: '#f00', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);
            return;
        }


        const canOpen = this.doorStrategy.validate(this.gameState.collectedNumbers);

        if (canOpen) {
            this.gameState.isGameOver = true;
            this.emotionState.transitionTo(new SuperHappyState());
            doorSprite.setTexture('door_open');
            if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();
            this.physics.pause();

            this.add.text(this.scale.width / 2, this.scale.height / 2, '¡NIVEL COMPLETADO!', {
                fontSize: '40px', fill: '#0f0', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);
            this.add.text(this.scale.width / 2, (this.scale.height / 2) + 50, 'Ganaste una estrella', {
                fontSize: '30px', fill: '#ff0', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);

            EventBus.emit('updateCoins', 1);
        }
    }
    private triggerTimeOut() {
        this.gameState.isGameOver = true;
        this.emotionState.transitionTo(new SuperSadState());

        if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();
        this.physics.pause();

        this.add.text(this.scale.width / 2, this.scale.height / 2, '¡SE ACABÓ EL TIEMPO!', {
            fontSize: '40px', fill: '#f00', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);
    }
}