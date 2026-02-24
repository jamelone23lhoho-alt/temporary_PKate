export const ROLE_PERMISSIONS = {
  'Software Developer': { dashboard:true, export_view:true, export_add:true, client_view:true, client_add:true, note_view:true, note_add:true, users_view:true, users_add:true },
  'CEO Mongolia': { dashboard:true, export_view:true, export_add:true, client_view:true, client_add:true, note_view:true, note_add:true, users_view:true, users_add:true },
  'CEO Thailand': { dashboard:true, export_view:true, export_add:true, client_view:false, client_add:false, note_view:true, note_add:true, users_view:false, users_add:false },
  'Admin': { dashboard:true, export_view:true, export_add:true, client_view:true, client_add:true, note_view:true, note_add:true, users_view:true, users_add:true },
  'Customer Service Officer': { dashboard:false, export_view:true, export_add:false, client_view:true, client_add:true, note_view:true, note_add:false, users_view:false, users_add:false },
  'Origin Officer': { dashboard:false, export_view:true, export_add:true, client_view:false, client_add:false, note_view:true, note_add:false, users_view:false, users_add:false },
  'Staff': { dashboard:true, export_view:true, export_add:true, client_view:true, client_add:true, note_view:true, note_add:true, users_view:false, users_add:false },
};

export function hasPermission(role, perm) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms[perm] === true;
}
