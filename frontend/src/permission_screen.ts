// ✅ Types
export interface Permission {
  permission_id: number;
  permission_name: string;
}

export interface Screen {
  screen_id: number;
  screen_name: string;
  permissions: Permission[];
}

export interface Role {
  role_id: number;
  role_name: string;
  screens: Screen[];
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  department: string;
  roles: Role[];
  hasSubscription: boolean;
}

// ✅ Permission function
function hasPermission(screenName: string, permissionName: string): boolean {
  const stored = localStorage.getItem("user");
  if (!stored) return false;

  let parsed: User;
  try {
    parsed = JSON.parse(stored) as User; // ✅ parse as User (not UserResponse)
  } catch {
    console.error("Invalid JSON in localStorage");
    return false;
  }

  const roles = parsed?.roles || [];
  if (!roles.length) return false;

  return roles.some((role) =>
    role.screens.some(
      (screen) =>
        screen.screen_name.toLowerCase() === screenName.toLowerCase() &&
        screen.permissions.some(
          (p) => p.permission_name.toLowerCase() === permissionName.toLowerCase()
        )
    )
  );
}

// ✅ Default export
export default { hasPermission };
