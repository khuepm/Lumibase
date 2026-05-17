export type DefaultSchema = Record<string, Record<string, unknown>>;

export interface CollectionResource {
  id: string;
  siteId: string;
  name: string;
  singleton: boolean;
  displayTemplate: string | null;
  sortField: string | null;
  archiveField: string | null;
  archiveValue: string | null;
  meta: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldResource {
  id: string;
  collectionId: string;
  name: string;
  type: string;
  interface: string;
  required: boolean;
  hidden: boolean;
  sortOrder: number;
  [key: string]: unknown;
}

export interface RelationResource {
  id: string;
  siteId: string;
  manyCollection: string;
  manyField: string;
  oneCollection: string;
  oneField: string | null;
  junctionCollection: string | null;
}

export type ItemFilterOp =
  | "_eq"
  | "_neq"
  | "_in"
  | "_nin"
  | "_gt"
  | "_gte"
  | "_lt"
  | "_lte"
  | "_contains"
  | "_starts_with"
  | "_ends_with"
  | "_null"
  | "_nnull";

export interface ItemFilter {
  _and?: ItemFilter[];
  _or?: ItemFilter[];
  [key: string]: { [op in ItemFilterOp]?: unknown } | ItemFilter[] | undefined;
}

export interface ListItemsParams {
  fields?: string[];
  filter?: ItemFilter;
  sort?: string[];
  limit?: number;
  offset?: number;
  status?: string | null;
  search?: string;
}

export interface ItemRow<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  siteId: string;
  collectionId: string;
  status: string;
  data: TData;
  sort: number;
  userCreated: string | null;
  userUpdated: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RevisionRow {
  id: string;
  siteId: string;
  collectionId: string;
  itemId: string;
  delta: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown>;
  };
  userId: string | null;
  createdAt: string;
}

export interface ListItemsResponse<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  data: ItemRow<T>[];
  meta: { total: number; limit: number; offset: number };
}

/* ---------------- Access (Phase C) ---------------- */

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "share";

export interface RoleResource {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  icon: string | null;
  adminAccess: boolean;
  appAccess: boolean;
  createdAt?: string;
}

export interface RoleDetail extends RoleResource {
  policies: Array<{ policyId: string; priority: number }>;
  users: Array<{ userId: string }>;
}

export interface PolicyResource {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  /** Top-level guardrails: time window, IP allow/deny. */
  rules: Record<string, unknown>;
  createdAt?: string;
}

export interface PermissionRow {
  id: string;
  siteId: string;
  policyId: string;
  collection: string;
  action: PermissionAction;
  permissions: Record<string, unknown>;
  validation: Record<string, unknown>;
  presets: Record<string, unknown>;
  fields: string[];
}

export interface PolicyDetail extends PolicyResource {
  permissions: PermissionRow[];
}

export interface CompiledPermission {
  collection: string;
  action: PermissionAction;
  rule: Record<string, unknown> | null;
  fields: string[];
  presets: Record<string, unknown>;
  validation: Record<string, unknown>;
}

export interface PermissionBundle {
  admin: boolean;
  byKey: Record<string, CompiledPermission>;
  roles: Array<{
    id: string;
    name: string;
    adminAccess: boolean;
    appAccess: boolean;
  }>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string | null;
  fields: string[];
  rule?: Record<string, unknown> | null;
  presets?: Record<string, unknown>;
}

export interface PresetResource {
  id: string;
  siteId: string;
  bookmark: string | null;
  collection: string;
  userId: string | null;
  roleId: string | null;
  layout: string;
  layoutQuery: Record<string, unknown>;
  layoutOptions: Record<string, unknown>;
  search: string | null;
  filter: Record<string, unknown>;
  icon: string | null;
  color: string | null;
  refreshInterval: number;
  createdAt: string;
}

export interface TranslationResource {
  id: string;
  siteId: string;
  language: string;
  namespace: string;
  key: string;
  value: string;
  status: string;
  updatedAt: string;
}

export interface SettingResource {
  id: string;
  siteId: string;
  key: string;
  value: Record<string, unknown>;
  scope: string;
  updatedAt: string;
}

export interface UserResource {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: string;
  lastSeenAt: string | null;
  roleId: string | null;
  joinedAt: string;
}

export interface TeamResource {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface TeamMemberResource {
  teamId: string;
  userId: string;
  addedAt: string;
}

export interface FolderResource {
  id: string;
  siteId: string;
  name: string;
  parent: string | null;
  createdAt: string;
}

export interface FileResource {
  id: string;
  siteId: string;
  storage: string;
  filenameDisk: string;
  filenameDownload: string;
  mime: string;
  filesize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  folder: string | null;
  metadata: Record<string, unknown>;
  uploadedBy: string | null;
  createdAt: string;
}

export interface WebhookResource {
  id: string;
  siteId: string;
  name: string;
  url: string;
  actions: string[];
  collections: string[];
  headers: Record<string, string>;
  status: string;
  secret: string | null;
  createdAt: string;
}

export interface ActivityResource {
  id: string;
  siteId: string;
  action: string;
  userId: string | null;
  collection: string | null;
  itemId: string | null;
  ip: string | null;
  userAgent: string | null;
  comment: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ExtensionResource {
  id: string;
  siteId: string | null;
  name: string;
  version: string;
  type: string;
  enabled: boolean;
  bundleUrl: string;
  manifest: Record<string, unknown>;
  capabilities: string[];
  installedBy: string | null;
  installedAt: string;
}
