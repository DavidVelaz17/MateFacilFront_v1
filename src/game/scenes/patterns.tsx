import * as Phaser from 'phaser';

export const MapConfig = {
    // Coordenadas de los puntos del Mapa Tierra
    pointDataTierra: [
        { x: 216, y: 887 }, // Punto 1 (Verde)
        { x: 493, y: 721 }, // Punto 2 (Púrpura)
        { x: 301, y: 284 }, // Punto 3 (Amarillo)
        { x: 914, y: 295 }  // Punto 4 (Rosa)
    ],
    // Coordenadas de los puntos del Mapa Agua
    pointDataAgua: [
        { x: 137, y: 853 }, // Punto 1 (Verde)
        { x: 809, y: 818 }, // Punto 2 (Azul claro)
        { x: 326, y: 310 }, // Punto 3 (Amarillo)
        { x: 746, y: 280 }  // Punto 4 (Rosa)
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
        this.door = this.scene.physics.add.staticSprite(x, y, 'door').setScale(0.25).refreshBody();
        return this;
    }

    addRandomPlatformsWithItems(platformCount: number, itemsToPlace: number[]) {
        // Ajusta estas medidas según el tamaño real de tu imagen 'platform.png'
        const texture = this.scene.textures.get('platform').getSourceImage();
        const scale = 0.1;
        const pWidth = texture.width * scale;
        const pHeight = texture.height * scale;
        // Padding: Cuánto espacio extra dejamos entre plataformas para que el axolote pueda pasar
        const paddingX = 60;
        const paddingY = 80;
        const maxJumpDistanceX = 200; // Distancia máxima horizontal segura
        const maxJumpDistanceY = 160; // Altura máxima vertical segura

        const startY = this.boundsHeight - 120;
        // Guardamos las coordenadas de las plataformas que vamos validando
        const placedPositions: {x: number, y: number}[] = [
            { x: 100, y: startY}
        ];

        // Hacemos una copia del arreglo de ítems para ir sacándolos
        const itemsQueue = [...itemsToPlace];

        for (let i = 0; i < platformCount; i++) {
            let isValid = false;
            let attempts = 0;
            let randX = 0;
            let randY = 0;

            // Intentamos hasta 100 veces encontrar un hueco libre para cada plataforma
            while (!isValid && attempts < 150) {
                // Generar posición aleatoria (evitando los bordes de la pantalla)
                randX = Phaser.Math.Between(pWidth, this.boundsWidth - pWidth);
                randY = Phaser.Math.Between(100, this.boundsHeight - 140);

                // 1. Evitar que se generen encima del jugador (Inicio) o la puerta (Final)
                const isNearStart = randX < 150 && randY > this.boundsHeight - 150;
                const isNearDoor = randX > this.boundsWidth - 250 && randY > this.boundsHeight - 250;

                isValid = !isNearStart && !isNearDoor;

                // 2. Comprobar que no choque con plataformas ya colocadas
                if (isValid) {
                    let isReachable = false;
                    let isOverlapping = false;
                    for (const pos of placedPositions) {
                        const distanceX = Math.abs(randX - pos.x);
                        const distanceY = pos.y - randY;
                        const absoluteDistY = Math.abs(distanceY);

                        // Si la distancia horizontal Y vertical es menor al tamaño + padding, colisionan
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

            // Si después de los intentos encontramos un lugar válido...
            if (isValid) {
                // La dibujamos físicamente
                this.addPlatform(randX, randY);
                // Guardamos sus coordenadas para que las siguientes no choquen con esta
                placedPositions.push({ x: randX, y: randY });

                // ¿Quedan números por colocar? Lo ponemos 40 píxeles por encima de esta plataforma
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

        EventBus.on('updateCoins', updateCoinsHandler, this);
        EventBus.on('updateTime', updateTimeHandler, this);

        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off('updateTime', updateTimeHandler, this);
            EventBus.off('updateCoins', updateCoinsHandler, this);
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