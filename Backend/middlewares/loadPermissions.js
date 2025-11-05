const db = require('../db');

async function getUserPermissions(userId) {
  const [roles] = await db.query(
    `SELECT r.role_id, r.role_name
     FROM tbUserRoles ur
     JOIN tbRoles r ON ur.role_id = r.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );

  const permissionSet = new Set();

  for (const role of roles) {
    const [perms] = await db.query(
      `SELECT p.permission_name, s.screen_name
       FROM tbRolePermissions rp
       JOIN tbPermissions p ON rp.permission_id = p.permission_id
       JOIN tbScreens s ON rp.screen_id = s.screen_id
       WHERE rp.role_id = ?`,
      [role.role_id]
    );

    perms.forEach(p => permissionSet.add(`${p.screen_name}.${p.permission_name}`));
  }

  return [...permissionSet];
}

async function loadPermissions(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // If super admin (employee), grant all permissions
    if (req.user.type === 'employee') {
      req.user.permissions = ['admin'];
    } else {
      req.user.permissions = await getUserPermissions(req.user.id);
    }

    next();
  } catch (err) {
    console.error('Failed to load permissions', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = loadPermissions;
