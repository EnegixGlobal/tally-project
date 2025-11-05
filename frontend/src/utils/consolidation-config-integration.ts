// Config Module Integration Functions for Role-Based Access Control
// This file integrates the Consolidation Report with the Config Module's role management system

export interface ConfigUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  assignedCompanies: string[];
  permissions: string[];
  createdAt: string;
  lastLogin: string;
}

export interface RoleHierarchy {
  'Super Admin': {
    level: number;
    accessScope: 'all';
    canAssign: string[];
    permissions: string[];
  };
  'Admin': {
    level: number;
    accessScope: 'assigned';
    canAssign: string[];
    permissions: string[];
  };
  'Employee': {
    level: number;
    accessScope: 'limited';
    canAssign: string[];
    permissions: string[];
  };
}

export const ConsolidationConfigIntegration = {
  
  // Role Hierarchy Definition for Integration
  roleHierarchy: {
    'Super Admin': {
      level: 1,
      accessScope: 'all' as const,
      canAssign: ['Admin', 'Employee'],
      permissions: [
        'view_all_companies',
        'edit_all_companies', 
        'export_all_reports',
        'assign_admin_access',
        'manage_all_users',
        'view_system_analytics'
      ]
    },
    'Admin': {
      level: 2,
      accessScope: 'assigned' as const,
      canAssign: ['Employee'],
      permissions: [
        'view_assigned_companies',
        'edit_assigned_companies',
        'export_assigned_reports',
        'assign_employee_access',
        'manage_assigned_users',
        'view_department_analytics'
      ]
    },
    'Employee': {
      level: 3,
      accessScope: 'limited' as const,
      canAssign: [],
      permissions: [
        'view_assigned_companies',
        'edit_limited_transactions',
        'export_basic_reports',
        'view_own_analytics'
      ]
    }
  } as RoleHierarchy,

  // Function to get user role from config module
  getUserRole(userId: string): string {
    // TODO: Integrate with config module's UserAccounts component
    // This would call the config module's API to get user role
    console.log(`Getting role for user: ${userId}`);
    
    // Mock implementation - replace with actual config module integration
    const mockUserRoles: Record<string, string> = {
      'EMP001': 'Super Admin',
      'EMP002': 'Admin',
      'EMP003': 'Admin', 
      'EMP004': 'Employee',
      'EMP005': 'Employee',
      'EMP006': 'Employee'
    };
    
    return mockUserRoles[userId] || 'Employee';
  },

  // Function to get accessible companies based on role from config module
  getAccessibleCompanies(userId: string, userRole: string): string[] {
    // TODO: Integrate with config module's AccessControl component
    console.log(`Getting accessible companies for user: ${userId}, role: ${userRole}`);
    
    // Mock implementation based on real business hierarchy
    const accessMap: Record<string, string[]> = {
      'EMP001': ['COMP001', 'COMP002', 'COMP003'], // Super Admin - All companies
      'EMP002': ['COMP001', 'COMP002'], // Finance Admin - R K Sales, Sikha Sales
      'EMP003': ['COMP003'], // Operations Admin - M P Traders
      'EMP004': ['COMP001'], // Employee - R K Sales only
      'EMP005': ['COMP002'], // Employee - Sikha Sales only
      'EMP006': ['COMP003']  // Employee - M P Traders only
    };
    
    return accessMap[userId] || [];
  },

  // Function to check permission level from config module
  checkPermission(userId: string, action: string): boolean {
    // TODO: Integrate with config module's RoleManagement component
    const userRole = this.getUserRole(userId);
    const roleConfig = this.roleHierarchy[userRole as keyof RoleHierarchy];
    
    if (!roleConfig) return false;
    
    return roleConfig.permissions.includes(action);
  },

  // Function to sync with config module's role changes
  syncRoleChanges(userId: string, newRole: string, assignedCompanies: string[]): void {
    // TODO: This would sync consolidation access when config module updates roles
    console.log(`Role updated for ${userId}: ${newRole}`);
    console.log(`Assigned companies: ${assignedCompanies.join(', ')}`);
    
    // Update consolidation access based on new role
    const roleConfig = this.roleHierarchy[newRole as keyof RoleHierarchy];
    if (roleConfig) {
      console.log(`User ${userId} now has ${roleConfig.accessScope} access level`);
      console.log(`Permissions: ${roleConfig.permissions.join(', ')}`);
    }
  },

  // Function to integrate with config module's user creation
  onUserCreated(newUser: ConfigUser): void {
    // TODO: This would automatically add user to consolidation access when created in config
    console.log(`New user created in config module:`, newUser);
    
    // Automatically setup consolidation access for new user
    const companies = this.getAccessibleCompanies(newUser.id, newUser.role);
    console.log(`Setting up consolidation access for ${newUser.name}: ${companies.join(', ')}`);
  },

  // Function to get hierarchical access report
  getHierarchicalReport(requestingUserId: string) {
    const userRole = this.getUserRole(requestingUserId);
    const accessibleCompanies = this.getAccessibleCompanies(requestingUserId, userRole);
    const roleConfig = this.roleHierarchy[userRole as keyof RoleHierarchy];
    
    // Get subordinate users based on hierarchy
    let subordinateUsers: string[] = [];
    if (userRole === 'Super Admin') {
      subordinateUsers = ['EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006']; // All users
    } else if (userRole === 'Admin') {
      // Get employees under this admin based on company assignment
      subordinateUsers = accessibleCompanies.includes('COMP001') || accessibleCompanies.includes('COMP002') 
        ? ['EMP004', 'EMP005'] 
        : ['EMP006'];
    }
    
    return {
      level: userRole,
      accessScope: roleConfig?.accessScope || 'limited',
      accessibleCompanies,
      subordinateUsers,
      reportScope: roleConfig?.accessScope === 'all' ? 'complete' : 
                   roleConfig?.accessScope === 'assigned' ? 'departmental' : 'individual',
      permissions: roleConfig?.permissions || []
    };
  },

  // Function to validate role-based consolidation access
  validateConsolidationAccess(userId: string, requestedCompanies: string[]): {
    allowed: boolean;
    accessibleCompanies: string[];
    deniedCompanies: string[];
    reason?: string;
  } {
    const userRole = this.getUserRole(userId);
    const accessibleCompanies = this.getAccessibleCompanies(userId, userRole);
    
    const deniedCompanies = requestedCompanies.filter(
      company => !accessibleCompanies.includes(company)
    );
    
    return {
      allowed: deniedCompanies.length === 0,
      accessibleCompanies: requestedCompanies.filter(company => 
        accessibleCompanies.includes(company)
      ),
      deniedCompanies,
      reason: deniedCompanies.length > 0 
        ? `User ${userId} with role ${userRole} does not have access to companies: ${deniedCompanies.join(', ')}`
        : undefined
    };
  },

  // Function to get role-based menu items for consolidation
  getConsolidationMenuItems(userId: string) {
    const userRole = this.getUserRole(userId);
    const roleConfig = this.roleHierarchy[userRole as keyof RoleHierarchy];
    
    const baseMenuItems = [
      { id: 'summary', label: 'Summary View', permission: 'view_assigned_companies' },
      { id: 'detailed', label: 'Detailed Analysis', permission: 'view_assigned_companies' }
    ];
    
    const adminMenuItems = [
      { id: 'user-access', label: 'User Access Panel', permission: 'manage_assigned_users' },
      { id: 'comparison', label: 'Company Comparison', permission: 'view_department_analytics' }
    ];
    
    const superAdminMenuItems = [
      { id: 'system-analytics', label: 'System Analytics', permission: 'view_system_analytics' },
      { id: 'role-management', label: 'Role Management', permission: 'manage_all_users' }
    ];
    
    const availableItems = [...baseMenuItems];
    
    if (roleConfig?.permissions.some((p: string) => adminMenuItems.some(item => item.permission === p))) {
      availableItems.push(...adminMenuItems);
    }
    
    if (roleConfig?.permissions.some((p: string) => superAdminMenuItems.some(item => item.permission === p))) {
      availableItems.push(...superAdminMenuItems);
    }
    
    return availableItems.filter(item => 
      roleConfig?.permissions.includes(item.permission)
    );
  }
};

export default ConsolidationConfigIntegration;
