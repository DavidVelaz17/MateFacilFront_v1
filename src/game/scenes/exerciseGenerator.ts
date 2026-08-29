import type { DificultadNum, ProblemaMatematico } from './LevelsData';

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

const RANGOS_SUMA_RESTA: Record<DificultadNum, [number, number]> = {
    1: [100, 999],
    2: [1000, 9999],
    3: [10000, 499999],
};

function generarSumaResta(operacion: 'suma' | 'resta', dificultad: DificultadNum): ProblemaMatematico {
    const [min, max] = RANGOS_SUMA_RESTA[dificultad];
    let a = randomInt(min, max);
    let b = randomInt(min, max);

    if (operacion === 'resta') {
        // Sin negativos: en 4to de primaria (NEM) aun no se ensenan.
        if (a === b) b = Math.max(min, b - 1);
        if (a < b) [a, b] = [b, a];
    }

    const resultado = operacion === 'suma' ? a + b : a - b;
    return { cifras: [a, b], resultado, trampas: generarTrampas([a, b], 3, [resultado]) };
}

const RANGOS_MULTIPLICACION: Record<DificultadNum, { op1: [number, number]; op2: [number, number] }> = {
    1: { op1: [10, 99], op2: [2, 9] },
    2: { op1: [100, 499], op2: [10, 49] },
    3: { op1: [500, 999], op2: [50, 99] },
};

function generarMultiplicacion(dificultad: DificultadNum): ProblemaMatematico {
    const { op1, op2 } = RANGOS_MULTIPLICACION[dificultad];
    const a = randomInt(op1[0], op1[1]);
    const b = randomInt(op2[0], op2[1]);
    const resultado = a * b;
    return { cifras: [a, b], resultado, trampas: generarTrampas([a, b], 3, [resultado]) };
}

const RANGOS_DIVISION: Record<DificultadNum, { divisor: [number, number]; cociente: [number, number] }> = {
    1: { divisor: [2, 9], cociente: [10, 99] },
    2: { divisor: [2, 9], cociente: [100, 299] },
    3: { divisor: [2, 9], cociente: [300, 999] },
};

// Divisores mayores que en RANGOS_DIVISION, para igualar los niveles fijos originales (6, 12, 25).
const RANGOS_DIVISION_PRUEBA: Record<DificultadNum, { divisor: [number, number]; cociente: [number, number] }> = {
    1: { divisor: [4, 8], cociente: [20, 90] },
    2: { divisor: [9, 15], cociente: [50, 150] },
    3: { divisor: [16, 30], cociente: [50, 200] },
};

function generarDivision(dificultad: DificultadNum, esPrueba: boolean): ProblemaMatematico {
    const rango = esPrueba ? RANGOS_DIVISION_PRUEBA[dificultad] : RANGOS_DIVISION[dificultad];
    const divisor = randomInt(rango.divisor[0], rango.divisor[1]);
    const cociente = randomInt(rango.cociente[0], rango.cociente[1]);
    // Division exacta garantizada: dividendo = divisor * cociente.
    const dividendo = divisor * cociente;
    return { cifras: [dividendo, divisor], resultado: cociente, trampas: generarTrampas([dividendo, divisor], 3, [cociente]) };
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
