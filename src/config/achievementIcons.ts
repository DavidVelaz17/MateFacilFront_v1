// Iconos del juego (mismos assets cargados en PreloadScene) reutilizados en
// los reportes para mantener consistencia visual con el front del juego.
export const ACHIEVEMENT_ICONS: Record<string, string> = {
    primera_perfecta: "/assets/perfect_Icon.png",
    sin_rasgunos: "/assets/shield_Icon.png",
    segunda_oportunidad: "/assets/secondOportunity_Icon.png",
    mundo_terrestre: "/assets/dirt_Icon.png",
    mundo_acuatico: "/assets/water_Icon.png",
    rayo: "/assets/lightning_Icon.png",
    nunca_te_rindes: "/assets/strong_Icon.png",
    remontada: "/assets/zombie_Icon.png",
    vuelta_al_ruedo: "/assets/pause_Icon.png",
    supero_su_marca: "/assets/launcher_Icon.png",
    a_pulso: "/assets/surgeon_Icon.png",
};

export const ACHIEVEMENT_NAME_OVERRIDES: Record<string, string> = {
    remontada: "Zombi",
    vuelta_al_ruedo: "De Vuelta al Juego",
};

// Mismas claves que ACHIEVEMENT_ICONS pero como texture keys de Phaser
// (cargadas en PreloadScene) en vez de rutas web, para usarse dentro del juego.
export const ACHIEVEMENT_TEXTURE_KEYS: Record<string, string> = {
    primera_perfecta: "icono_perfecto",
    sin_rasgunos: "icono_escudo",
    segunda_oportunidad: "icono_segundaOportunidad",
    mundo_terrestre: "icono_tierra",
    mundo_acuatico: "icono_agua",
    rayo: "icono_rayo",
    nunca_te_rindes: "icono_fuerte",
    remontada: "icono_zombie",
    vuelta_al_ruedo: "icono_pausa",
    supero_su_marca: "icono_cohete",
    a_pulso: "icono_cirujano",
};
