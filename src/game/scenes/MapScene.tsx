import * as Phaser from 'phaser';
import { EventBus, MapConfig } from './patterns';
import { LevelsTierra, LevelsAgua } from "@/game/scenes/LevelsData";
import { audioManager } from "@/game/scenes/audioManager";

export class MapScene extends Phaser.Scene {
    private static currentLevelPointTierra: number = 0; // Puntos: 0, 1, 2, 3
    private static currentLevelPointAgua: number = 0;
    private levelData: any;
    private currentElement: 'tierra' | 'agua' = 'tierra';
    private playerNode: Phaser.GameObjects.Arc | null = null;
    private playerAvatar: Phaser.GameObjects.Sprite | null = null;
    private justWon: boolean = false;
    private totalStars: number = 0;

    constructor() {
        super('MapScene');
    }

    init(data: any) {
        if (data && data.config) {
            this.levelData = data.config;
            this.currentElement = data.config.element || data.config.selectedElement || 'tierra';
        }
        this.justWon = data && data.win ? true : false;
        this.totalStars = this.registry.get('totalStars') || 0;

        // Conservamos la dificultad si viene heredada desde GameScene, si no, inicia en Normal (2)
        if (data && data.dificultad !== undefined) {
            this.levelData.dificultad = data.dificultad;
        } else if (!this.levelData.dificultad) {
            this.levelData.dificultad = 2; // Default a Normal
        }
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

        const isWorldCompleted = currentPointIndex >= pointData.length;
        const displayPointIndex = isWorldCompleted ? pointData.length - 1 : currentPointIndex;

        if (displayPointIndex < pointData.length) {
            const currentPoint = pointData[displayPointIndex];
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
            .setOrigin(-2.8, -4.5).setInteractive();

        playButton.on('pointerover', () => playButton.setTexture('btn_jugar_1'));
        playButton.on('pointerout', () => playButton.setTexture('btn_jugar_0'));

        playButton.on('pointerdown', () => {
            if (isWorldCompleted) {
                // CONDICIÓN: Si presiona REINICIAR, reseteamos el progreso del mundo a 0
                if (this.currentElement === 'tierra') MapScene.currentLevelPointTierra = 0;
                else MapScene.currentLevelPointAgua = 0;

                this.scene.restart({ config: this.levelData, totalStars: this.totalStars });
            } else {
                const currentIndexFresh = this.currentElement === 'tierra'
                    ? MapScene.currentLevelPointTierra
                    : MapScene.currentLevelPointAgua;

                const finalLevelData = this.prepareLevelData(currentIndexFresh);

                // Extraemos la dificultad actual guardada en el estado del mapa
                const currentDiff = this.levelData.dificultad;

                this.scene.start('TransitionScene', {
                    next: 'GameScene',
                    message: finalLevelData.introText,
                    bg: finalLevelData.bgKey,
                    // Inyectamos la dificultad en nextData para que GameScene la reciba
                    nextData: { config: finalLevelData, mode: 'historia', dificultad: currentDiff, totalStars: this.totalStars }
                });
            }
        });

        const returnButton = this.add.image(width / 2, height / 2, 'btn_menu_0')
            .setOrigin(4, 5.8).setInteractive();

        returnButton.on('pointerover', () => returnButton.setTexture('btn_menu_1'));
        returnButton.on('pointerout', () => returnButton.setTexture('btn_menu_0'));
        returnButton.on('pointerdown', () => {
            const finalLevelData = this.prepareLevelData(currentPointIndex);
            this.scene.start('MainMenuScene', { config: finalLevelData, mode: 'historia', totalStars: this.totalStars });
        });

        audioManager(this, 'bg_map');

        if (this.justWon) {
            this.justWon = false;
            this.time.delayedCall(500, () => {
                this.advancePlayerCharacter();
            });
        }
    }

    private prepareLevelData(currentPointIndex: number): any {
        let levelConfig: any;

        // Seleccionamos la configuración correspondiente al mundo actual
        if (this.currentElement === 'tierra') {
            const safeIndex = Math.min(currentPointIndex, LevelsTierra.length - 1);
            levelConfig = LevelsTierra[safeIndex];
        } else {
            const safeIndex = Math.min(currentPointIndex, LevelsAgua.length - 1);
            levelConfig = LevelsAgua[safeIndex];
        }

        // Armamos el objeto base. No extraemos cifras, resultado o trampas aquí
        // porque GameScene las extraerá basándose en la dificultad que reciba.
        const data: any = {
            element: this.currentElement,
            operation: levelConfig.operation,
            type: levelConfig.type,
            bgKey: levelConfig.bgKey,
            introText: levelConfig.introText,
            successText: levelConfig.successText,
            // Pasamos el objeto COMPLETO de problemas para que GameScene elija
            problemas: levelConfig.problemas
        };

        if (levelConfig.timeLimit) {
            data.timeLimit = levelConfig.timeLimit;
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
        } else {
            // CONDICIÓN: Si ganó el último nivel, aumentamos el contador
            // una posición más allá del límite para marcarlo como resuelto.
            if (this.currentElement === 'tierra') {
                MapScene.currentLevelPointTierra++;
            } else {
                MapScene.currentLevelPointAgua++;
            }
            this.scene.restart({ config: this.levelData });
        }
    }
}