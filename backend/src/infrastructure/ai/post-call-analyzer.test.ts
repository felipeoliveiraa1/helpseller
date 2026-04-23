import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recomputeAdherence } from './post-call-analyzer.js';

describe('recomputeAdherence', () => {
    it('retorna null para array vazio ou não-array', () => {
        assert.equal(recomputeAdherence([]), null);
        assert.equal(recomputeAdherence(null), null);
        assert.equal(recomputeAdherence(undefined), null);
        assert.equal(recomputeAdherence('not an array'), null);
    });

    it('retorna 0 quando todas as etapas são NAO_APLICAVEL', () => {
        const etapas = [
            { nome: 'A', status: 'NAO_APLICAVEL', peso: 1 },
            { nome: 'B', status: 'NAO_APLICAVEL', peso: 2 },
        ];
        assert.equal(recomputeAdherence(etapas), 0);
    });

    it('calcula 100% quando todas CUMPRIDA com peso 1', () => {
        const etapas = [
            { nome: 'A', status: 'CUMPRIDA', peso: 1 },
            { nome: 'B', status: 'CUMPRIDA', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 100);
    });

    it('aplica pesos corretamente: crítica cumprida + padrão não cumprida', () => {
        // peso=2 cumprida(1.0) + peso=1 nao_cumprida(0) = 2 / 3 = 66.67 → 67
        const etapas = [
            { nome: 'Fechamento', status: 'CUMPRIDA', peso: 2 },
            { nome: 'Extra', status: 'NAO_CUMPRIDA', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 67);
    });

    it('PARCIAL conta como 0.5', () => {
        // 1.0 + 0.5 = 1.5 / 2 = 75
        const etapas = [
            { nome: 'A', status: 'CUMPRIDA', peso: 1 },
            { nome: 'B', status: 'PARCIAL', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 75);
    });

    it('NAO_APLICAVEL é excluída do denominador', () => {
        // Só B conta (CUMPRIDA, peso 1): 1/1 = 100
        const etapas = [
            { nome: 'A', status: 'NAO_APLICAVEL', peso: 2 },
            { nome: 'B', status: 'CUMPRIDA', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 100);
    });

    it('ignora etapas com status inválido', () => {
        const etapas = [
            { nome: 'A', status: 'SOMETHING_ELSE', peso: 1 },
            { nome: 'B', status: 'CUMPRIDA', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 100);
    });

    it('aceita status em minúsculas ou misto', () => {
        const etapas = [
            { nome: 'A', status: 'cumprida', peso: 1 },
            { nome: 'B', status: 'Parcial', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 75);
    });

    it('normaliza peso ausente para 1', () => {
        const etapas = [
            { nome: 'A', status: 'CUMPRIDA' },
            { nome: 'B', status: 'NAO_CUMPRIDA' },
        ];
        assert.equal(recomputeAdherence(etapas as any), 50);
    });

    it('normaliza peso inválido: >=1.5 vira 2, senão 1, e chama callback', () => {
        const observed: Array<{ original: unknown; normalized: number }> = [];
        const etapas = [
            { nome: 'A', status: 'CUMPRIDA', peso: 5 },
            { nome: 'B', status: 'NAO_CUMPRIDA', peso: 0.3 },
        ];
        // peso 5 → 2 (CUMPRIDA): 1*2 = 2; peso 0.3 → 1 (NAO_CUMPRIDA): 0. total = 2/3 = 67
        const result = recomputeAdherence(etapas, (orig, norm) => observed.push({ original: orig, normalized: norm }));
        assert.equal(result, 67);
        assert.equal(observed.length, 2);
        assert.equal(observed[0].original, 5);
        assert.equal(observed[0].normalized, 2);
        assert.equal(observed[1].original, 0.3);
        assert.equal(observed[1].normalized, 1);
    });

    it('não chama callback quando pesos são 1 ou 2 exatos', () => {
        const observed: unknown[] = [];
        const etapas = [
            { nome: 'A', status: 'CUMPRIDA', peso: 1 },
            { nome: 'B', status: 'PARCIAL', peso: 2 },
        ];
        recomputeAdherence(etapas, (o) => observed.push(o));
        assert.equal(observed.length, 0);
    });

    it('arredonda corretamente valores não-inteiros', () => {
        // 3 etapas CUMPRIDA (1.0) + 1 NAO_CUMPRIDA = 3/4 = 75 (exato)
        // Mas 1 CUMPRIDA + 2 NAO_CUMPRIDA = 1/3 = 33.33 → 33
        const etapas = [
            { nome: 'A', status: 'CUMPRIDA', peso: 1 },
            { nome: 'B', status: 'NAO_CUMPRIDA', peso: 1 },
            { nome: 'C', status: 'NAO_CUMPRIDA', peso: 1 },
        ];
        assert.equal(recomputeAdherence(etapas), 33);
    });
});
