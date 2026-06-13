import * as Phaser from 'phaser';

export const MapConfig = {
    // Coordenadas de los puntos del Mapa Tierra
    pointDataTierra: [
        { x: 172, y: 519 }, // Punto 1
        { x: 252, y: 209 }, // Punto 2
        { x: 379, y: 407 }, // Punto 3
        { x: 516, y: 495 }, // Punto 4
        { x: 692, y: 211 } // Punto 5
    ],
    // Coordenadas de los puntos del Mapa Agua
    pointDataAgua: [
        { x: 103, y: 520 }, // Punto 1
        { x: 276, y: 169 }, // Punto 2
        { x: 364, y: 314 }, // Punto 3
        { x: 623, y: 464 },  // Punto 4
        { x: 633, y: 206 }  //Punto 5
    ]
};

// ==========================================
// 1. OBSERVER
// ==========================================
export const EventBus = new Phaser.Events.EventEmitter();

// ==========================================
// 2. STRATEGY
// ==========================================
export class MathStrategy {
    private targetNumbers: number[];

    constructor(targets: number[]) {
        this.targetNumbers = targets;
    }

    validate(numbersCollected: number[]): boolean {
        if (numbersCollected.length !== this.targetNumbers.length) return false;
        return this.targetNumbers.every(target => numbersCollected.includes(target));
    }
}

// ==========================================
// 3. STATE
// ==========================================
export interface EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image): void;
}
export class EmotionContext {
    private player: Phaser.GameObjects.Sprite;
    private uiEmotionImage: Phaser.GameObjects.Image;
    private state!: EmotionState;
    constructor(playerSprite: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        this.player = playerSprite;
        this.uiEmotionImage = uiEmotionImage;
        this.transitionTo(new NormalState());
    }
    transitionTo(state: EmotionState) {
        this.state = state;
        this.state.apply(this.player, this.uiEmotionImage);
    }
}
class NormalState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        player.clearTint();
        uiEmotionImage.setTexture('avatar_normal');
    }
}
export class SadState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        uiEmotionImage.setTexture('avatar_sad');
    }
}
export class HappyState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        uiEmotionImage.setTexture('avatar_happy');
    }
}
export class SuperHappyState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        uiEmotionImage.setTexture('avatar_superhappy');
    }
}
export class SuperSadState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        uiEmotionImage.setTexture('avatar_supersad');
    }
}

// ==========================================
// 4. FACTORY METHOD
// ==========================================
export interface NumberItem extends Phaser.GameObjects.Text {
    itemValue: number;
    itemType: string;
}

export class ItemFactory {
    static createNumber(scene: Phaser.Scene, x: number, y: number, value: number): NumberItem {
        const text = scene.add.text(x, y, `${value}`, {
            fontSize: '24px', fontStyle: 'bold', color: '#FFF', backgroundColor: '#000'
        }).setPadding(5) as NumberItem;

        scene.physics.add.existing(text);
        (text.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (text.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        text.itemValue = value;
        text.itemType = 'number';

        return text;
    }
}

// ==========================================
// 5. BUILDER
// ==========================================
export class LevelBuilder {
    private scene: Phaser.Scene;
    private platforms: Phaser.Physics.Arcade.StaticGroup;
    private items: Phaser.Physics.Arcade.Group;
    private door: Phaser.Types.Physics.Arcade.SpriteWithStaticBody | null = null;
    private boundsWidth: number = 800;
    private boundsHeight: number = 600;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.platforms = scene.physics.add.staticGroup();
        this.items = scene.physics.add.group();
    }
    public setPlayableBounds(width: number, height: number): this {
        this.scene.physics.world.setBounds(0, 0, width, height);
        return this;
    }
    addPlatform(x: number, y: number,platformKey:any) {
        const platform = this.platforms.create(x, y, platformKey) as Phaser.Physics.Arcade.Sprite;
        platform.setScale(0.1);
        platform.refreshBody();
        return this;
    }

    addNumberItem(x: number, y: number, value: number) {
        const item = ItemFactory.createNumber(this.scene, x, y, value);
        this.items.add(item);
        return this;
    }

    addDoor(x: number, y: number) {
        this.door = this.scene.physics.add.staticSprite(x, y, 'door').setScale(0.25).refreshBody();
        return this;
    }

    addRandomPlatformsWithItems(platformCount: number, itemsToPlace: number[], platformKey: any) {
        const texture = this.scene.textures.get(platformKey).getSourceImage();
        const scale = 0.1;
        const pWidth = texture.width * scale;
        const pHeight = texture.height * scale;
        const paddingX = 60;
        const paddingY = 80;
        const maxJumpDistanceX = 200; // Distancia máxima horizontal segura
        const maxJumpDistanceY = 160; // Altura máxima vertical segura

        const startY = this.boundsHeight - 120;
        const placedPositions: {x: number, y: number}[] = [
            { x: 100, y: startY}
        ];

        const itemsQueue = [...itemsToPlace];

        for (let i = 0; i < platformCount; i++) {
            let isValid = false;
            let attempts = 0;
            let randX = 0;
            let randY = 0;

            while (!isValid && attempts < 150) {
                randX = Phaser.Math.Between(pWidth, this.boundsWidth - pWidth);
                randY = Phaser.Math.Between(100, this.boundsHeight - 140);

                const isNearStart = randX < 150 && randY > this.boundsHeight - 150;
                const isNearDoor = randX > this.boundsWidth - 250 && randY > this.boundsHeight - 250;

                isValid = !isNearStart && !isNearDoor;

                if (isValid) {
                    let isReachable = false;
                    let isOverlapping = false;
                    for (const pos of placedPositions) {
                        const distanceX = Math.abs(randX - pos.x);
                        const distanceY = pos.y - randY;
                        const absoluteDistY = Math.abs(distanceY);

                        if (distanceX < (pWidth + paddingX) && absoluteDistY < (pHeight + paddingY)) {
                            isOverlapping = true;
                            break; // Dejamos de revisar, ya sabemos que no cabe
                        }
                        if (distanceX <= maxJumpDistanceX && distanceY <= maxJumpDistanceY) {
                            isReachable = true;
                        }
                    }
                    isValid = !isOverlapping && isReachable;
                }
                attempts++;
            }

            if (isValid) {
                this.addPlatform(randX, randY,platformKey);
                placedPositions.push({ x: randX, y: randY });

                if (itemsQueue.length > 0) {
                    const numberValue = itemsQueue.pop()!;
                    this.addNumberItem(randX, randY - 50, numberValue);
                }
            }
        }
        return this;
    }

    build() {
        return { platforms: this.platforms, items: this.items, door: this.door };
    }
}

// ==========================================
// 6. FACADE
// ==========================================
export class UIFacade {
    private livesText!: Phaser.GameObjects.Text;
    private coinsText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private equationText!: Phaser.GameObjects.Text;
    private scene: Phaser.Scene;
    private emotionImage!: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        const updateCoinsHandler = (coins: number) => {
            if (this.coinsText && this.coinsText.active) {
                this.coinsText.setText(`Estrellas: ${coins}`);
            }
        };

        const updateTimeHandler = (time: number) => {
            if (this.timeText && this.timeText.active) {
                this.timeText.setText(`Tiempo: ${time}s`);
            }
        };

        const updateLivesHandler = (lives: number) => {
            if (this.livesText && this.livesText.active) {
                this.livesText.setText(`Vidas: ${lives}`);
            }
        };

        EventBus.on('updateCoins', updateCoinsHandler, this);
        EventBus.on('updateTime', updateTimeHandler, this);
        EventBus.on('updateLives', updateLivesHandler, this);

        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off('updateTime', updateTimeHandler, this);
            EventBus.off('updateCoins', updateCoinsHandler, this);
            EventBus.off('updateLives', updateLivesHandler, this);
        });
    }
    public createBottomBar(gameWidth: number, gameHeight: number, barHeight: number, barBgKey: any, currentLives: number = 3) {
        const playableHeight = gameHeight - barHeight;
        const barCenterY = playableHeight + (barHeight / 2);

        // --- FONDO DE LA BARRA ---
        this.scene.add.image(gameWidth / 2, barCenterY, barBgKey)
            .setDisplaySize(gameWidth, barHeight)
            .setDepth(100);

        // --- AVATAR CENTRAL ---
        this.emotionImage = this.scene.add.image(gameWidth / 2, barCenterY, 'avatar_normal')
            .setOrigin(0.5, 0.5)
            .setScale(3)
            .setDepth(200);

        // --- ESTILO DE TEXTO ---
        const style = {
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: 'system-ui',
            align: 'center'
        };

        // --- POSICIONES X PARA LOS PANELES ---
        const leftPanelX = gameWidth / 5;
        const rightPanelX = (3 * gameWidth) / 4;

        this.livesText = this.scene.add.text(leftPanelX, barCenterY - 25, `Vidas: ${currentLives}`, style)
            .setOrigin(0.5, 0.5)
            .setDepth(200);

        this.coinsText = this.scene.add.text(leftPanelX, barCenterY + 25, 'Estrellas: 0', style)
            .setOrigin(0.5, 0.5)
            .setDepth(200);

        this.timeText = this.scene.add.text(rightPanelX, barCenterY + 25, 'Tiempo: 0s', style)
            .setOrigin(0.5, 0.5)
            .setDepth(200);

        this.equationText = this.scene.add.text(rightPanelX, barCenterY - 24, '? x ? = 50', {
            fontSize: '28px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: 'system-ui',
            fontStyle: 'bold'
        })
            .setOrigin(0.5, 0.5)
            .setDepth(200);
    }
    public setEquationText(equation: string) {
        if (this.equationText) {
            this.equationText.setText(equation);
        }
    }
    getEmotionImageObject(): Phaser.GameObjects.Image {
        return this.emotionImage;
    }
    public createControlButtons(gameWidth: number) {
        const style = {
            fontSize: '22px',
            backgroundColor: '#374151', // Gris oscuro para que resalte
            padding: { x: 10, y: 5 },
            color: '#FFF'
        };

        // 1. BOTÓN MUTEAR (Controla el sonido global directamente)
        let isMuted = this.scene.sound.mute;
        const muteBtn = this.scene.add.image(gameWidth - 110, 30, isMuted ? 'mute' : 'sound_on')
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);

        muteBtn.on('pointerdown', () => {
            isMuted = !isMuted;
            this.scene.sound.mute = isMuted; // Phaser maneja el muteo global automáticamente
            muteBtn.setTexture(isMuted ? 'mute' : 'sound_on');
        });

        // 2. BOTÓN PAUSA (Avisa a GameScene mediante EventBus)
        let isPaused = false;
        const pauseBtn = this.scene.add.image(gameWidth - 50, 30, isPaused ? 'pause': 'play')
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);

        pauseBtn.on('pointerdown', () => {
            isPaused = !isPaused;
            pauseBtn.setTexture(isPaused ? 'pause' : 'play');
            EventBus.emit('togglePause', isPaused);
        });
    }
}

export class DifficultyEvaluator {
    /**
     * Calcula y retorna el nuevo nivel de dificultad (1, 2 o 3)
     */
    public static evaluate(currentDifficulty: number, timeSeconds: number, lives: number, isRestart: boolean): number {
        let shift = 0;

        if (isRestart) {
            // Disminuye la dificultad si el discente reinicia el nivel (derrota)
            shift = -1;
        } else {
            // Regla de tiempo y vidas en caso de victoria
            if (timeSeconds >= 120 || lives <= 1) {
                shift = -1; // Disminuye si tarda > 2 mins o casi pierde
            } else if (timeSeconds <= 30 && lives === 3) {
                shift = 1;  // Aumenta si es muy rápido (< 30s) y perfecto
            }
        }

        // Phaser.Math.Clamp asegura que el valor nunca baje de 1 ni suba de 3
        return Phaser.Math.Clamp(currentDifficulty + shift, 1, 3);
    }
}