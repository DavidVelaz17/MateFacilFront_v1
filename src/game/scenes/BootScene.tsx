import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create(data: any) {
        const reactData = data?.config;
        console.log("1. BootScene recibió:", data);
        console.log("2. reactData extraído:", reactData);
        if (reactData && reactData.mode === 'custom') {
            this.scene.start('GameScene', { config: reactData.config, mode: 'custom' });
        } else {
            this.scene.start('MainMenuScene');
        }
    }
}