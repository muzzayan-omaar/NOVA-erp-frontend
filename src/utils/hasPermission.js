import { permissions } from "../config/permissions";


export function hasPermission(role, permission) {

  if (!role) return false;


  const rolePermissions = permissions[role];


  if (!rolePermissions) return false;


  return rolePermissions.includes(permission);

}