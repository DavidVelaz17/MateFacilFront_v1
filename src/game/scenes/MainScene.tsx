import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Cargamos una imagen de prueba (puedes usar cualquier URL de imagen)
        this.load.image('logo', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png');
    }

    create() {
        const logo = this.physics.add.image(400, 300, 'logo');
        logo.setVelocity(200, 200);
        logo.setBounce(1, 1);
        logo.setCollideWorldBounds(true);

        this.add.text(10, 10, '¡Phaser + Next.js Funcionando!', { color: '#00ff00' });
    }
}