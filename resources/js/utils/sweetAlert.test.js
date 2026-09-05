import MySwal from './sweetAlert';

describe('sweetAlert mixin', () => {
  it('exporta instância configurada do SweetAlert', () => {
    expect(MySwal).toBeDefined();
    expect(typeof MySwal.fire).toBe('function');
  });
});
