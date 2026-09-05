export const USER_ROLES = {
  STAFF: 1,
  NUTRI: 2,
  DIRETORA: 3,
};

export const ROLE_NAMES = {
  [USER_ROLES.STAFF]: 'inspetora',
  [USER_ROLES.NUTRI]: 'nutri',
  [USER_ROLES.DIRETORA]: 'diretora',
};

export const ROLE_LABELS = {
  [USER_ROLES.STAFF]: 'Inspetora',
  [USER_ROLES.NUTRI]: 'Nutricionista',
  [USER_ROLES.DIRETORA]: 'Diretoria',
};

export const ROLE_HOME_ROUTES = {
  [USER_ROLES.STAFF]: '/inspetora/inicio',
  [USER_ROLES.NUTRI]: '/nutri/dashboard',
  [USER_ROLES.DIRETORA]: '/diretora/inicio',
};
