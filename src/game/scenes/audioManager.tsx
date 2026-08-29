export function audioManager(scene: Phaser.Scene, newMusicKey: string, volume: number = 0.5) {
    const currentMusicKey = scene.registry.get('currentMusicKey');

    if (currentMusicKey && currentMusicKey !== newMusicKey) {
        const oldMusic = scene.sound.get(currentMusicKey);
        if (oldMusic && oldMusic.isPlaying) {
            oldMusic.stop();
        }
    }

    let newMusic = scene.sound.get(newMusicKey);

    if (!newMusic) {
        newMusic = scene.sound.add(newMusicKey, { loop: true, volume });
    }

    // El volumen varia segun la escena que la invoque (ej. TransitionScene
    // la baja para resaltar las voces).
    if ('setVolume' in newMusic) {
        (newMusic as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(volume);
    }

    if (!newMusic.isPlaying) {
        newMusic.play();
    }

    scene.registry.set('currentMusicKey', newMusicKey);
}