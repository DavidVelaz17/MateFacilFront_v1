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
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { y: 0 } }
                },
                scene: [MainScene],
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