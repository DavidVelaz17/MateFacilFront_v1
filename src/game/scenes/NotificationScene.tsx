import * as Phaser from 'phaser';
import { EventBus } from './patterns';

interface LogroDesbloqueado {
    codigo: string;
    nombre: string;
    descripcion: string;
    icono: string;
}

interface RachaData {
    dias: number;
    victorias: number;
}

// Escena que se lanza una sola vez y nunca se detiene (ver PhaserGame.tsx):
// vive por encima de GameScene/MapScene/TransitionScene sin importar cual
// este activa. Muestra el aviso de racha y la cola de logros arriba a la
// izquierda, y se limpia explicitamente via el evento 'clearNotifications'
// que las demas escenas emiten justo antes de cambiar de escena (ver los
// botones de Continuar/Reiniciar/Volver a jugar/Menu), en vez de depender
// de un temporizador que puede dejar el aviso flotando sobre la pantalla
// equivocada.
export class NotificationScene extends Phaser.Scene {
    private streakText: Phaser.GameObjects.Text | null = null;
    private streakBg: Phaser.GameObjects.Rectangle | null = null;
    private streakTimer: Phaser.Time.TimerEvent | null = null;

    private logroQueue: LogroDesbloqueado[] = [];
    private logroCard: Phaser.GameObjects.Container | null = null;
    private logroTimer: Phaser.Time.TimerEvent | null = null;

    private readonly MARGIN_X = 16;
    private readonly MARGIN_Y = 16;
    private readonly STREAK_HEIGHT = 34;
    private readonly GAP = 8;
    private readonly LOGRO_WIDTH = 260;
    private readonly LOGRO_HEIGHT = 64;

    constructor() {
        super('NotificationScene');
    }

    create() {
        EventBus.on('streakUpdate', this.handleStreakUpdate, this);
        EventBus.on('logrosUnlocked', this.handleLogrosUnlocked, this);
        EventBus.on('clearNotifications', this.clearAll, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off('streakUpdate', this.handleStreakUpdate, this);
            EventBus.off('logrosUnlocked', this.handleLogrosUnlocked, this);
            EventBus.off('clearNotifications', this.clearAll, this);
        });
    }

    private handleStreakUpdate = (data: RachaData) => {
        const mostrarDias = data.dias >= 2;
        const mostrarVictorias = data.victorias >= 2;
        if (!mostrarDias && !mostrarVictorias) return;

        this.scene.bringToTop();
        this.hideStreak();

        const texto = mostrarDias
            ? `🔥 Racha de ${data.dias} días`
            : `🎯 ${data.victorias} victorias seguidas`;

        const label = this.add.text(0, 0, texto, {
            fontSize: '14px',
            color: '#fde68a',
            fontStyle: 'bold',
        });
        const width = label.width + 24;

        this.streakBg = this.add.rectangle(
            this.MARGIN_X, this.MARGIN_Y, width, this.STREAK_HEIGHT, 0x111827, 0.88,
        ).setOrigin(0, 0).setStrokeStyle(1, 0xfb923c, 0.6).setDepth(100);

        label.setPosition(this.MARGIN_X + 12, this.MARGIN_Y + this.STREAK_HEIGHT / 2);
        label.setOrigin(0, 0.5).setDepth(101);
        this.streakText = label;

        this.streakTimer = this.time.delayedCall(4000, () => this.hideStreak());
    };

    private hideStreak() {
        this.streakTimer?.remove();
        this.streakText?.destroy();
        this.streakBg?.destroy();
        this.streakText = null;
        this.streakBg = null;
    }

    private handleLogrosUnlocked = (logros: LogroDesbloqueado[]) => {
        if (!logros || logros.length === 0) return;
        this.scene.bringToTop();
        this.logroQueue.push(...logros);
        if (!this.logroCard) {
            this.showNextLogro();
        }
    };

    private showNextLogro() {
        const logro = this.logroQueue.shift();
        if (!logro) {
            this.logroCard = null;
            return;
        }

        const y = this.MARGIN_Y + this.STREAK_HEIGHT + this.GAP;
        const container = this.add.container(this.MARGIN_X, y).setDepth(100);

        const bg = this.add.rectangle(0, 0, this.LOGRO_WIDTH, this.LOGRO_HEIGHT, 0x2e1065, 0.94)
            .setOrigin(0, 0).setStrokeStyle(1, 0x7c3aed, 0.9);
        const eyebrow = this.add.text(10, 6, 'NUEVO LOGRO', {
            fontSize: '9px', color: '#c4b5fd', fontStyle: 'bold',
        });
        const icon = this.add.text(10, 22, logro.icono, { fontSize: '22px' });
        const nombre = this.add.text(42, 20, logro.nombre, {
            fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
        });
        const desc = this.add.text(42, 38, logro.descripcion, {
            fontSize: '9.5px', color: '#d8d0f5',
            wordWrap: { width: this.LOGRO_WIDTH - 52 },
        });

        container.add([bg, eyebrow, icon, nombre, desc]);
        this.logroCard = container;

        this.logroTimer = this.time.delayedCall(4500, () => {
            container.destroy();
            this.showNextLogro();
        });
    }

    private clearAll = () => {
        this.hideStreak();
        this.logroTimer?.remove();
        this.logroCard?.destroy();
        this.logroCard = null;
        this.logroQueue = [];
    };
}
