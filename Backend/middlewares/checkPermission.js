// middlewares/checkPermission.js
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    try {
      console.log('User permissions:', req.user?.permissions);
      console.log('Checking for permission:', requiredPermission);
      const userPermissions = req.user?.permissions || [];
      if (userPermissions.includes(requiredPermission) || userPermissions.includes('admin')|| userPermissions.includes('all')) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden: insufficient permission' });
    } catch (err) {
      console.error('Permission check error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}


module.exports = checkPermission;
