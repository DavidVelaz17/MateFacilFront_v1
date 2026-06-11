export function audioManager(scene: Phaser.Scene, newMusicKey: string) {
    const currentMusicKey = scene.registry.get('currentMusicKey');

    // 1. Si hay una música diferente sonando, la detenemos
    if (currentMusicKey && currentMusicKey !== newMusicKey) {
        const oldMusic = scene.sound.get(currentMusicKey);
        if (oldMusic && oldMusic.isPlaying) {
            oldMusic.stop();
        }
    }

    // 2. Buscamos si ya existe la instancia de la nueva música en el SoundManager
    let newMusic = scene.sound.get(newMusicKey);

    // 3. Si NO existe (es la primera vez que suena), la agregamos
    if (!newMusic) {
        newMusic = scene.sound.add(newMusicKey, { loop: true, volume: 0.5 });
    }

    // 4. Si existe pero está pausada o detenida (ej. al reiniciar nivel), la iniciamos
    if (!newMusic.isPlaying) {
        newMusic.play();
    }

    // 5. Actualizamos el registro global
    scene.registry.set('currentMusicKey', newMusicKey);
}