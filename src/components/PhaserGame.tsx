"use client";
import { useEffect, useRef } from 'react';
import type * as PhaserType from 'phaser';
import { MainScene } from '@/game/scenes/MainScene';

export default function PhaserGame() {
    const gameRef = useRef<PhaserType.Game | null>(null);

    useEffect(() => {
        const initPhaser = async () => {

            const Phaser = (await import('phaser')).default;

            const config: PhaserType.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: 'phaser-game',
                width: 800,
                height: 600,
                scene: [MainScene],
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 800 },
                        debug: false
                    }
                },
                transparent: true,
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
            }
        };

        initPhaser();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return null;
}