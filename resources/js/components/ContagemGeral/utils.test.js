import {
  formatFriendlyDate,
  formatFriendlyTime,
  parseISODateAsUTC,
  toISODateString,
} from './utils';

describe('utilitários de relatórios', () => {
  it('formata datas usando UTC sem deslocar o dia', () => {
    expect(toISODateString(new Date('2025-11-06T23:00:00-03:00'))).toBe('2025-11-07');
    expect(parseISODateAsUTC('2025-11-06').toISOString()).toBe('2025-11-06T00:00:00.000Z');
  });

  it('formata data amigável em português', () => {
    expect(formatFriendlyDate('2025-11-06')).toContain('novembro');
    expect(formatFriendlyDate('2025-11-06')).toContain('2025');
  });

  it('formata horário e possui fallback determinístico para data inválida', () => {
    expect(formatFriendlyTime('2025-11-06T13:45:00Z')).toMatch(/13:45|10:45/);
    expect(formatFriendlyTime('não-é-data')).toBe('Inválido');
  });
});
