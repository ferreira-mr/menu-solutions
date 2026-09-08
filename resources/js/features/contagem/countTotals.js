import { selectEffectiveContagens } from './schoolCalendar';

const asQuantity = value => {
    const quantity = Number(value);
    return Number.isFinite(quantity) ? quantity : 0;
};

export const includesRegularTotal = category => category?.inclui_total_regular !== false;

export const emptyCountTotals = () => ({
    total_regular: 0,
    total_outros: 0,
    total_combinado: 0,
});

export const addCategoryQuantity = (totals, category, quantity) => {
    const amount = asQuantity(quantity);
    totals.total_combinado += amount;
    if (includesRegularTotal(category)) totals.total_regular += amount;
    else totals.total_outros += amount;
    return totals;
};

export const summarizeDashboardTotals = (categories = []) => {
    const totals = emptyCountTotals();

    categories.forEach(category => {
        const categoryTotal = (category?.turmas || [])
            .reduce((sum, turma) => sum + asQuantity(turma.qtd_contagem), 0);
        addCategoryQuantity(totals, category, categoryTotal);
    });

    return totals;
};

export const summarizeContagemTotals = (contagens = [], schoolDay = null) => {
    const totals = emptyCountTotals();
    selectEffectiveContagens(contagens, schoolDay).forEach(contagem => {
        const category = contagem?.turma?.categoria || contagem?.categoria;
        addCategoryQuantity(totals, category, contagem?.qtd_contagem);
    });
    return totals;
};

export const normalizeCountTotals = (totals, fallback = emptyCountTotals()) => ({
    total_regular: asQuantity(totals?.total_regular ?? fallback.total_regular),
    total_outros: asQuantity(totals?.total_outros ?? fallback.total_outros),
    total_combinado: asQuantity(totals?.total_combinado ?? fallback.total_combinado),
});
