import Phaser from 'phaser';
import {
    EventBus, MathStrategy, EmotionContext,
    SadState, HappyState, LevelBuilder, UIFacade, NumberItem, SuperHappyState, SuperSadState
} from './patterns';

export class MainScene extends Phaser.Scene {
    // Declaración de propiedades para TypeScript
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private ui!: UIFacade;
    private emotionState!: EmotionContext;
    private doorStrategy!: MathStrategy;
    private bgMusic!: Phaser.Sound.BaseSound;

    // Estado del nivel
    private gameState = {
        collectedNumbers: [] as number[],
        elapsedTime: 0,
        doorFailed: false,
        isGameOver: false
    };

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bg', '/assets/bg.jpg');
        this.load.image('platform', '/assets/platform.png');
        this.load.image('door', '/assets/door.png');
        this.load.image("door_open", "/assets/door_open.png");
        this.load.image('axolotl', '/assets/axolote_standing.png');
        this.load.spritesheet('axolotl_idle', '/assets/axolote_idle32x32.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('axolotl_walking', '/assets/axolote_walking32x32.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.image('bar_bg', '/assets/bar_background4.png');

        this.load.image('avatar_normal', '/assets/avatar_normal.png');
        this.load.image('avatar_supersad', '/assets/avatar_muytriste.png');
        this.load.image('avatar_superhappy', '/assets/avatar_muyfeliz.png');
        this.load.image('avatar_sad', '/assets/avatar_triste.png');
        this.load.image('avatar_happy', '/assets/avatar_feliz.png');
        this.load.audio('bg_music', '/assets/bg_sound.mp3');
    }

    create() {
        const gameWidth = 800;
        const gameHeight = 600;
        const barHeight = 120; // Digamos que la barra mide 120px de alto
        const playableHeight = gameHeight - barHeight; // 480px jugables
        this.add.image(0, 0, 'bg').setOrigin(0,0).setDisplaySize(gameWidth, playableHeight);
        this.ui = new UIFacade(this);
        this.ui.createBottomBar(gameWidth, gameHeight, barHeight);

        const builder = new LevelBuilder(this);
        const level = builder
            .setPlayableBounds(gameWidth, playableHeight)
            .addPlatform(300, 360).addPlatform(200, 460).addPlatform(500, 260)
            .addPlatform(150, 380).addPlatform(650, 300).addPlatform(400, 200)
            .addNumberItem(150, 330, 5)
            .addNumberItem(400, 150, 10)
            .addNumberItem(650, 250, 3)
            .addNumberItem(200, 410, 7)
            .addDoor(750, 400)
            .build();

        this.player = this.physics.add.sprite(50, 400, 'axolotl_idle').setScale(1.5);
        this.player.setBounce(0.1).setCollideWorldBounds(true);

        this.emotionState = new EmotionContext(this.player, this.ui.getEmotionImageObject());
        this.doorStrategy = new MathStrategy();

        // Físicas
        this.physics.add.collider(this.player, level.platforms);
        this.physics.add.collider(level.items, level.platforms);

        // Colisiones
        this.physics.add.overlap(this.player, level.items, this.handleItemCollection as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        if (level.door) {
            this.physics.add.overlap(this.player, level.door, this.handleDoorCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        }

        // Es seguro usar ! aquí porque createCursorKeys nunca devuelve null en este contexto
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.ui.setEquationText("? x ? = 50");

        this.anims.create({
            key: 'idle',
            // La sprite sheet tiene 4 cuadritos (del 0 al 3)
            frames: this.anims.generateFrameNumbers('axolotl_idle', { start: 0, end: 3 }),
            frameRate: 5, // 6 cuadros por segundo (más lento porque solo está respirando)
            repeat: -1    // -1 hace que se repita en un bucle infinito
        });
        // Animación de caminar
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('axolotl_walking', { start: 0, end: 3 }),
            frameRate: 7, // Velocidad de la animación (frames por segundo)
            repeat: -1     // -1 significa que se repite en bucle infinito
        });

        // Hacemos que empiece a reproducirse inmediatamente al iniciar el nivel
        this.player.play('idle');

        // --- 2. CONFIGURAR Y REPRODUCIR LA MÚSICA ---
        this.bgMusic = this.sound.add('bg_music', {
            volume: 0.3,   // 0.3 (30%) para que no sature
            loop: true     // <--- ESTO HACE QUE SE REPITA AL INFINITO
        });

        this.bgMusic.play();
    }

    update(_time: number, delta: number) {
        if (!this.gameState.isGameOver) {
            this.gameState.elapsedTime += delta / 1000;
            EventBus.emit('updateTime', this.gameState.elapsedTime);
        }
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        const {left, right, up} = this.cursors;

        if (left.isDown){
            this.player.setVelocityX(-160);
            this.player.play('walk', true); // Reproduce 'walk' (el true evita que se reinicie si ya está sonando)
            this.player.setFlipX(true);     // Voltea el sprite para que mire a la izquierda
        }
        else if (right.isDown){
            this.player.setVelocityX(160);
            this.player.play('walk', true);
            this.player.setFlipX(false);
        }
        else {
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

            if (numItem.itemValue !== 5 && numItem.itemValue !== 10) {
                this.emotionState.transitionTo(new SadState());
                this.gameState.doorFailed = true;
            }else{
                this.emotionState.transitionTo(new HappyState());
                this.gameState.doorFailed = false;
            }
            numItem.destroy();
        }
    }

    private handleDoorCollision(player: Phaser.GameObjects.GameObject, door: Phaser.GameObjects.GameObject) {
        const doorSprite = door as Phaser.Physics.Arcade.Sprite;

        if (this.gameState.doorFailed) {
            this.emotionState.transitionTo(new SuperSadState());
            this.gameState.isGameOver = true;
            // --- 3. DETENER LA MÚSICA AL GANAR ---
            if (this.bgMusic && this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }
            this.physics.pause();
            this.add.text(400, 300, 'Vuelve a intentarlo', {
                fontSize: '40px', fill: '#0f0', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);
            return;
        }

        const canOpen = this.doorStrategy.validate(this.gameState.collectedNumbers);

        if (canOpen) {
            this.gameState.isGameOver = true;
            this.emotionState.transitionTo(new SuperHappyState());
            doorSprite.setTexture('door_open');
            this.physics.pause();
            this.add.text(400, 300, '¡NIVEL COMPLETADO!', {
                fontSize: '40px', fill: '#0f0', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);
            this.add.text(400, 350, 'Ganaste una estella', {
                fontSize: '40px', fill: '#0f0', stroke: '#000', strokeThickness: 6
            }).setOrigin(0.5);
            EventBus.emit('updateCoins',1)
        }
    }
}