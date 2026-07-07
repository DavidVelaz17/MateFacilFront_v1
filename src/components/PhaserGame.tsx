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
            const { TransitionScene } = await import('@/game/scenes/TransitionScene');

            const config: PhaserType.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                width: 800,
                height: 600,
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: '100%',
                    height: '100%'
                },
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { x: 0 ,y: 800 }, debug: false }
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
                gameRef.current.scene.add('TransitionScene', TransitionScene);

                setTimeout(() => {
                    if (gameRef.current) {
                        console.log("React: Arrancando motor con datos ->", levelData);
                        gameRef.current.registry.set('totalStars', levelData.totalStars || 0);
                        gameRef.current.scene.start('PreloadScene', { config: levelData });
                    }
                }, 100);
            }
            else if (levelData) {
                console.log("React: Reiniciando motor por nuevos datos ->", levelData);
                gameRef.current.registry.set('totalStars', levelData.totalStars || 0);
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
