import type { DificultadNum, ModoProblema, ProblemaMatematico } from './LevelsData';

type Operacion = 'suma' | 'resta' | 'multiplicacion' | 'division';

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarTrampas(cifrasCorrectas: number[], cantidad: number, excluir: number[] = []): number[] {
    const usados = new Set([...cifrasCorrectas, ...excluir]);
    const trampas: number[] = [];

    for (let i = 0; i < cantidad; i++) {
        const base = cifrasCorrectas[i % cifrasCorrectas.length];
        const spread = Math.max(5, Math.round(base * 0.3));
        let candidato = base;
        let intentos = 0;

        do {
            const delta = randomInt(-spread, spread) || 1;
            candidato = Math.max(1, base + delta);
            intentos++;
        } while (usados.has(candidato) && intentos < 30);

        usados.add(candidato);
        trampas.push(candidato);
    }
    return trampas;
}

// En dificultad facil el alumno elige el resultado; en las demas, las cifras.
function modoPorDificultad(dificultad: DificultadNum): ModoProblema {
    return dificultad === 1 ? 'resultado' : 'operandos';
}

// Las trampas se generan alrededor de lo que el alumno debe recoger.
function armarProblema(cifras: number[], resultado: number, dificultad: DificultadNum): ProblemaMatematico {
    const modo = modoPorDificultad(dificultad);
    const trampas = modo === 'resultado'
        ? generarTrampas([resultado], 3, cifras)
        : generarTrampas(cifras, 3, [resultado]);
    return { cifras, resultado, trampas, modo };
}

const RANGOS_SUMA_RESTA: Record<DificultadNum, [number, number]> = {
    1: [10, 99],
    2: [100, 999],
    3: [1000, 9999],
};

function generarSumaResta(operacion: 'suma' | 'resta', dificultad: DificultadNum): ProblemaMatematico {
    const [min, max] = RANGOS_SUMA_RESTA[dificultad];
    let a = randomInt(min, max);
    let b = randomInt(min, max);

    if (operacion === 'resta') {
        // Sin negativos: en 4to de primaria (NEM) aun no se ensenan.
        // Sin resultado 0: si son iguales se separan sin salir del rango.
        if (a === b) {
            if (b > min) b--;
            else a++;
        }
        if (a < b) [a, b] = [b, a];
    }

    const resultado = operacion === 'suma' ? a + b : a - b;
    return armarProblema([a, b], resultado, dificultad);
}

const RANGOS_MULTIPLICACION: Record<DificultadNum, { op1: [number, number]; op2: [number, number] }> = {
    1: { op1: [10, 99], op2: [2, 9] },
    2: { op1: [10, 99], op2: [2, 9] },
    3: { op1: [100, 499], op2: [10, 49] },
};

function generarMultiplicacion(dificultad: DificultadNum): ProblemaMatematico {
    const { op1, op2 } = RANGOS_MULTIPLICACION[dificultad];
    const a = randomInt(op1[0], op1[1]);
    const b = randomInt(op2[0], op2[1]);
    const resultado = a * b;
    return armarProblema([a, b], resultado, dificultad);
}

type RangoDivision = { divisor: [number, number]; cociente: [number, number] };

// Dificultad dificil.
const RANGO_DIVISION_DIFICIL: RangoDivision = { divisor: [2, 9], cociente: [300, 999] };

// Divisores mayores que en RANGO_DIVISION_DIFICIL, para igualar el nivel fijo original (25).
const RANGO_DIVISION_DIFICIL_PRUEBA: RangoDivision = { divisor: [16, 30], cociente: [50, 200] };

// Dificultad facil y media (repaso y prueba): divisor de hasta 2 digitos y
// dividendo de hasta 4 digitos.
const DIVISION_FACIL_MEDIA = { divisor: [2, 99] as [number, number], cocienteMin: 10, dividendoMax: 9999 };

function generarDivision(dificultad: DificultadNum, esPrueba: boolean): ProblemaMatematico {
    if (dificultad !== 3) {
        const divisor = randomInt(DIVISION_FACIL_MEDIA.divisor[0], DIVISION_FACIL_MEDIA.divisor[1]);
        const cociente = randomInt(DIVISION_FACIL_MEDIA.cocienteMin, Math.floor(DIVISION_FACIL_MEDIA.dividendoMax / divisor));
        return armarProblema([divisor * cociente, divisor], cociente, dificultad);
    }

    const rango = esPrueba ? RANGO_DIVISION_DIFICIL_PRUEBA : RANGO_DIVISION_DIFICIL;
    const divisor = randomInt(rango.divisor[0], rango.divisor[1]);
    const cociente = randomInt(rango.cociente[0], rango.cociente[1]);
    // Division exacta garantizada: dividendo = divisor * cociente.
    const dividendo = divisor * cociente;
    return armarProblema([dividendo, divisor], cociente, dificultad);
}

export function generateProblema(operacion: Operacion, dificultad: DificultadNum, esPrueba: boolean = false): ProblemaMatematico {
    switch (operacion) {
        case 'suma':
        case 'resta':
            return generarSumaResta(operacion, dificultad);
        case 'multiplicacion':
            return generarMultiplicacion(dificultad);
        case 'division':
            return generarDivision(dificultad, esPrueba);
    }
}
