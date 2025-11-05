// import  { useState } from 'react';
// import { Shield, Users,  Save, Plus,  Trash2, Check, X } from 'lucide-react';//Lock, Key,Edit,

// const Permissions = () => {
//   const [selectedRole, setSelectedRole] = useState('Admin');
//   const [showAddRole, setShowAddRole] = useState(false);
//   const [newRole, setNewRole] = useState({ name: '', description: '' });

//   const roles = [
//     {
//       name: 'Admin',
//       description: 'Full system access with all permissions',
//       userCount: 3,
//       color: 'purple'
//     },
//     {
//       name: 'Manager',
//       description: 'Department-level access with management permissions',
//       userCount: 8,
//       color: 'blue'
//     },
//     {
//       name: 'User',
//       description: 'Basic user access with limited permissions',
//       userCount: 25,
//       color: 'green'
//     },
//     {
//       name: 'Viewer',
//       description: 'Read-only access to system data',
//       userCount: 12,
//       color: 'gray'
//     }
//   ];

//   const modules = [
//     {
//       name: 'Dashboard',
//       permissions: ['view']
//     },
//     {
//       name: 'Masters',
//       permissions: ['view', 'create', 'edit', 'delete']
//     },
//     {
//       name: 'Vouchers',
//       permissions: ['view', 'create', 'edit', 'delete', 'approve']
//     },
//     {
//       name: 'Reports',
//       permissions: ['view', 'export', 'schedule']
//     },
//     {
//       name: 'Audit',
//       permissions: ['view', 'export', 'configure']
//     },
//     {
//       name: 'Configuration',
//       permissions: ['view', 'edit', 'admin']
//     },
//     {
//       name: 'User Management',
//       permissions: ['view', 'create', 'edit', 'delete', 'suspend']
//     },
//     {
//       name: 'Backup & Restore',
//       permissions: ['view', 'create', 'restore', 'delete']
//     }
//   ];

//   const rolePermissions = {
//     'Admin': {
//       'Dashboard': ['view'],
//       'Masters': ['view', 'create', 'edit', 'delete'],
//       'Vouchers': ['view', 'create', 'edit', 'delete', 'approve'],
//       'Reports': ['view', 'export', 'schedule'],
//       'Audit': ['view', 'export', 'configure'],
//       'Configuration': ['view', 'edit', 'admin'],
//       'User Management': ['view', 'create', 'edit', 'delete', 'suspend'],
//       'Backup & Restore': ['view', 'create', 'restore', 'delete']
//     },
//     'Manager': {
//       'Dashboard': ['view'],
//       'Masters': ['view', 'create', 'edit'],
//       'Vouchers': ['view', 'create', 'edit', 'approve'],
//       'Reports': ['view', 'export'],
//       'Audit': ['view', 'export'],
//       'Configuration': ['view'],
//       'User Management': ['view'],
//       'Backup & Restore': ['view']
//     },
//     'User': {
//       'Dashboard': ['view'],
//       'Masters': ['view'],
//       'Vouchers': ['view', 'create', 'edit'],
//       'Reports': ['view'],
//       'Audit': ['view'],
//       'Configuration': [],
//       'User Management': [],
//       'Backup & Restore': []
//     },
//     'Viewer': {
//       'Dashboard': ['view'],
//       'Masters': ['view'],
//       'Vouchers': ['view'],
//       'Reports': ['view'],
//       'Audit': ['view'],
//       'Configuration': [],
//       'User Management': [],
//       'Backup & Restore': []
//     }
//   };

//   const handlePermissionToggle = (module, permission) => {
//     // Toggle permission logic here
//     console.log(`Toggling ${permission} for ${module} in role ${selectedRole}`);
//   };

//   const handleAddRole = () => {
//     if (newRole.name && newRole.description) {
//       alert('Role added successfully!');
//       setShowAddRole(false);
//       setNewRole({ name: '', description: '' });
//     }
//   };

//   const handleDeleteRole = (roleName) => {
//     if (confirm(`Are you sure you want to delete the ${roleName} role?`)) {
//       alert('Role deleted successfully!');
//     }
//   };

//   const getRoleColor = (color) => {
//     const colors = {
//       purple: 'bg-purple-100 text-purple-800',
//       blue: 'bg-blue-100 text-blue-800',
//       green: 'bg-green-100 text-green-800',
//       gray: 'bg-gray-100 text-gray-800'
//     };
//     return colors[color] || colors.gray;
//   };

//   const hasPermission = (module, permission) => {
//     return rolePermissions[selectedRole]?.[module]?.includes(permission) || false;
//   };

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-xl font-semibold text-gray-900">Permissions Management</h2>
//             <p className="text-sm text-gray-600 mt-1">Configure role-based access control and permissions</p>
//           </div>
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={() => setShowAddRole(true)}
//               className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               <Plus className="h-4 w-4" />
//               <span>Add Role</span>
//             </button>
//             <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//               <Save className="h-4 w-4" />
//               <span>Save Changes</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Roles List */}
//         <div className="bg-white border rounded-lg p-6">
//           <div className="flex items-center space-x-2 mb-4">
//             <Users className="h-5 w-5 text-blue-600" />
//             <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
//           </div>
          
//           <div className="space-y-3">
//             {roles.map((role) => (
//               <div
//                 key={role.name}
//                 onClick={() => setSelectedRole(role.name)}
//                 className={`p-3 border rounded-lg cursor-pointer transition-colors ${
//                   selectedRole === role.name
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 hover:bg-gray-50'
//                 }`}
//               >
//                 <div className="flex items-center justify-between mb-2">
//                   <h4 className="font-medium text-gray-900">{role.name}</h4>
//                   <div className="flex items-center space-x-2">
//                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.color)}`}>
//                       {role.userCount} users
//                     </span>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDeleteRole(role.name);
//                       }}
//                       className="text-red-600 hover:text-red-800"
//                     >
//                       <Trash2 className="h-3 w-3" />
//                     </button>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-600">{role.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Permissions Matrix */}
//         <div className="lg:col-span-3 bg-white border rounded-lg p-6">
//           <div className="flex items-center space-x-2 mb-4">
//             <Shield className="h-5 w-5 text-blue-600" />
//             <h3 className="text-lg font-semibold text-gray-900">
//               Permissions for {selectedRole}
//             </h3>
//           </div>
          
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left text-sm font-medium text-gray-500 py-3">Module</th>
//                   <th className="text-center text-sm font-medium text-gray-500 py-3">View</th>
//                   <th className="text-center text-sm font-medium text-gray-500 py-3">Create</th>
//                   <th className="text-center text-sm font-medium text-gray-500 py-3">Edit</th>
//                   <th className="text-center text-sm font-medium text-gray-500 py-3">Delete</th>
//                   <th className="text-center text-sm font-medium text-gray-500 py-3">Special</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {modules.map((module) => (
//                   <tr key={module.name} className="hover:bg-gray-50">
//                     <td className="py-3 text-sm font-medium text-gray-900">
//                       {module.name}
//                     </td>
//                     <td className="py-3 text-center">
//                       {module.permissions.includes('view') && (
//                         <button
//                           onClick={() => handlePermissionToggle(module.name, 'view')}
//                           className={`p-1 rounded ${
//                             hasPermission(module.name, 'view')
//                               ? 'text-green-600 bg-green-100'
//                               : 'text-gray-400 bg-gray-100'
//                           }`}
//                         >
//                           {hasPermission(module.name, 'view') ? (
//                             <Check className="h-4 w-4" />
//                           ) : (
//                             <X className="h-4 w-4" />
//                           )}
//                         </button>
//                       )}
//                     </td>
//                     <td className="py-3 text-center">
//                       {module.permissions.includes('create') && (
//                         <button
//                           onClick={() => handlePermissionToggle(module.name, 'create')}
//                           className={`p-1 rounded ${
//                             hasPermission(module.name, 'create')
//                               ? 'text-green-600 bg-green-100'
//                               : 'text-gray-400 bg-gray-100'
//                           }`}
//                         >
//                           {hasPermission(module.name, 'create') ? (
//                             <Check className="h-4 w-4" />
//                           ) : (
//                             <X className="h-4 w-4" />
//                           )}
//                         </button>
//                       )}
//                     </td>
//                     <td className="py-3 text-center">
//                       {module.permissions.includes('edit') && (
//                         <button
//                           onClick={() => handlePermissionToggle(module.name, 'edit')}
//                           className={`p-1 rounded ${
//                             hasPermission(module.name, 'edit')
//                               ? 'text-green-600 bg-green-100'
//                               : 'text-gray-400 bg-gray-100'
//                           }`}
//                         >
//                           {hasPermission(module.name, 'edit') ? (
//                             <Check className="h-4 w-4" />
//                           ) : (
//                             <X className="h-4 w-4" />
//                           )}
//                         </button>
//                       )}
//                     </td>
//                     <td className="py-3 text-center">
//                       {module.permissions.includes('delete') && (
//                         <button
//                           onClick={() => handlePermissionToggle(module.name, 'delete')}
//                           className={`p-1 rounded ${
//                             hasPermission(module.name, 'delete')
//                               ? 'text-green-600 bg-green-100'
//                               : 'text-gray-400 bg-gray-100'
//                           }`}
//                         >
//                           {hasPermission(module.name, 'delete') ? (
//                             <Check className="h-4 w-4" />
//                           ) : (
//                             <X className="h-4 w-4" />
//                           )}
//                         </button>
//                       )}
//                     </td>
//                     <td className="py-3 text-center">
//                       <div className="flex justify-center space-x-1">
//                         {module.permissions.filter(p => !['view', 'create', 'edit', 'delete'].includes(p)).map((permission) => (
//                           <button
//                             key={permission}
//                             onClick={() => handlePermissionToggle(module.name, permission)}
//                             className={`px-2 py-1 text-xs rounded ${
//                               hasPermission(module.name, permission)
//                                 ? 'bg-blue-100 text-blue-800'
//                                 : 'bg-gray-100 text-gray-600'
//                             }`}
//                           >
//                             {permission}
//                           </button>
//                         ))}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* Permission Summary */}
//       <div className="mt-6 bg-white border rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Summary</h3>
        
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//           <div className="text-center">
//             <div className="text-2xl font-bold text-blue-600">
//               {Object.values(rolePermissions[selectedRole] || {}).flat().length}
//             </div>
//             <div className="text-sm text-gray-600">Total Permissions</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-green-600">
//               {Object.values(rolePermissions[selectedRole] || {}).filter(perms => perms.includes('view')).length}
//             </div>
//             <div className="text-sm text-gray-600">View Permissions</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-orange-600">
//               {Object.values(rolePermissions[selectedRole] || {}).filter(perms => perms.includes('edit')).length}
//             </div>
//             <div className="text-sm text-gray-600">Edit Permissions</div>
//           </div>
//           <div className="text-center">
//             <div className="text-2xl font-bold text-red-600">
//               {Object.values(rolePermissions[selectedRole] || {}).filter(perms => perms.includes('delete')).length}
//             </div>
//             <div className="text-sm text-gray-600">Delete Permissions</div>
//           </div>
//         </div>
//       </div>

//       {/* Add Role Modal */}
//       {showAddRole && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h3>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
//                 <input
//                   type="text"
//                   value={newRole.name}
//                   onChange={(e) => setNewRole({...newRole, name: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter role name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//                 <textarea
//                   value={newRole.description}
//                   onChange={(e) => setNewRole({...newRole, description: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter role description"
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end space-x-4 mt-6">
//               <button
//                 onClick={() => setShowAddRole(false)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddRole}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 Add Role
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Permissions;





import { useState } from 'react';
import { Shield, Users, Save, Plus, Trash2, Check, X,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define Role interface
interface Role {
  name: string;
  description: string;
  userCount: number;
  color: string;
}

// Define Module interface
interface Module {
  name: string;
  permissions: string[];
}

// Define RolePermissions type with index signature
interface RolePermissions {
  [role: string]: {
    [module: string]: string[];
  };
}

const Permissions = () => {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<string>('Admin');
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });

  const roles: Role[] = [
    {
      name: 'Admin',
      description: 'Full system access with all permissions',
      userCount: 3,
      color: 'purple',
    },
    {
      name: 'Manager',
      description: 'Department-level access with management permissions',
      userCount: 8,
      color: 'blue',
    },
    {
      name: 'User',
      description: 'Basic user access with limited permissions',
      userCount: 25,
      color: 'green',
    },
    {
      name: 'Viewer',
      description: 'Read-only access to system data',
      userCount: 12,
      color: 'gray',
    },
  ];

  const modules: Module[] = [
    {
      name: 'Dashboard',
      permissions: ['view'],
    },
    {
      name: 'Masters',
      permissions: ['view', 'create', 'edit', 'delete'],
    },
    {
      name: 'Vouchers',
      permissions: ['view', 'create', 'edit', 'delete', 'approve'],
    },
    {
      name: 'Reports',
      permissions: ['view', 'export', 'schedule'],
    },
    {
      name: 'Audit',
      permissions: ['view', 'export', 'configure'],
    },
    {
      name: 'Configuration',
      permissions: ['view', 'edit', 'admin'],
    },
    {
      name: 'User Management',
      permissions: ['view', 'create', 'edit', 'delete', 'suspend'],
    },
    {
      name: 'Backup & Restore',
      permissions: ['view', 'create', 'restore', 'delete'],
    },
  ];

  const rolePermissions: RolePermissions = {
    Admin: {
      Dashboard: ['view'],
      Masters: ['view', 'create', 'edit', 'delete'],
      Vouchers: ['view', 'create', 'edit', 'delete', 'approve'],
      Reports: ['view', 'export', 'schedule'],
      Audit: ['view', 'export', 'configure'],
      Configuration: ['view', 'edit', 'admin'],
      'User Management': ['view', 'create', 'edit', 'delete', 'suspend'],
      'Backup & Restore': ['view', 'create', 'restore', 'delete'],
    },
    Manager: {
      Dashboard: ['view'],
      Masters: ['view', 'create', 'edit'],
      Vouchers: ['view', 'create', 'edit', 'approve'],
      Reports: ['view', 'export'],
      Audit: ['view', 'export'],
      Configuration: ['view'],
      'User Management': ['view'],
      'Backup & Restore': ['view'],
    },
    User: {
      Dashboard: ['view'],
      Masters: ['view'],
      Vouchers: ['view', 'create', 'edit'],
      Reports: ['view'],
      Audit: ['view'],
      Configuration: [],
      'User Management': [],
      'Backup & Restore': [],
    },
    Viewer: {
      Dashboard: ['view'],
      Masters: ['view'],
      Vouchers: ['view'],
      Reports: ['view'],
      Audit: ['view'],
      Configuration: [],
      'User Management': [],
      'Backup & Restore': [],
    },
  };

  const handlePermissionToggle = (module: string, permission: string) => {
    // Toggle permission logic here
    console.log(`Toggling ${permission} for ${module} in role ${selectedRole}`);
  };

  const handleAddRole = () => {
    if (newRole.name && newRole.description) {
      alert('Role added successfully!');
      setShowAddRole(false);
      setNewRole({ name: '', description: '' });
    }
  };

  const handleDeleteRole = (roleName: string) => {
    if (confirm(`Are you sure you want to delete the ${roleName} role?`)) {
      alert('Role deleted successfully!');
    }
  };

  const getRoleColor = (color: string) => {
    const colors: { [key: string]: string } = {
      purple: 'bg-purple-100 text-purple-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colors[color] || colors.gray;
  };

  const hasPermission = (module: string, permission: string) => {
    return rolePermissions[selectedRole]?.[module]?.includes(permission) || false;
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/config')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Permissions Management</h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
           
            <p className="text-sm text-gray-600 mt-1">Configure role-based access control and permissions</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddRole(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Role</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
          </div>
          
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.name}
                onClick={() => setSelectedRole(role.name)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{role.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.color)}`}>
                      {role.userCount} users
                    </span>
                    <button
                    title='users'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.name);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3 bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Permissions for {selectedRole}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-sm font-medium text-gray-500 py-3">Module</th>
                  <th className="text-center text-sm font-medium text-gray-500 py-3">View</th>
                  <th className="text-center text-sm font-medium text-gray-500 py-3">Create</th>
                  <th className="text-center text-sm font-medium text-gray-500 py-3">Edit</th>
                  <th className="text-center text-sm font-medium text-gray-500 py-3">Delete</th>
                  <th className="text-center text-sm font-medium text-gray-500 py-3">Special</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {modules.map((module) => (
                  <tr key={module.name} className="hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {module.name}
                    </td>
                    <td className="py-3 text-center">
                      {module.permissions.includes('view') && (
                        <button
                          onClick={() => handlePermissionToggle(module.name, 'view')}
                          className={`p-1 rounded ${
                            hasPermission(module.name, 'view')
                              ? 'text-green-600 bg-green-100'
                              : 'text-gray-400 bg-gray-100'
                          }`}
                        >
                          {hasPermission(module.name, 'view') ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {module.permissions.includes('create') && (
                        <button
                          onClick={() => handlePermissionToggle(module.name, 'create')}
                          className={`p-1 rounded ${
                            hasPermission(module.name, 'create')
                              ? 'text-green-600 bg-green-100'
                              : 'text-gray-400 bg-gray-100'
                          }`}
                        >
                          {hasPermission(module.name, 'create') ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {module.permissions.includes('edit') && (
                        <button
                          onClick={() => handlePermissionToggle(module.name, 'edit')}
                          className={`p-1 rounded ${
                            hasPermission(module.name, 'edit')
                              ? 'text-green-600 bg-green-100'
                              : 'text-gray-400 bg-gray-100'
                          }`}
                        >
                          {hasPermission(module.name, 'edit') ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {module.permissions.includes('delete') && (
                        <button
                          onClick={() => handlePermissionToggle(module.name, 'delete')}
                          className={`p-1 rounded ${
                            hasPermission(module.name, 'delete')
                              ? 'text-green-600 bg-green-100'
                              : 'text-gray-400 bg-gray-100'
                          }`}
                        >
                          {hasPermission(module.name, 'delete') ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center space-x-1">
                        {module.permissions
                          .filter((p) => !['view', 'create', 'edit', 'delete'].includes(p))
                          .map((permission) => (
                            <button
                              key={permission}
                              onClick={() => handlePermissionToggle(module.name, permission)}
                              className={`px-2 py-1 text-xs rounded ${
                                hasPermission(module.name, permission)
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {permission}
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Permission Summary */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(rolePermissions[selectedRole] || {}).flat().length}
            </div>
            <div className="text-sm text-gray-600">Total Permissions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(rolePermissions[selectedRole] || {}).filter((perms: string[]) =>
                perms.includes('view')
              ).length}
            </div>
            <div className="text-sm text-gray-600">View Permissions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(rolePermissions[selectedRole] || {}).filter((perms: string[]) =>
                perms.includes('edit')
              ).length}
            </div>
            <div className="text-sm text-gray-600">Edit Permissions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(rolePermissions[selectedRole] || {}).filter((perms: string[]) =>
                perms.includes('delete')
              ).length}
            </div>
            <div className="text-sm text-gray-600">Delete Permissions</div>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter role name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter role description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddRole(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permissions;