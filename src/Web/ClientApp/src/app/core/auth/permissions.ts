/**
/// Central registry of functional permissions mirroring the backend Permissions.cs.
/// Used for template DOM gating (*appHasPermission) and functional route guards.
*/
export const Permissions = {
  Property: {
    View: 'Property.View',
    Create: 'Property.Create',
    Edit: 'Property.Edit',
    Delete: 'Property.Delete',
    Approve: 'Property.Approve',
    Feature: 'Property.Feature',
    GlobalAccess: 'Property.GlobalAccess'
  },
  Inquiry: {
    View: 'Inquiry.View',
    Create: 'Inquiry.Create',
    Respond: 'Inquiry.Respond',
    Manage: 'Inquiry.Manage'
  },
  Agency: {
    View: 'Agency.View',
    Create: 'Agency.Create',
    Edit: 'Agency.Edit',
    Delete: 'Agency.Delete',
    ManageAgents: 'Agency.ManageAgents'
  },
  User: {
    View: 'User.View',
    Manage: 'User.Manage',
    AssignRole: 'User.AssignRole'
  },
  Chat: {
    Access: 'Chat.Access',
    Send: 'Chat.Send'
  },
  Dashboard: {
    ViewAgency: 'Dashboard.ViewAgency',
    ViewGlobal: 'Dashboard.ViewGlobal'
  }
} as const;

export type Permission =
  | (typeof Permissions.Property)[keyof typeof Permissions.Property]
  | (typeof Permissions.Inquiry)[keyof typeof Permissions.Inquiry]
  | (typeof Permissions.Agency)[keyof typeof Permissions.Agency]
  | (typeof Permissions.User)[keyof typeof Permissions.User]
  | (typeof Permissions.Chat)[keyof typeof Permissions.Chat]
  | (typeof Permissions.Dashboard)[keyof typeof Permissions.Dashboard];
