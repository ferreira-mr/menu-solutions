import { useCallback, useEffect, useMemo, useState } from 'react';
import { getContextoEscolar } from '../../services/api';
import {
    DEFAULT_SCHOOL_TIMEZONE,
    getSchoolDate,
    getSchoolWeekdayIndex,
    getSchoolWeekdayName,
    normalizeSchoolCalendar,
} from './schoolCalendar';

const initialCalendar = {
    dataAtual: getSchoolDate(new Date(), DEFAULT_SCHOOL_TIMEZONE),
    timezone: DEFAULT_SCHOOL_TIMEZONE,
    agora: null,
};

export const useSchoolCalendar = () => {
    const [calendar, setCalendar] = useState(initialCalendar);

    const refresh = useCallback(async () => {
        try {
            const response = await getContextoEscolar();
            setCalendar(normalizeSchoolCalendar(response));
        } catch (error) {
            console.error('Não foi possível atualizar o calendário escolar:', error);
        }
    }, []);

    useEffect(() => {
        refresh();

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        const intervalId = window.setInterval(refresh, 60_000);

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [refresh]);

    const instant = useMemo(() => calendar.agora || new Date(), [calendar.agora]);
    const weekdayIndex = useMemo(
        () => getSchoolWeekdayIndex(instant, calendar.timezone),
        [instant, calendar.timezone],
    );
    const weekdayName = useMemo(
        () => getSchoolWeekdayName(instant, calendar.timezone),
        [instant, calendar.timezone],
    );

    return {
        ...calendar,
        schoolDay: calendar.dataAtual,
        weekdayIndex,
        weekdayName,
        refresh,
    };
};
