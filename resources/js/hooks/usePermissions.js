import { USER_ROLES, ROLE_NAMES, ROLE_LABELS, ROLE_HOME_ROUTES } from '../constants/roles';

export const usePermissions = () => {
  const level = Number(localStorage.getItem('userLevel'));
  const isStaff = level === USER_ROLES.STAFF;
  const isNutri = level === USER_ROLES.NUTRI;
  const isDiretor = level === USER_ROLES.DIRETORA;

  return {
    userLevel: level,
    roleName: ROLE_NAMES[level] || null,
    roleLabel: ROLE_LABELS[level] || 'Usuário',
    homeRoute: ROLE_HOME_ROUTES[level] || '/',
    isStaff,
    isInspetora: isStaff,
    isNutri,
    isDiretor,
    isDiretora: isDiretor,
    canApprove: isDiretor,
    canCreateAutorizado: isNutri,
    canApproveAutorizado: isDiretor,
    canDeleteAutorizado: isNutri,
    canManageCatalog: isNutri,
    canManageCatalogs: isNutri,
    canManageUsers: isNutri || isDiretor,
    canCount: isStaff || isNutri,
  };
};

export default usePermissions;
