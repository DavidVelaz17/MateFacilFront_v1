import * as Phaser from 'phaser';
export class PreloadScene extends Phaser.Scene{
    private initData: any;

    constructor() {
        super('PreloadScene');
    }

    init(data: any) {
        // Atrapamos los datos antes de cargar nada
        this.initData = data;
    }

    preload() {
        if (this.game.registry.get('assetsLoaded')) {
            return;
        }
        //MENU
        this.load.image('main_menu_base', '/assets/MainMenu.png');

        //MAPAS
        this.load.image('mapa_agua', '/assets/mapa_agua.png');
        this.load.image('mapa_tierra', '/assets/mapa_tierra.png');

        //FONDOS
        this.load.image('bg_agua', '/assets/bg_agua.jpg');
        this.load.image('bg_tierra', '/assets/bg_tierra.jpg');

        //ELEMENTOS DEL MAPA
        this.load.image('platform', '/assets/platform.png');
        this.load.image('door', '/assets/door.png');
        this.load.image("door_open", "/assets/door_open.png");
        this.load.image('bar_bg', '/assets/bar_background4.png');

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
        // Marcamos en el registro global que ya cargamos todo
        this.game.registry.set('assetsLoaded', true);

        console.log("Preload terminado. Yendo a BootScene con:", this.initData);
        this.scene.start('BootScene', this.initData);
    }
}