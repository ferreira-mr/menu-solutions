import {
    getSchoolDate,
    getSchoolDateFromInstant,
    getSchoolWeekdayName,
    normalizeSchoolCalendar,
    selectEffectiveContagens,
} from './schoolCalendar';

describe('calendário escolar', () => {
    it('mantém o mesmo dia antes da meia-noite UTC e muda à meia-noite local', () => {
        expect(getSchoolDate('2026-09-08T02:59:59Z')).toBe('2026-09-07');
        expect(getSchoolDate('2026-09-08T03:00:00Z')).toBe('2026-09-08');
    });

    it('calcula o dia da semana e datas de instantes no fuso informado', () => {
        expect(getSchoolWeekdayName('2026-09-08T01:00:00Z', 'America/Sao_Paulo')).toBe('segunda');
        expect(getSchoolDate('2026-09-07T12:00:00Z', 'Pacific/Auckland')).toBe('2026-09-08');
        expect(getSchoolDateFromInstant('2026-09-08T02:59:59Z')).toBe('2026-09-07');
    });

    it('normaliza o envelope autenticado e não aceita fuso inválido', () => {
        expect(normalizeSchoolCalendar({
            data: {
                data_atual: '2026-09-07',
                timezone: 'America/Sao_Paulo',
                agora: '2026-09-08T01:00:00.000000Z',
            },
        })).toEqual({
            dataAtual: '2026-09-07',
            timezone: 'America/Sao_Paulo',
            agora: '2026-09-08T01:00:00.000000Z',
        });

        expect(normalizeSchoolCalendar({ data: { timezone: 'invalid/timezone', agora: '2026-09-08T03:00:00Z' } }).timezone)
            .toBe('America/Sao_Paulo');
    });

    it('seleciona uma revisão efetiva por turma usando hora e ID', () => {
        expect(selectEffectiveContagens([
            { id: 10, turmas_id: 1, data_contagem: '2026-09-07', hora_contagem: '08:00:00', qtd_contagem: 10 },
            { id: 11, turmas_id: 1, data_contagem: '2026-09-07', hora_contagem: '08:00:00', qtd_contagem: 20 },
            { id: 12, turmas_id: 2, data_contagem: '2026-09-07', hora_contagem: '07:00:00', qtd_contagem: 5 },
        ], '2026-09-07')).toEqual([
            { id: 11, turmas_id: 1, data_contagem: '2026-09-07', hora_contagem: '08:00:00', qtd_contagem: 20 },
            { id: 12, turmas_id: 2, data_contagem: '2026-09-07', hora_contagem: '07:00:00', qtd_contagem: 5 },
        ]);
    });
});
