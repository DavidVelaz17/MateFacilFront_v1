import * as Phaser from 'phaser';
import { EventBus, MapConfig } from './patterns';

export class MapScene extends Phaser.Scene {
    private static currentLevelPointTierra: number = 0; // Puntos: 0, 1, 2, 3
    private static currentLevelPointAgua: number = 0;
    private levelData: any;
    private currentElement: 'tierra' | 'agua' = 'tierra';
    private playerNode: Phaser.GameObjects.Arc | null = null;
    private playerAvatar: Phaser.GameObjects.Sprite | null = null;
    private justWon: boolean = false;

    constructor() {
        super('MapScene');
    }

    init(data: any) {
        if (data && data.config) {
            this.levelData = data.config;
            this.currentElement = data.config.element || data.config.selectedElement || 'tierra';
        }
        this.justWon = data && data.win ? true : false;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const mapKey = this.currentElement === 'agua' ? 'mapa_agua' : 'mapa_tierra';

        this.add.image(0, 0, mapKey).setOrigin(0, 0).setDisplaySize(width, height);
        this.add.text(width / 2, 50, `Mundo ${this.currentElement === 'tierra' ? 'Terrestre' : 'Acuático'}`, {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const pointData = this.currentElement === 'tierra' ? MapConfig.pointDataTierra : MapConfig.pointDataAgua;
        const currentPointIndex = this.currentElement === 'tierra' ? MapScene.currentLevelPointTierra : MapScene.currentLevelPointAgua;

        if (currentPointIndex < pointData.length) {
            const currentPoint = pointData[currentPointIndex];
            this.playerAvatar = this.add.sprite(currentPoint.x, currentPoint.y, 'axolotl_idle').setScale(1.5).setDepth(100);
            if (!this.anims.exists('idle_map')) {
                this.anims.create({
                    key: 'idle_map',
                    frames: this.anims.generateFrameNumbers('axolotl_idle', { start: 0, end: 3 }),
                    frameRate: 5,
                    repeat: -1
                });
            }
            this.playerAvatar.play('idle_map');
        }

        const playButton = this.add.image(width / 2, height / 2, 'btn_jugar_0')
            .setOrigin(-2.8,-4.5).setInteractive();
        playButton.on('pointerover', () => playButton.setTexture('btn_jugar_1' ));
        playButton.on('pointerout', () => playButton.setTexture('btn_jugar_0' ));
        playButton.on('pointerdown', () => {
            const finalLevelData = this.prepareLevelData(currentPointIndex);
            this.scene.start('GameScene', { config: finalLevelData, mode: 'historia' });
        });

        const returnButton = this.add.image(width / 2, height / 2, 'btn_menu_0')
            .setOrigin(4,5.8).setInteractive();

        returnButton.on('pointerover', () => returnButton.setTexture('btn_menu_1'));
        returnButton.on('pointerout', () => returnButton.setTexture('btn_menu_0'));
        returnButton.on('pointerdown', () => {
            const finalLevelData = this.prepareLevelData(currentPointIndex);
            this.scene.start('MainMenuScene', { config: finalLevelData, mode: 'historia' });
        });


        if (this.justWon) {
            this.justWon = false;
            this.time.delayedCall(500, () => {
                this.advancePlayerCharacter();
            });
        }
    }

    private prepareLevelData(currentPointIndex: number): any {
        const operationGroup = this.levelData.selectedOperations;
        const numTrampas = 3;
        let operation: string = 'suma';

        if (operationGroup === 'suma_resta') {
            operation = currentPointIndex % 2 === 0 ? 'suma' : 'resta';
        } else if (operationGroup === 'mult_div') {
            operation = currentPointIndex % 2 === 0 ? 'multiplicacion' : 'division';
        }

        const data: any = {
            element: this.currentElement,
            operation: operation,
            cifras: [120, 280],
            resultado: 400,
            numCifras: 2,
            numTrampas: numTrampas,
            trampas: [300, 500, 150],
            type: 'repaso'
        };

        if (this.currentElement === 'agua') {
            data.cifras = [15, 10];
            data.resultado = 150;
            data.trampas = [25, 1500, 105, 50];
            data.timeLimit = 120; // 2 minutos
            data.type = 'prueba';
        }

        return data;
    }

    private advancePlayerCharacter() {
        const pointData = this.currentElement === 'tierra' ? MapConfig.pointDataTierra : MapConfig.pointDataAgua;
        const currentPointIndex = this.currentElement === 'tierra' ? MapScene.currentLevelPointTierra : MapScene.currentLevelPointAgua;

        if (currentPointIndex < pointData.length - 1) {
            if (this.currentElement === 'tierra') {
                MapScene.currentLevelPointTierra++;
            } else {
                MapScene.currentLevelPointAgua++;
            }

            const nextPointIndex = currentPointIndex + 1;
            const nextPoint = pointData[nextPointIndex];

            this.tweens.add({
                targets: this.playerAvatar,
                x: nextPoint.x,
                y: nextPoint.y,
                duration: 1000,
                ease: 'Power2'
            });
        }
    }
}