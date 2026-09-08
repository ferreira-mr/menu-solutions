export const DEFAULT_SCHOOL_TIMEZONE = 'America/Sao_Paulo';

const WEEKDAY_NAMES = {
    sunday: 'domingo',
    monday: 'segunda',
    tuesday: 'terça',
    wednesday: 'quarta',
    thursday: 'quinta',
    friday: 'sexta',
    saturday: 'sábado',
};

const asDate = (instant) => {
    if (instant instanceof Date) return instant;
    const date = new Date(instant);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const validTimezone = (timezone) => {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
        return timezone;
    } catch {
        return DEFAULT_SCHOOL_TIMEZONE;
    }
};

export const getSchoolDate = (instant = new Date(), timezone = DEFAULT_SCHOOL_TIMEZONE) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: validTimezone(timezone),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(asDate(instant));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    return `${values.year}-${values.month}-${values.day}`;
};

export const getSchoolWeekdayIndex = (instant = new Date(), timezone = DEFAULT_SCHOOL_TIMEZONE) => {
    const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: validTimezone(timezone),
        weekday: 'long',
    }).format(asDate(instant)).toLowerCase();
    return Object.keys(WEEKDAY_NAMES).indexOf(weekday);
};

export const getSchoolWeekdayName = (instant = new Date(), timezone = DEFAULT_SCHOOL_TIMEZONE) => {
    const weekdayIndex = getSchoolWeekdayIndex(instant, timezone);
    return Object.values(WEEKDAY_NAMES)[weekdayIndex] || WEEKDAY_NAMES.sunday;
};

export const getSchoolDateFromInstant = (value, timezone = DEFAULT_SCHOOL_TIMEZONE) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return getSchoolDate(value, timezone);
};

export const selectEffectiveContagens = (contagens = [], schoolDay = null) => {
    const efetivas = new Map();

    contagens.forEach((contagem, index) => {
        if (schoolDay && contagem?.data_contagem !== schoolDay) return;

        const turmaId = Number(contagem?.turmas_id);
        if (!Number.isInteger(turmaId)) {
            efetivas.set(`sem-turma:${contagem?.id ?? index}`, contagem);
            return;
        }

        const chave = schoolDay ? turmaId : `${contagem.data_contagem || ''}:${turmaId}`;
        const atual = efetivas.get(chave);
        const horaAtual = String(atual?.hora_contagem || '');
        const horaNova = String(contagem?.hora_contagem || '');
        const idAtual = Number(atual?.id || 0);
        const idNovo = Number(contagem?.id || 0);

        if (!atual || horaNova > horaAtual || (horaNova === horaAtual && idNovo > idAtual)) {
            efetivas.set(chave, contagem);
        }
    });

    return [...efetivas.values()];
};

export const normalizeSchoolCalendar = (payload) => {
    const context = payload?.data ?? payload ?? {};
    const timezone = validTimezone(context.timezone || DEFAULT_SCHOOL_TIMEZONE);
    const dataAtual = /^\d{4}-\d{2}-\d{2}$/.test(context.data_atual || '')
        ? context.data_atual
        : getSchoolDate(context.agora || new Date(), timezone);

    return {
        dataAtual,
        timezone,
        agora: context.agora || null,
    };
};
