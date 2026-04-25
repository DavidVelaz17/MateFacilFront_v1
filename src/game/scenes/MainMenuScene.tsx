import * as Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // --- Cargar el diseño completo de image_3.png como fondo ---
        // Asegúrate de tener la imagen cargada en Preload con la key 'main_menu_base'
        this.add.image(0, 0, 'main_menu_base').setOrigin(0, 0).setDisplaySize(width, height);

        // --- Crear Zonas de Interacción (Botones invisibles) ---

        // ZONA 1: MUNDO TERRESTRE (Mitad superior)
        // Cubre aproximadamente la mitad superior de la pantalla
        const tierraArea = this.add.zone(0, 0, width, height / 2).setOrigin(0, 0);
        tierraArea.setInteractive();

        // Efectos hover (para dar feedback visual, como un cursor de mano)
        tierraArea.on('pointerover', () => {
            this.game.canvas.style.cursor = 'pointer';
        });
        tierraArea.on('pointerout', () => {
            this.game.canvas.style.cursor = 'default';
        });

        // Al hacer clic: Cargar el mapa de Tierra
        tierraArea.on('pointerdown', () => {
            this.handleSelection('tierra', 'suma_resta');
        });

        // ZONA 2: MUNDO ACUÁTICO (Mitad inferior)
        // Cubre aproximadamente la mitad inferior de la pantalla
        const aguaArea = this.add.zone(0, height / 2, width, height / 2).setOrigin(0, 0);
        aguaArea.setInteractive();

        aguaArea.on('pointerover', () => {
            this.game.canvas.style.cursor = 'pointer';
        });
        aguaArea.on('pointerout', () => {
            this.game.canvas.style.cursor = 'default';
        });

        // Al hacer clic: Cargar el mapa de Agua
        aguaArea.on('pointerdown', () => {
            this.handleSelection('agua', 'mult_div');
        });

        // Instrucción adicional sutil
        this.add.text(width / 2, height - 20, '¡Selecciona tu Mundo para Jugar!', {
            fontSize: '18px',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    // Función auxiliar para manejar la selección e inyectar el estado global
    private handleSelection(element: 'tierra' | 'agua', operationGroup: string) {
        // En la vida real, aquí actualizarías un estado global (ej. en React)
        // o usarías un Bus de Eventos para que el BootScene lo sepa.
        // Para este ejemplo, transicionamos directo al MapScene pasándole los datos.
        this.scene.start('MapScene', {
            config: {
                gameMode: 'historia',
                selectedElement: element,
                selectedOperations: operationGroup
            }
        });
    }
}