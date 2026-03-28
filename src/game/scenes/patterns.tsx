import Phaser from 'phaser';

// ==========================================
// 1. OBSERVER
// ==========================================
export const EventBus = new Phaser.Events.EventEmitter();

// ==========================================
// 2. STRATEGY
// ==========================================
export class MathStrategy {
    validate(numbersCollected: number[]): boolean {
        if (numbersCollected.length !== 2) return false;
        return numbersCollected.includes(5) && numbersCollected.includes(10);
    }
}

// ==========================================
// 3. STATE
// ==========================================
export interface EmotionState {
    // --- ACTUALIZADO: toma una imagen de la interfaz en vez de un texto ---
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image): void;
}

export class EmotionContext {
    private player: Phaser.GameObjects.Sprite;
    // --- CAMBIADO DE TEXT A IMAGE PARA LA INTERFAZ ---
    private uiEmotionImage: Phaser.GameObjects.Image;
    private state!: EmotionState;

    constructor(playerSprite: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        this.player = playerSprite;
        this.uiEmotionImage = uiEmotionImage;
        this.transitionTo(new NormalState());
    }

    transitionTo(state: EmotionState) {
        this.state = state;
        // --- LLAMADA ACTUALIZADA ---
        this.state.apply(this.player, this.uiEmotionImage);
    }
}

class NormalState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        player.clearTint();
        // --- CAMBIA LA TEXTURA DE LA IMAGEN EN LA INTERFAZ DE USUARIO ---
        uiEmotionImage.setTexture('avatar_normal');
    }
}

export class SadState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        // --- CAMBIA LA TEXTURA DE LA IMAGEN EN LA INTERFAZ DE USUARIO ---
        uiEmotionImage.setTexture('avatar_sad');
    }
}

export class HappyState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        // --- CAMBIA LA TEXTURA DE LA IMAGEN EN LA INTERFAZ DE USUARIO ---
        uiEmotionImage.setTexture('avatar_happy');
    }
}
export class SuperHappyState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        // --- CAMBIA LA TEXTURA DE LA IMAGEN EN LA INTERFAZ DE USUARIO ---
        uiEmotionImage.setTexture('avatar_superhappy');
    }
}
export class SuperSadState implements EmotionState {
    apply(player: Phaser.GameObjects.Sprite, uiEmotionImage: Phaser.GameObjects.Image) {
        // --- CAMBIA LA TEXTURA DE LA IMAGEN EN LA INTERFAZ DE USUARIO ---
        uiEmotionImage.setTexture('avatar_supersad');
    }
}

// ==========================================
// 4. FACTORY METHOD
// ==========================================
// Extendemos el tipo Text de Phaser para agregarle nuestras propiedades custom
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

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.platforms = scene.physics.add.staticGroup();
        this.items = scene.physics.add.group();
    }
    public setPlayableBounds(width: number, height: number): this {
        this.scene.physics.world.setBounds(0, 0, width, height);
        return this;
    }
    addPlatform(x: number, y: number) {
        const platform = this.platforms.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
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
        this.door = this.scene.physics.add.staticSprite(x, y, 'door').setScale(0.4).refreshBody();
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

        EventBus.on('updateCoins', (coins: number) => {
            if (this.coinsText) this.coinsText.setText(`Estrellas: ${coins}`);
        });

        EventBus.on('updateTime', (time: number) => {
            if (this.timeText) this.timeText.setText(`Tiempo: ${Math.floor(time)}s`);
        });
    }

    public createBottomBar(gameWidth: number, gameHeight: number, barHeight: number) {
        const playableHeight = gameHeight - barHeight;
        const barCenterY = playableHeight + (barHeight / 2);

        // --- FONDO DE LA BARRA ---
        this.scene.add.image(gameWidth / 2, barCenterY, 'bar_bg')
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

        this.livesText = this.scene.add.text(leftPanelX, barCenterY - 25, 'Vidas: 3', style)
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
            fill: '#fff',
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
}