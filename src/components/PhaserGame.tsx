"use client";
import { useEffect, useRef } from 'react';
import type * as PhaserType from 'phaser';

interface PhaserGameProps {
    levelData?: any;
}

export default function PhaserGame({ levelData }: PhaserGameProps) {
    const gameRef = useRef<PhaserType.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const initPhaser = async () => {
            const PhaserModule = await import('phaser');
            const Phaser = PhaserModule.default || PhaserModule;

            const { PreloadScene } = await import('@/game/scenes/PreloadScene');
            const { BootScene } = await import('@/game/scenes/BootScene');
            const { MainMenuScene } = await import('@/game/scenes/MainMenuScene');
            const { MapScene } = await import('@/game/scenes/MapScene');
            const { GameScene } = await import('@/game/scenes/GameScene');

            // 1. CONFIGURACIÓN LIMPIA (Sin array de escenas)
            const config: PhaserType.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                width: 800,
                height: 600,
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { y: 800 }, debug: false }
                },
                transparent: true
                // IMPORTANTE: Quitamos "scene: [...]" para que no arranque sola
            };

            // 2. INICIALIZACIÓN CONTROLADA
            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);

                // Agregamos las escenas manualmente "apagadas"
                gameRef.current.scene.add('PreloadScene', PreloadScene);
                gameRef.current.scene.add('BootScene', BootScene);
                gameRef.current.scene.add('MainMenuScene', MainMenuScene);
                gameRef.current.scene.add('MapScene', MapScene);
                gameRef.current.scene.add('GameScene', GameScene);

                // Le damos un respiro al motor y arrancamos la primera escena CON los datos
                setTimeout(() => {
                    if (gameRef.current) {
                        console.log("React: Arrancando motor con datos ->", levelData);
                        gameRef.current.scene.start('PreloadScene', { config: levelData });
                    }
                }, 100);
            }
            // 3. SI EL MAESTRO CAMBIA LOS DATOS EN TIEMPO REAL
            else if (levelData) {
                console.log("React: Reiniciando motor por nuevos datos ->", levelData);
                const sceneManager = gameRef.current.scene;

                // Apagamos cualquier escena que esté corriendo
                sceneManager.getScenes(true).forEach(scene => scene.scene.stop());

                // Volvemos a empezar desde el Preload
                sceneManager.start('PreloadScene', { config: levelData });
            }
        };

        if (typeof window !== 'undefined') {
            initPhaser();
        }

        // Limpieza cuando el componente se desmonta (al salir de la página)
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [levelData]);

    return <div ref={containerRef} className="w-full h-full" />;
}