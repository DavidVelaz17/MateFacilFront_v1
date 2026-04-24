"use client";
import { useEffect, useRef } from 'react';
import type * as PhaserType from 'phaser';
import { MainScene } from '@/game/scenes/MainScene';

// 1. DEFINIMOS LOS PROPS QUE RECIBE EL COMPONENTE
interface PhaserGameProps {
    levelData?: any;
}

export default function PhaserGame({ levelData }: PhaserGameProps) {
    const gameRef = useRef<PhaserType.Game | null>(null);

    useEffect(() => {
        const initPhaser = async () => {
            const Phaser = (await import('phaser')).default;

            const config: PhaserType.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: 800,
                height: 600,
                // 2. QUITAMOS "scene: [MainScene]" de aquí para iniciarla manualmente
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 800 },
                        debug: false
                    }
                },
                transparent: true,
            };

            // 3. INICIAMOS EL JUEGO Y LA ESCENA CON DATOS
            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);

                // Agregamos la escena y la iniciamos pasándole el objeto { config: levelData }
                // Esto es exactamente lo que captura el init(data) de tu MainScene
                gameRef.current.scene.add('MainScene', MainScene, true, { config: levelData });
            }
            else {
                // Si la configuración de React llega unos milisegundos después de que el juego ya cargó,
                // forzamos a la escena a reiniciarse con los datos correctos.
                const sceneManager = gameRef.current.scene;
                if (sceneManager.getScene('MainScene') && levelData) {
                    sceneManager.start('MainScene', { config: levelData });
                }
            }
        };

        initPhaser();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [levelData]); // 4. Dependencia de React para escuchar cuando llegue el levelData

    return null;
}