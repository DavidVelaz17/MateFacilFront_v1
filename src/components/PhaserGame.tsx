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
            const { LogrosScene } = await import('@/game/scenes/LogrosScene');
            const { GameScene } = await import('@/game/scenes/GameScene');
            const { TransitionScene } = await import('@/game/scenes/TransitionScene');
            const { NotificationScene } = await import('@/game/scenes/NotificationScene');

            const config: PhaserType.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                width: 800,
                height: 600,
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                },
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { x: 0 ,y: 800 }, debug: false }
                },
                input: {
                    activePointers: 4
                },
                transparent: true
            };

            // MapScene guarda el progreso en variables estaticas (sobreviven a
            // destruir/crear el Game), asi que se resiembran en cada montaje
            // para que el backend sea la fuente de verdad, no la sesion previa.
            MapScene.currentLevelPointTierra = levelData?.nivelMapaTierra || 0;
            MapScene.currentLevelPointAgua = levelData?.nivelMapaAgua || 0;

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
                gameRef.current.scene.add('PreloadScene', PreloadScene);
                gameRef.current.scene.add('BootScene', BootScene);
                gameRef.current.scene.add('MainMenuScene', MainMenuScene);
                gameRef.current.scene.add('LogrosScene', LogrosScene);
                gameRef.current.scene.add('MapScene', MapScene);
                gameRef.current.scene.add('GameScene', GameScene);
                gameRef.current.scene.add('TransitionScene', TransitionScene);
                gameRef.current.scene.add('NotificationScene', NotificationScene);

                setTimeout(() => {
                    if (gameRef.current) {
                        console.log("React: Arrancando motor con datos ->", levelData);
                        gameRef.current.registry.set('totalStars', levelData.totalStars || 0);
                        gameRef.current.registry.set('lastDificultad', levelData.dificultad || 2);
                        gameRef.current.registry.set('logrosDesbloqueados', levelData.logrosDesbloqueados || []);
                        gameRef.current.scene.start('PreloadScene', { config: levelData });
                        // run() en vez de start(): corre en paralelo sin detener
                        // otras escenas, para mostrar avisos encima de cualquiera.
                        gameRef.current.scene.run('NotificationScene');
                    }
                }, 100);
            }
            else if (levelData) {
                console.log("React: Reiniciando motor por nuevos datos ->", levelData);
                gameRef.current.registry.set('totalStars', levelData.totalStars || 0);
                gameRef.current.registry.set('lastDificultad', levelData.dificultad || 2);
                gameRef.current.registry.set('logrosDesbloqueados', levelData.logrosDesbloqueados || []);
                const sceneManager = gameRef.current.scene;
                sceneManager.getScenes(true)
                    .filter(scene => scene.scene.key !== 'NotificationScene')
                    .forEach(scene => scene.scene.stop());
                sceneManager.start('PreloadScene', { config: levelData });
                if (!sceneManager.isActive('NotificationScene')) {
                    sceneManager.run('NotificationScene');
                }
            }
        };

        // Logros desbloqueados durante la sesion (play/[id]/page.tsx emite
        // 'logrosUnlocked'): se agregan para que LogrosScene los muestre sin recargar.
        let offLogrosUnlocked: (() => void) | null = null;
        const registrarLogrosUnlocked = async () => {
            const { EventBus } = await import('@/game/scenes/patterns');
            const handler = (logros: { codigo: string }[]) => {
                const registry = gameRef.current?.registry;
                if (!registry) return;
                const actuales: string[] = registry.get('logrosDesbloqueados') || [];
                registry.set('logrosDesbloqueados', [...new Set([...actuales, ...logros.map(l => l.codigo)])]);
            };
            EventBus.on('logrosUnlocked', handler);
            offLogrosUnlocked = () => EventBus.off('logrosUnlocked', handler);
        };

        if (typeof window !== 'undefined') {
            initPhaser();
            registrarLogrosUnlocked();
        }
        return () => {
            offLogrosUnlocked?.();
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [levelData]);

    return <div ref={containerRef} className="w-full h-full" />;
}
