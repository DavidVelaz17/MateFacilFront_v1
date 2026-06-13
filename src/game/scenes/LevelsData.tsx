export interface LevelConfig {
    operation: 'suma' | 'resta' | 'multiplicacion' | 'division';
    cifras: number[];
    resultado: number;
    trampas: number[];
    type: 'repaso' | 'prueba';
    timeLimit?: number;
    bgKey: string;
    introText: string;
    successText: string;
}

export const LevelsTierra: LevelConfig[] = [
    {
        operation: 'suma',
        cifras: [4251 , 3124 ],
        resultado: 7375,
        trampas: [1567, 2259, 4850],
        type: 'repaso',
        bgKey: 'leon',
        introText: 'Hola Arquímedes ' +
            'quiero ser el rey león y para ello necesito la mejor melena, ' +
            'por favor ayúdame a contar los pelos en mi melena para saber si puedo ganarle a los demás.',
        successText: 'Woooow no sabía que tenía tantos, ' +
            'muchas gracias por la ayuda, que te vaya bien en tu travesía.',
    },
    {
        operation: 'suma',
        cifras: [600, 300],
        resultado: 900,
        trampas: [200, 500, 150],
        type: 'repaso',
        bgKey: 'mono',
        introText: 'Bienvenido a mi habitad Arquímedes, toma una banana. ' +
            'Ayúdame a contar as bananas de las pencas que tengo aquí por favor. ' +
            'De esta manera sabré si le puedo convidar a todos mis amigos.',
        successText: 'Perfecto, si me alcanzan las bananas para mis amigos, ' +
            'toma otra banana para tu camino de vuelta a casa amigo.',
    },
    {
        operation: 'resta',
        cifras: [8795 , 4251 ],
        resultado: 4544,
        trampas: [2205, 4055, 1680],
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
    },
    {
        operation: 'resta',
        cifras: [900, 400],
        resultado: 500,
        trampas: [200, 800, 700],
        type: 'repaso',
        bgKey: 'zebra',
        introText: 'Bienvenido a mi reino compadre, tiene mucho que no veo a alguien por aquí. ' +
            'Verás, quiero que cuentes las rayas de mi cuerpo, pero no las rayas de mi cabeza ' +
            'para saber si soy una cebra negra con rayas blancas o una cebra blanca con rayas negras. ' +
            'Sé que puedes hacerlo con facilidad compadre.',
        successText: 'Muchas gracias compadre, ' +
            'que alivio que soy diferente al resto de cebras. ' +
            'Visítame pronto vecino. ',
    },
    {
        operation: 'resta',
        cifras: [5684 , 2913 ],
        resultado: 8597,
        trampas: [2050, 8600, 789],
        timeLimit: 120,
        type: 'prueba',
        bgKey: 'zebra',//TODO cambiar el fondo cuando esté listo el estanque de ajolotes
        introText: 'Arquímedes, que bien que encontraste el camino de vuelta a casa. ' +
            'Antes de pasar, necesito que me des la contraseña, podrías ser un impostor. ' +
            'Tienes un tiempo límite de 2 minutos.',
        successText: 'Adelante Arquímedes, has pasado la prueba de autenticidad.',
    }
];

export const LevelsAgua: LevelConfig[] = [
    {
        operation: 'multiplicacion',
        cifras: [121, 12],
        resultado: 1452,
        trampas: [15, 250, 9],
        type: 'repaso',
        bgKey: 'cocodrilo',
        introText: 'Hola Arquímedes. ' +
            'Para poder pasar por mi habitad primero debes ayudarme a ' +
            'contar cuantas escamas tengo en la espalda. ',
        successText: 'Muchas gracias por ayudarme, ' +
            'si sigues adelante te encontrarás con mi amigo el Delfín, ' +
            'es muy amigable y también necesita ayuda.',
    },
    {
        operation: 'multiplicacion',
        cifras: [230 , 21],
        resultado: 4830,
        trampas: [25, 105, 50],
        type: 'repaso',
        bgKey: 'delfin',
        introText: 'Hola pequeñin, ' +
            'oí que estabas perdido, no te preocupes tu camino es difícil, pero no imposible. ' +
            'Necesito que me ayudes con mis balones de juego, me gustaría saber cuántos tengo.',
        successText: 'Muchas gracias Arquímedes, a este paso llegarás pronto a tu casa.',
    },
    {
        operation: 'division',
        cifras: [844, 4],
        resultado: 211,
        trampas: [60, 890, 3],
        type: 'repaso',
        bgKey: 'hipo',
        introText: '¿Tu eres el famoso Arquímedes verdad? Necesito de tu ayuda, ' +
            'verás, me gusta mucho la sandía y me gustaría saber cuántas semillas tiene esta sandía.',
        successText: 'Te agradezco la ayuda que me brindaste, ' +
            'tu familia y amigos se pondrán muy contentos cuando regreses. Hasta la próxima.',
    },
    {
        operation: 'division',
        cifras: [480, 2],
        resultado: 240,
        trampas: [40, 15, 90],
        type: 'repaso',
        bgKey: 'pingu',
        introText: 'Mucho gusto Arquímedes, ' +
            'requiero tu ayuda para saber cuántas piedritas bonitas tengo en mi habitad. ' +
            'Generalmente no las cuento, pero ya que estás de paso y eres muy hábil con los números,' +
            ' aprovecharé tu intelecto.',
        successText: 'En hora buena Arquímedes. ' +
            'Me sorprenden tus habilidades numéricas, aquél que te ayudó debe ser un genio. ' +
            'Sigue así y llegarás muy lejos amiguito.',
    },
    {
        operation: 'division',
        cifras: [936 , 3],
        resultado: 312,
        trampas: [1000, 111, 530],
        timeLimit: 120,
        type: 'prueba',
        bgKey: 'pingu', //TODO cambiar el fondo cuando esté listo el estanque de ajolotes
        introText: 'Arquímedes, que bien que encontraste el camino de vuelta a casa. ' +
            'Antes de pasar, necesito que me des la contraseña, podrías ser un impostor. ' +
            'Tienes un tiempo límite de 2 minutos.',
        successText: 'Adelante Arquímedes, has pasado la prueba de autenticidad.',
    }
];