import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setWorkspaces(res.data.workspaces || []);

        const savedWsId = localStorage.getItem('currentWorkspaceId');
        const activeWs = res.data.workspaces?.find((w) => w.id === savedWsId) || res.data.workspaces?.[0];

        if (activeWs) {
          setCurrentWorkspace(activeWs);
          localStorage.setItem('currentWorkspaceId', activeWs.id);
        }
      } catch (err) {
        console.error('[Auth] Verification failed:', err.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setWorkspaces(res.data.workspaces || []);

    if (res.data.currentWorkspace) {
      setCurrentWorkspace(res.data.currentWorkspace);
      localStorage.setItem('currentWorkspaceId', res.data.currentWorkspace.id);
    }
    return res.data;
  };

  const register = async (name, email, password, organizationName) => {
    const res = await api.post('/auth/register', { name, email, password, organizationName });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    if (res.data.currentWorkspace) {
      setCurrentWorkspace(res.data.currentWorkspace);
      setWorkspaces([res.data.currentWorkspace]);
      localStorage.setItem('currentWorkspaceId', res.data.currentWorkspace.id);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentWorkspaceId');
    setUser(null);
    setCurrentWorkspace(null);
    setWorkspaces([]);
    window.location.href = '/login';
  };

  const switchWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspaceId', workspace.id || workspace._id);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentWorkspace,
        workspaces,
        loading,
        login,
        register,
        logout,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

