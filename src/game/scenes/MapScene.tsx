import * as Phaser from 'phaser';
import { EventBus, MapConfig } from './patterns';

export class MapScene extends Phaser.Scene {
    // Variables para el seguimiento del progreso (esto vendría de DB en la vida real)
    private static currentLevelPointTierra: number = 0; // Puntos: 0, 1, 2, 3
    private static currentLevelPointAgua: number = 0;

    // Variables de configuración dinámica recibida de React
    private levelData: any;
    private currentElement: 'tierra' | 'agua' = 'tierra';
    private playerNode: Phaser.GameObjects.Arc | null = null;
    private playerAvatar: Phaser.GameObjects.Sprite | null = null;

    constructor() {
        super('MapScene');
    }

    // --- init(): Capturar los datos de la escena anterior (Boot o Menú) ---
    init(data: any) {
        if (data && data.config) {
            this.levelData = data.config;
            this.currentElement = data.config.selectedElement || 'tierra';
        }
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // --- 1. Cargar el mapa correcto (No interactivo, demostrativo) ---
        const mapKey = this.currentElement === 'agua' ? 'mapa_agua' : 'mapa_tierra';
        this.add.image(0, 0, mapKey).setOrigin(0, 0).setDisplaySize(width, height);

        // Título dinámico
        this.add.text(width / 2, 50, `Mundo ${this.currentElement === 'tierra' ? 'Terrestre' : 'Acuático'}`, {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // --- 2. Lógica de Seguimiento de Progreso y Avance del Personaje ---
        const pointData = this.currentElement === 'tierra' ? MapConfig.pointDataTierra : MapConfig.pointDataAgua;
        const currentPointIndex = this.currentElement === 'tierra' ? MapScene.currentLevelPointTierra : MapScene.currentLevelPointAgua;

        // Dibuja el personaje en el punto actual (No interactivo en el mapa)
        if (currentPointIndex < pointData.length) {
            const currentPoint = pointData[currentPointIndex];
            this.playerAvatar = this.physics.add.sprite(currentPoint.x, currentPoint.y, 'axolotl_idle').setScale(1.2).refreshBody();
        }

        // --- 3. UI: Botón de Jugar (Interactivo) ---
        // Un botón para iniciar la partida temática seleccionada
        const playButton = this.add.text(width / 2, height / 2, '¡JUGAR!', {
            fontSize: '32px',
            backgroundColor: '#4C1D95', // Morado oscuro
            padding: { x: 20, y: 10 },
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive();

        // Efectos hover
        playButton.on('pointerover', () => playButton.setStyle({ backgroundColor: '#6D28D9' })); // Morado claro
        playButton.on('pointerout', () => playButton.setStyle({ backgroundColor: '#4C1D95' }));

        // Al hacer clic: Iniciar partida dinámica
        playButton.on('pointerdown', () => {
            // Comprimir la configuración temática
            const finalLevelData = this.prepareLevelData(currentPointIndex);
            this.scene.start('GameScene', { config: finalLevelData });
        });

        // --- 4. Escuchar evento de victoria para avanzar el personaje ---
        this.events.once(Phaser.Scenes.Events.WAKE, (sys, data) => {
            if (data && data.win) {
                this.advancePlayerCharacter();
            }
        }, this);
    }

    // Función auxiliar para preparar los datos dinámicos de cuarto grado
    private prepareLevelData(currentPointIndex: number): any {
        // En la vida real, esto vendría de DB. Para este ejemplo, lo definimos
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
            cifras: [120, 280], // Suma/Resta básica de 3 cifras
            resultado: 400,
            numCifras: 2,
            numTrampas: numTrampas,
            trampas: [300, 500, 150],
            type: 'repaso'
        };

        if (this.currentElement === 'agua') {
            data.cifras = [15, 10]; // Multiplicación básica de 2x2 cifras
            data.resultado = 150;
            data.trampas = [25, 1500, 105, 50];
            data.timeLimit = 120; // 2 minutos
            data.type = 'prueba';
        }

        return data;
    }

    // Función para avanzar visualmente el personaje al siguiente punto
    private advancePlayerCharacter() {
        const pointData = this.currentElement === 'tierra' ? MapConfig.pointDataTierra : MapConfig.pointDataAgua;
        let currentPointIndex = this.currentElement === 'tierra' ? MapScene.currentLevelPointTierra : MapScene.currentLevelPointAgua;

        if (currentPointIndex < pointData.length - 1) {
            // Actualizar estado global de progreso
            if (this.currentElement === 'tierra') MapScene.currentLevelPointTierra++;
            else MapScene.currentLevelPointAgua++;

            const nextPointIndex = currentPointIndex + 1;
            const nextPoint = pointData[nextPointIndex];

            // Transición visual del personaje
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