export type DificultadNum = 1 | 2 | 3;

export interface ProblemaMatematico {
    cifras: number[];
    resultado: number;
    trampas: number[];
}

export interface LevelConfig {
    operation: 'suma' | 'resta' | 'multiplicacion' | 'division';
    type: 'repaso' | 'prueba';
    timeLimit?: number;
    bgKey: string;
    introText: string;
    successText: string;
    problemas: Record<DificultadNum, ProblemaMatematico>;
}

export const LevelsTierra: LevelConfig[] = [
    {
        operation: 'suma',
        type: 'repaso',
        bgKey: 'leon',
        introText: 'Hola Arquímedes ' +
            'quiero ser el rey león y para ello necesito la mejor melena, ' +
            'por favor ayúdame a contar los pelos en mi melena para saber si puedo ganarle a los demás.',
        successText: 'Woooow no sabía que tenía tantos, ' +
            'muchas gracias por la ayuda, que te vaya bien en tu travesía.',
        problemas:{
            1:{
                cifras: [4251 , 3124 ],
                resultado: 7375,
                trampas: [1567, 2259, 4850],
            },
            2:{
                cifras: [5684  , 2913 ],
                resultado: 8597,
                trampas: [5567, 7219, 1050],
            },
            3:{
                cifras: [89995   , 14879],
                resultado: 104874,
                trampas: [99867, 23219, 75050],
            }
        }
    },
    {
        operation: 'suma',
        type: 'repaso',
        bgKey: 'mono',
        introText: 'Bienvenido a mi habitad Arquímedes, toma una banana. ' +
            'Ayúdame a contar as bananas de las pencas que tengo aquí por favor. ' +
            'De esta manera sabré si le puedo convidar a todos mis amigos.',
        successText: 'Perfecto, si me alcanzan las bananas para mis amigos, ' +
            'toma otra banana para tu camino de vuelta a casa amigo.',
        problemas:{
            1:{
                cifras: [600, 300],
                resultado: 900,
                trampas: [200, 500, 150],
            },
            2:{
                cifras: [5200  , 3400 ],
                resultado: 8600,
                trampas: [1200, 3500, 5300],
            },
            3:{
                cifras: [15700   , 6500 ],
                resultado: 22200,
                trampas: [15800, 6200, 7550],
            }
        }
    },
    {
        operation: 'resta',
        type: 'repaso',
        bgKey: 'jirafa',
        introText: 'Holaaa muuuchooo gustooo, ' +
            'quiereees queee teee bajeee unaaa hojitaaa deee Acaciaaa? ' +
            'Aquí esta tu hojita de acacia, saben muy ricas y son muy nutritivas. ' +
            '¿Me podrías ayudar a contar las manchas que tengo en el cuello, ' +
            'pero sin contar las que están en mi cuerpo por favor?',
        successText: 'Muuuchaaas graaaciaaas, ' +
            'eres bienvenido en mi habitad cuando quieras otra hojita de acacia. ' +
            'Cada vez estás más cerca de tu casa, vas por buen camino.',
        problemas:{
            1:{
                cifras: [8795 , 4251 ],
                resultado: 4544,
                trampas: [2205, 4055, 1680],
            },
            2:{
                cifras: [45123  , 18905 ],
                resultado: 26218,
                trampas: [10000, 33245, 57490],
            },
            3:{
                cifras: [50000 , 24587 ],
                resultado: 25413,
                trampas: [53400, 23910, 24589],
            }
        }
    },
    {
        operation: 'resta',
        type: 'repaso',
        bgKey: 'zebra',
        introText: 'Bienvenido a mi reino compadre, tiene mucho que no veo a alguien por aquí. ' +
            'Verás, quiero que cuentes las rayas de mi cuerpo, pero no las rayas de mi cabeza ' +
            'para saber si soy una cebra negra con rayas blancas o una cebra blanca con rayas negras. ' +
            'Sé que puedes hacerlo con facilidad compadre.',
        successText: 'Muchas gracias compadre, ' +
            'que alivio que soy diferente al resto de cebras. ' +
            'Visítame pronto vecino. ',
        problemas:{
            1:{
                cifras: [900, 400],
                resultado: 500,
                trampas: [200, 800, 700],
            },
            2:{
                cifras: [7500 , 2300],
                resultado: 5200,
                trampas: [7700, 7100, 2100],
            },
            3:{
                cifras: [14300  , 5800 ],
                resultado: 8500,
                trampas: [5400, 2910, 14500],
            }
        }
    },
    {
        operation: 'resta',
        timeLimit: 120,
        type: 'prueba',
        bgKey: 'ajolote',
        introText: 'Arquímedes, que bien que encontraste el camino de vuelta a casa. ' +
            'Antes de pasar, necesito que me des la contraseña, podrías ser un impostor. ' +
            'Tienes un tiempo límite de 2 minutos.',
        successText: 'Adelante Arquímedes, has pasado la prueba de autenticidad.',
        problemas:{
            1:{
                cifras: [8540, 3210],
                resultado: 5330,
                trampas: [5430, 5230, 6330],
            },
            2:{
                cifras: [25000, 13450],
                resultado: 11550,
                trampas: [12550, 11450, 11650],
            },
            3:{
                cifras: [70205, 28647],
                resultado: 41558,
                trampas: [42558, 41658, 40558],
            }
        }
    }
];

export const LevelsAgua: LevelConfig[] = [
    {
        operation: 'multiplicacion',
        type: 'repaso',
        bgKey: 'cocodrilo',
        introText: 'Hola Arquímedes. ' +
            'Para poder pasar por mi habitad primero debes ayudarme a ' +
            'contar cuantas escamas tengo en la espalda. ',
        successText: 'Muchas gracias por ayudarme, ' +
            'si sigues adelante te encontrarás con mi amigo el Delfín, ' +
            'es muy amigable y también necesita ayuda.',
        problemas:{
            1:{
                cifras: [121, 12],
                resultado: 1452,
                trampas: [15, 250, 9],
            },
            2:{
                cifras: [345, 24],
                resultado: 8280,
                trampas: [12, 150, 650],
            },
            3:{
                cifras: [708, 56],
                resultado: 39648,
                trampas: [42, 458, 737],
            }
        }
    },
    {
        operation: 'multiplicacion',
        type: 'repaso',
        bgKey: 'delfin',
        introText: 'Hola pequeñin, ' +
            'oí que estabas perdido, no te preocupes tu camino es difícil, pero no imposible. ' +
            'Necesito que me ayudes con mis balones de juego, me gustaría saber cuántos tengo.',
        successText: 'Muchas gracias Arquímedes, a este paso llegarás pronto a tu casa.',
        problemas:{
            1:{
                cifras: [230 , 21],
                resultado: 4830,
                trampas: [25, 105, 50],
            },
            2:{
                cifras: [416, 35],
                resultado: 14560,
                trampas: [410, 50, 810],
            },
            3:{
                cifras: [897, 78],
                resultado: 69966,
                trampas: [890, 87, 879],
            }
        }
    },
    {
        operation: 'division',
        type: 'repaso',
        bgKey: 'hipo',
        introText: '¿Tu eres el famoso Arquímedes verdad? Necesito de tu ayuda, ' +
            'verás, me gusta mucho la sandía y me gustaría saber cuántas semillas tiene esta sandía.',
        successText: 'Te agradezco la ayuda que me brindaste, ' +
            'tu familia y amigos se pondrán muy contentos cuando regreses. Hasta la próxima.',
        problemas:{
            1:{
                cifras: [844, 4],
                resultado: 211,
                trampas: [60, 890, 3],
            },
            2:{
                cifras: [755, 5],
                resultado: 151,
                trampas: [10, 1500, 550],
            },
            3:{
                cifras: [618, 6],
                resultado: 103,
                trampas: [16, 660, 3],
            }
        }
    },
    {
        operation: 'division',
        type: 'repaso',
        bgKey: 'pingu',
        introText: 'Mucho gusto Arquímedes, ' +
            'requiero tu ayuda para saber cuántas piedritas bonitas tengo en mi habitad. ' +
            'Generalmente no las cuento, pero ya que estás de paso y eres muy hábil con los números,' +
            ' aprovecharé tu intelecto.',
        successText: 'En hora buena Arquímedes. ' +
            'Me sorprenden tus habilidades numéricas, aquél que te ayudó debe ser un genio. ' +
            'Sigue así y llegarás muy lejos amiguito.',
        problemas:{
            1:{
                cifras: [936, 3],
                resultado: 240,
                trampas: [240, 10, 90],
            },
            2:{
                cifras: [728, 4],
                resultado: 182,
                trampas: [100, 8, 730],
            },
            3:{
                cifras: [864, 8],
                resultado: 108,
                trampas: [9, 660, 844],
            }
        }
    },
    {
        operation: 'division',
        timeLimit: 120,
        type: 'prueba',
        bgKey: 'ajolote',
        introText: 'Arquímedes, que bien que encontraste el camino de vuelta a casa. ' +
            'Antes de pasar, necesito que me des la contraseña, podrías ser un impostor. ' +
            'Tienes un tiempo límite de 2 minutos.',
        successText: 'Adelante Arquímedes, has pasado la prueba de autenticidad.',
        problemas:{
            1:{
                cifras: [360, 6],
                resultado: 60,
                trampas: [50, 70, 40],
            },
            2:{
                cifras: [1440, 12],
                resultado: 120,
                trampas: [110, 130, 140],
            },
            3:{
                cifras: [4500, 25],
                resultado: 180,
                trampas: [160, 280, 150],
            }
        }
    }
];