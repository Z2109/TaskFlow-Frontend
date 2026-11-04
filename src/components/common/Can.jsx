
"use client";

import { usePermissions } from "@/context/PermissionContext";

export default function Can({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}) {
  const {
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = usePermissions();

  if (loading) return null;

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  }

  if (permissions.length > 0) {
    allowed = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  return allowed ? children : fallback;
}
