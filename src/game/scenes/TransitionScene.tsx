import * as Phaser from 'phaser';
import {audioManager} from "@/game/scenes/audioManager";

// Traduce el bgKey del nivel al prefijo usado por las claves de audio de voces
const ANIMAL_VOICE_PREFIX: Record<string, string> = {
    leon: 'leon',
    mono: 'monky',
    jirafa: 'jiraf',
    zebra: 'zeb',
    ajolote: 'axolot',
    cocodrilo: 'coco',
    delfin: 'dolph',
    hipo: 'hipo',
    pingu: 'pingu',
};

export class TransitionScene extends Phaser.Scene {
    private nextSceneKey: string = '';
    private message: string = '';
    private bgKey: string = '';
    private nextSceneData: any = {};
    private currentVoice?: Phaser.Sound.BaseSound;

    constructor() {
        super('TransitionScene');
    }

    init(data: { next: string, message: string, bg: string, nextData: any }) {
        this.nextSceneKey = data.next;
        this.message = data.message;
        this.bgKey = data.bg;
        this.nextSceneData = data.nextData;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.image(0, 0, this.bgKey).setOrigin(0, 0).setDisplaySize(width, height);

        const textY = height * 0.85;
        const textMaxWidth = width * 0.85;

        this.add.text(width/2, textY, this.message, {
            fontSize: '20px',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center',
            wordWrap: { width:textMaxWidth }
        }).setOrigin(0.5);

        const buttonY = height * 0.70;

        if (this.nextSceneKey === 'GameScene') {
            const btnMap = this.add.image((width / 2) - 285, buttonY, 'btn_mapa_0')
                .setOrigin(0.5).setInteractive({useHandCursor: true});

            btnMap.on('pointerover', () => btnMap.setTexture('btn_mapa_1'));
            btnMap.on('pointerout', () => btnMap.setTexture('btn_mapa_0'));
            btnMap.on('pointerdown', () => {
                this.currentVoice?.stop();
                const mapData = this.nextSceneData && this.nextSceneData.config
                    ? {
                        config: this.nextSceneData.config,
                        dificultad: this.nextSceneData.dificultad}
                    : {};

                this.scene.start('MapScene', mapData);
            });
        }

        const btn = this.add.image((width/2)+250, buttonY, 'btn_continuar_0')
            .setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setTexture('btn_continuar_1'));
        btn.on('pointerout', () => btn.setTexture('btn_continuar_0'));
        btn.on('pointerdown', () => {
            this.currentVoice?.stop();
            this.scene.start(this.nextSceneKey, this.nextSceneData);
        });
        audioManager(this, 'bg_map', 0.25)

        this.createVoiceMuteButton(width);
        this.playAnimalVoice();
    }

    private playAnimalVoice() {
        const voicePrefix = ANIMAL_VOICE_PREFIX[this.bgKey];
        if (!voicePrefix) {
            return;
        }

        const voiceKey = this.nextSceneKey === 'GameScene'
            ? `${voicePrefix}VoiceInit`
            : `${voicePrefix}VoiceEnd`;

        const voicesMuted = !!this.registry.get('voicesMuted');
        this.currentVoice = this.sound.add(voiceKey, { volume: 1, mute: voicesMuted });
        this.currentVoice.play();
    }

    private createVoiceMuteButton(width: number) {
        let voicesMuted = !!this.registry.get('voicesMuted');

        const voiceMuteBtn = this.add.image(width - 50, 30, voicesMuted ? 'mute' : 'sound_on')
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);

        voiceMuteBtn.on('pointerdown', () => {
            voicesMuted = !voicesMuted;
            this.registry.set('voicesMuted', voicesMuted);
            voiceMuteBtn.setTexture(voicesMuted ? 'mute' : 'sound_on');

            if (this.currentVoice && 'setMute' in this.currentVoice) {
                (this.currentVoice as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setMute(voicesMuted);
            }
        });
    }
}