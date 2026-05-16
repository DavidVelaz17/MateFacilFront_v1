export interface LevelConfig {
    operation: 'suma' | 'resta' | 'multiplicacion' | 'division';
    cifras: number[];
    resultado: number;
    trampas: number[];
    type: 'repaso' | 'prueba';
    timeLimit?: number;
}

export const LevelsTierra: LevelConfig[] = [
    {
        operation: 'suma',
        cifras: [4251 , 3124 ],
        resultado: 7375,
        trampas: [1567, 2259, 4850],
        type: 'repaso'
    },
    {
        operation: 'suma',
        cifras: [600, 300],
        resultado: 900,
        trampas: [200, 500, 150],
        type: 'repaso'
    },
    {
        operation: 'resta',
        cifras: [8795 , 4251 ],
        resultado: 4544,
        trampas: [2205, 4055, 1680],
        type: 'repaso'
    },
    {
        operation: 'resta',
        cifras: [900, 400],
        resultado: 500,
        trampas: [200, 800, 700],
        type: 'repaso'
    },
    {
        operation: 'resta',
        cifras: [5684 , 2913 ],
        resultado: 8597,
        trampas: [2050, 8600, 789],
        timeLimit: 120,
        type: 'prueba'
    }
];

export const LevelsAgua: LevelConfig[] = [
    {
        operation: 'multiplicacion',
        cifras: [121, 12],
        resultado: 1452,
        trampas: [15, 250, 9],
        type: 'repaso'
    },
    {
        operation: 'multiplicacion',
        cifras: [230 , 21],
        resultado: 4830,
        trampas: [25, 105, 50],
        type: 'repaso'
    },
    {
        operation: 'division',
        cifras: [844, 4],
        resultado: 211,
        trampas: [60, 890, 3],
        type: 'repaso'
    },
    {
        operation: 'division',
        cifras: [480, 2],
        resultado: 240,
        trampas: [40, 15, 90],
        type: 'repaso'
    },
    {
        operation: 'division',
        cifras: [936 , 3],
        resultado: 312,
        trampas: [1000, 111, 530],
        timeLimit: 120,
        type: 'prueba'
    }
];