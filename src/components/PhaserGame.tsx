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
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
                gameRef.current.scene.add('PreloadScene', PreloadScene);
                gameRef.current.scene.add('BootScene', BootScene);
                gameRef.current.scene.add('MainMenuScene', MainMenuScene);
                gameRef.current.scene.add('MapScene', MapScene);
                gameRef.current.scene.add('GameScene', GameScene);

                setTimeout(() => {
                    if (gameRef.current) {
                        console.log("React: Arrancando motor con datos ->", levelData);
                        gameRef.current.scene.start('PreloadScene', { config: levelData });
                    }
                }, 100);
            }
            else if (levelData) {
                console.log("React: Reiniciando motor por nuevos datos ->", levelData);
                const sceneManager = gameRef.current.scene;
                sceneManager.getScenes(true).forEach(scene => scene.scene.stop());
                sceneManager.start('PreloadScene', { config: levelData });
            }
        };

        if (typeof window !== 'undefined') {
            initPhaser();
        }
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [levelData]);

    return <div ref={containerRef} className="w-full h-full" />;
}
