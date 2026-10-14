import * as Phaser from 'phaser';
import { audioManager } from "@/game/scenes/audioManager";

// Tamano original de logros.png; las posiciones de abajo se midieron sobre
// esa imagen y se escalan al lienzo al dibujar.
const IMAGEN_LOGROS = { width: 800, height: 618 };
const ESTRELLA_SIZE = 30;

// Centro de la estrella que esta arriba de cada logro en logros.png.
const POSICION_ESTRELLAS: Record<string, { x: number; y: number }> = {
    primera_perfecta: { x: 206.5, y: 130.5 },
    sin_rasgunos: { x: 206.5, y: 210.5 },
    segunda_oportunidad: { x: 207, y: 290.5 },
    mundo_terrestre: { x: 207, y: 371.5 },
    mundo_acuatico: { x: 206.5, y: 451.5 },

    maestro_suma: { x: 413, y: 129 },
    maestro_resta: { x: 413, y: 209.5 },
    maestro_multiplicacion: { x: 412.5, y: 289 },
    maestro_division: { x: 412.5, y: 370.5 },
    rayo: { x: 413, y: 450.5 },

    nunca_te_rindes: { x: 604.5, y: 130.5 },
    remontada: { x: 604.5, y: 210.5 },
    vuelta_al_ruedo: { x: 605, y: 290.5 },
    supero_su_marca: { x: 605, y: 371.5 },
    a_pulso: { x: 604.5, y: 451.5 },
};

// Se muestra entre MainMenuScene y MapScene; marca con 'star' los logros
// desbloqueados (registry 'logrosDesbloqueados', ver PhaserGame.tsx).
export class LogrosScene extends Phaser.Scene {
    private mapData: any;

    constructor() {
        super('LogrosScene');
    }

    init(data: any) {
        this.mapData = data;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const scaleX = width / IMAGEN_LOGROS.width;
        const scaleY = height / IMAGEN_LOGROS.height;

        audioManager(this, 'bg_map');
        this.add.image(0, 0, 'logros').setOrigin(0, 0).setDisplaySize(width, height);

        const desbloqueados: string[] = this.registry.get('logrosDesbloqueados') || [];
        desbloqueados.forEach((codigo) => {
            const pos = POSICION_ESTRELLAS[codigo];
            if (!pos) return;
            this.add.image(pos.x * scaleX, pos.y * scaleY, 'star')
                .setDisplaySize(ESTRELLA_SIZE * scaleX, ESTRELLA_SIZE * scaleY);
        });

        // Sobre el tronco inferior de la imagen.
        const continueButton = this.add.image(width / 2, 566 * scaleY, 'btn_continuar_0')
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        continueButton.on('pointerover', () => continueButton.setTexture('btn_continuar_1'));
        continueButton.on('pointerout', () => continueButton.setTexture('btn_continuar_0'));
        continueButton.on('pointerdown', () => {
            this.scene.start('MapScene', this.mapData);
        });
    }
}
