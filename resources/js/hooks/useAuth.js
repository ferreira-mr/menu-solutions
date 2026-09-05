import { useState, useEffect } from 'react';
import { USER_ROLES, ROLE_NAMES } from '../constants/roles';
import { getUserData, logoutUser } from '../services/api';

export const useAuth = () => {
  const token = localStorage.getItem('authToken');
  const userLevel = localStorage.getItem('userLevel');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = ROLE_NAMES[userLevel] || null;
  const isStaff = Number(userLevel) === USER_ROLES.STAFF;
  const isNutri = Number(userLevel) === USER_ROLES.NUTRI;
  const isDiretora = Number(userLevel) === USER_ROLES.DIRETORA;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    getUserData()
      .then((data) => {
        if (isMounted) setUser(data);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignora erro de rede no logout
    } finally {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return { token, userLevel, user, role, isStaff, isNutri, isDiretora, loading, logout };
};

export default useAuth;
