import * as Phaser from 'phaser';
import {audioManager} from "@/game/scenes/audioManager";

export class TransitionScene extends Phaser.Scene {
    private nextSceneKey: string = '';
    private message: string = '';
    private bgKey: string = '';
    private nextSceneData: any = {};

    constructor() {
        super('TransitionScene');
    }

    init(data: { next: string, message: string, bg: string, nextData: any }) {
        this.nextSceneKey = data.next;
        this.message = data.message;
        this.bgKey = data.bg;
        this.nextSceneData = data.nextData;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(width, height);

        const textY = height * 0.85;
        const textMaxWidth = width * 0.85;

        this.add.text(width/2, textY, this.message, {
            fontSize: '20px',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center',
            wordWrap: { width:textMaxWidth }
        }).setOrigin(0.5);

        const buttonY = height * 0.70;

        const btnMap = this.add.image((width/2)-285, buttonY, 'btn_menu_0') //TODO cambiar asset a map
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMap.on('pointerover', () => btnMap.setTexture('btn_menu_1'));
        btnMap.on('pointerout', () => btnMap.setTexture('btn_menu_0'));
        btnMap.on('pointerdown', () => {
            const mapData = this.nextSceneData && this.nextSceneData.config
                ? { config: this.nextSceneData.config }
                : {};

            this.scene.start('MapScene', mapData);
        });

        const btn = this.add.image((width/2)+250, buttonY, 'btn_continuar_0')
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setTexture('btn_continuar_1'));
        btn.on('pointerout', () => btn.setTexture('btn_continuar_0'));
        btn.on('pointerdown', () => {
            this.scene.start(this.nextSceneKey, this.nextSceneData);
        });
        audioManager(this,'bg_map')
    }
}