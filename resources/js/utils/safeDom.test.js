import { createDomElement, safeHttpUrl, safePaginatorLabel, safePublicAssetUrl } from './safeDom';

describe('safeDom', () => {
  it('cria campos DOM com valores literais, sem interpretar marcação', () => {
    const value = '"><img src=x onerror="window.__xssMarker = true"> <Equipe>';
    const form = createDomElement('div', {}, [
      createDomElement('input', { id: 'campo', value }),
      createDomElement('textarea', { id: 'descricao', value }),
    ]);

    expect(form.querySelector('#campo')).toHaveValue(value);
    expect(form.querySelector('#descricao')).toHaveValue(value);
    expect(form.querySelector('img, [onerror], script')).not.toBeInTheDocument();
  });

  it('aceita apenas URLs HTTP(S) e nomes de arquivo público esperados', () => {
    expect(safeHttpUrl('javascript:window.__xssMarker = true', '/fallback.png')).toBe('/fallback.png');
    expect(safeHttpUrl('data:text/html,<img>', '/fallback.png')).toBe('/fallback.png');
    expect(safePublicAssetUrl('/uploads', 'foto-01.webp', '/fallback.png')).toBe('http://localhost:3000/uploads/foto-01.webp');
    expect(safePublicAssetUrl('/uploads', '../app.js', '/fallback.png')).toBe('/fallback.png');
  });

  it('converte somente os rótulos conhecidos da paginação', () => {
    expect(safePaginatorLabel('&laquo; Previous')).toBe('« Anterior');
    expect(safePaginatorLabel('Next &raquo;')).toBe('Próximo »');
    expect(safePaginatorLabel('<img onerror="x">')).toBe('<img onerror="x">');
  });
});
