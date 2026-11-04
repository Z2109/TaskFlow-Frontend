
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "@/services/api";

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async () => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const organizationId =
      localStorage.getItem("organizationId");

    if (!token || !organizationId) {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        "/permissions/my-permissions"
      );

      if (response.data.success) {
        setPermissions(response.data.permissions || []);
        setRoles(response.data.roles || []);
      } else {
        setPermissions([]);
        setRoles([]);
      }
    } catch (err) {
      console.error("Permission fetch error:", err);

      setPermissions([]);
      setRoles([]);
      setError(
        err.response?.data?.message ||
        "Unable to load permissions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permission) => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions = []) =>
      requiredPermissions.some((permission) =>
        permissions.includes(permission)
      ),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions = []) =>
      requiredPermissions.every((permission) =>
        permissions.includes(permission)
      ),
    [permissions]
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        roles,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error(
      "usePermissions must be used inside PermissionProvider"
    );
  }

  return context;
}
