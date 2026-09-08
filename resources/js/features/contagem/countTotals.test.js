import {
    normalizeCountTotals,
    summarizeContagemTotals,
    summarizeDashboardTotals,
} from './countTotals';

describe('totais de contagens', () => {
    it('separa Regular e Outros usando a revisão efetiva por turma', () => {
        const contagens = [
            {
                id: 1,
                turmas_id: 10,
                data_contagem: '2026-09-08',
                hora_contagem: '07:10:00',
                qtd_contagem: 10,
                turma: { categoria: { inclui_total_regular: true } },
            },
            {
                id: 2,
                turmas_id: 10,
                data_contagem: '2026-09-08',
                hora_contagem: '07:15:00',
                qtd_contagem: 28,
                turma: { categoria: { inclui_total_regular: true } },
            },
            {
                id: 3,
                turmas_id: 11,
                data_contagem: '2026-09-08',
                hora_contagem: '07:20:00',
                qtd_contagem: 15,
                turma: { categoria: { inclui_total_regular: false } },
            },
        ];

        expect(summarizeContagemTotals(contagens, '2026-09-08')).toEqual({
            total_regular: 28,
            total_outros: 15,
            total_combinado: 43,
        });
    });

    it('aplica a classificação explícita ao dashboard e normaliza o envelope da API', () => {
        const categories = [
            {
                inclui_total_regular: true,
                turmas: [{ data_contagem: '2026-09-08', qtd_contagem: 28 }],
            },
            {
                inclui_total_regular: false,
                turmas: [{ data_contagem: '2026-09-08', qtd_contagem: 15 }],
            },
        ];

        expect(summarizeDashboardTotals(categories)).toEqual({
            total_regular: 28,
            total_outros: 15,
            total_combinado: 43,
        });
        expect(normalizeCountTotals({ total_regular: '28', total_outros: 15, total_combinado: 43 }))
            .toEqual({ total_regular: 28, total_outros: 15, total_combinado: 43 });
    });
});
