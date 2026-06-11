import * as Phaser from 'phaser';
import {audioManager} from "@/game/scenes/audioManager";

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        audioManager(this, 'bg_map');
        this.add.image(0, 0, 'main_menu_base').setOrigin(0, 0).setDisplaySize(width, height);

        const tierraArea = this.add.zone(0, 0, width, height / 2).setOrigin(0, 0);
        tierraArea.setInteractive();

        tierraArea.on('pointerover', () => {
            this.game.canvas.style.cursor = 'pointer';
        });
        tierraArea.on('pointerout', () => {
            this.game.canvas.style.cursor = 'default';
        });

        tierraArea.on('pointerdown', () => {
            this.handleSelection('tierra', 'suma_resta');
        });

        const aguaArea = this.add.zone(0, height / 2, width, height / 2).setOrigin(0, 0);
        aguaArea.setInteractive();

        aguaArea.on('pointerover', () => {
            this.game.canvas.style.cursor = 'pointer';
        });
        aguaArea.on('pointerout', () => {
            this.game.canvas.style.cursor = 'default';
        });

        aguaArea.on('pointerdown', () => {
            this.handleSelection('agua', 'mult_div');
        });

        this.add.text(width / 2, height - 20, '¡Selecciona el mundo para Jugar!', {
            fontSize: '18px',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5,27);
    }

    private handleSelection(element: 'tierra' | 'agua', operationGroup: string) {
        this.scene.start('MapScene', {
            config: {
                gameMode: 'historia',
                selectedElement: element,
                selectedOperations: operationGroup
            }
        });
    }
}