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

// ---------- Access Control ----------

export interface RoleResource {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  icon: string | null;
  adminAccess: boolean;
  appAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyResource {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  /** Time-bound + IP guard rules (validFrom, validUntil, ipAllow, ipDeny). */
  rules: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share';

export interface PermissionRow {
  id: string;
  siteId: string;
  policyId: string;
  collection: string;
  action: PermissionAction;
  /** Row-level filter rule (JSONata-style). */
  permissions: Record<string, unknown>;
  validation: Record<string, unknown>;
  presets: Record<string, unknown>;
  fields: string[];
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
  roles: Array<{ id: string; name: string; adminAccess: boolean; appAccess: boolean }>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string | null;
  fields: string[];
  rule?: Record<string, unknown> | null;
  presets?: Record<string, unknown>;
}

