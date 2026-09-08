import path from 'node:path';

const authDirectory = process.env.E2E_AUTH_DIR;

if (!authDirectory) {
  throw new Error('As sessões E2E devem ser fornecidas pelo runner isolado.');
}

export function authState(name) {
  return path.join(authDirectory, `${name}.json`);
}
