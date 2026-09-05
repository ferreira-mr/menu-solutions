import { USER_ROLES } from '../constants/roles';

export const usePermissions = () => {
  const level = Number(localStorage.getItem('userLevel'));

  return {
    userLevel: level,
    isStaff: level === USER_ROLES.STAFF,
    isNutri: level === USER_ROLES.NUTRI,
    isDiretora: level === USER_ROLES.DIRETORA,
    canCreateAutorizado: level === USER_ROLES.NUTRI,
    canApproveAutorizado: level === USER_ROLES.DIRETORA,
    canDeleteAutorizado: level === USER_ROLES.NUTRI,
    canManageCatalog: level === USER_ROLES.NUTRI,
    canCount: level === USER_ROLES.STAFF || level === USER_ROLES.NUTRI,
  };
};

export default usePermissions;
