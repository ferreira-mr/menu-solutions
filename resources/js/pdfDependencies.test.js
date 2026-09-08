import packageJson from '../../package.json';

const minimumSafeVersions = {
  jspdf: [4, 2, 1],
  'html2pdf.js': [0, 14, 0],
  'jspdf-autotable': [5, 0, 8],
};

const parseVersion = (version) => String(version)
  .replace(/^[^0-9]*/, '')
  .split('.')
  .slice(0, 3)
  .map((part) => Number.parseInt(part, 10) || 0);

const isAtLeast = (actual, minimum) => {
  const parsedActual = parseVersion(actual);
  for (let index = 0; index < minimum.length; index += 1) {
    if (parsedActual[index] !== minimum[index]) {
      return parsedActual[index] > minimum[index];
    }
  }

  return true;
};

describe('dependências de exportação PDF', () => {
  it('mantém versões sem os avisos críticos conhecidos', () => {
    Object.entries(minimumSafeVersions).forEach(([name, minimum]) => {
      expect(
        isAtLeast(packageJson.dependencies[name], minimum),
        `${name} precisa ser >= ${minimum.join('.')}`,
      ).toBe(true);
    });
  });
});
