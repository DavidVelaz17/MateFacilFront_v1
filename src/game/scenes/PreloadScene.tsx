import * as Phaser from 'phaser';
export class PreloadScene extends Phaser.Scene{
    private initData: any;

    constructor() {
        super('PreloadScene');
    }

    init(data: any) {
        this.initData = data;
    }

    preload() {
        if (this.game.registry.get('assetsLoaded')) {
            return;
        }
        //MENU
        this.load.image('main_menu_base', '/assets/MainMenu.png');
        this.load.image('mute', '/assets/mute.png');
        this.load.image('sound_on', '/assets/sound_on.png');
        this.load.image('play', '/assets/play.png');
        this.load.image('pause', '/assets/pause.png');
        this.load.image('btn_menu_0', '/assets/btn_menu_0.png');
        this.load.image('btn_menu_1', '/assets/btn_menu_1.png');
        this.load.image('btn_jugar_0', '/assets/btn_jugar_0.png');
        this.load.image('btn_jugar_1', '/assets/btn_jugar_1.png');

        //MAPAS
        this.load.image('mapa_agua', '/assets/mapa_agua.png');
        this.load.image('mapa_tierra', '/assets/mapa_tierra.png');

        //FONDOS
        this.load.image('bg_agua', '/assets/bg_agua.png');
        this.load.image('bg_tierra', '/assets/bg_tierra.jpg');

        //ELEMENTOS DEL MAPA
        this.load.image('platform_tierra', '/assets/platform_tierra.png');
        this.load.image('platform_agua', '/assets/platform_agua.png');
        this.load.image('door', '/assets/door.png');
        this.load.image("door_open", "/assets/door_open.png");
        this.load.image('bar_bg_tierra', '/assets/bar_background_tierra.png');
        this.load.image('bar_bg_agua', '/assets/bar_background_agua.png');

        //PERSONAJE
        this.load.image('axolotl', '/assets/axolote_standing.png');
        this.load.spritesheet('axolotl_idle', '/assets/axolote_idle32x32.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('axolotl_walking', '/assets/axolote_walking32x32.png', { frameWidth: 32, frameHeight: 32 });


        //AVATAR
        this.load.image('avatar_normal', '/assets/avatar_normal.png');
        this.load.image('avatar_supersad', '/assets/avatar_muytriste.png');
        this.load.image('avatar_superhappy', '/assets/avatar_muyfeliz.png');
        this.load.image('avatar_sad', '/assets/avatar_triste.png');
        this.load.image('avatar_happy', '/assets/avatar_feliz.png');

        //SONIDOS DE FONDO
        this.load.audio('bg_music', '/assets/bg_sound.mp3');

        this.load.on('loaderror', (fileObj: any) => {
            console.error("Fallo al cargar:", fileObj.src);
        });
    }
    create() {
        this.game.registry.set('assetsLoaded', true);

        console.log("Preload terminado. Yendo a BootScene con:", this.initData);
        this.scene.start('BootScene', this.initData);
    }
}