import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create(data: any) {
        // Desempaquetamos lo que React mandó desde el page.tsx
        const reactData = data?.config;
        console.log("1. BootScene recibió:", data);
        console.log("2. reactData extraído:", reactData);
        if (reactData && reactData.mode === 'custom') {
            // El maestro lo configuró, vamos directo a la partida
            this.scene.start('GameScene', { config: reactData.config, mode: 'custom' });
        } else {
            // Es el alumno jugando la campaña
            this.scene.start('MainMenuScene');
        }
    }
}