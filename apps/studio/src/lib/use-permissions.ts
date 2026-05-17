import { useQuery } from '@tanstack/react-query';
import type { PermissionBundle } from '@lumibase/sdk';
import { getApiClient } from './api';

/**
 * usePermissions — fetches and caches the current user's compiled permission
 * bundle from GET /permissions/me.
 *
 * Exposes convenience helpers used by the content module to gate:
 *   - field visibility (canReadField)
 *   - field mutability (canWriteField)
 *   - collection-level CRUD (canCreate, canWrite, canDelete)
 */
export function usePermissions() {
  const client = getApiClient();

  const query = useQuery({
    queryKey: ['permissions', 'me'],
    queryFn: async () => {
      const res = await client.access.permissions.me();
      return res.data as PermissionBundle;
    },
    staleTime: 60_000, // mirror KV TTL
  });

  const bundle = query.data;

  /** True when the user has any admin role (bypasses all permission checks). */
  const isAdmin = bundle?.admin ?? false;

  /**
   * Whether the user can perform `action` on `collection`.
   * Admin users always return true.
   */
  function can(collection: string, action: 'create' | 'read' | 'update' | 'delete' | 'share'): boolean {
    if (!bundle) return false;
    if (bundle.admin) return true;
    return `${collection}::${action}` in bundle.byKey;
  }

  /**
   * Whether a specific field is readable for the given collection.
   * Returns true when the user has admin access, or the read permission's
   * field list contains `*` or the field name explicitly.
   */
  function canReadField(collection: string, fieldName: string): boolean {
    if (!bundle) return false;
    if (bundle.admin) return true;
    const perm = bundle.byKey[`${collection}::read`];
    if (!perm) return false;
    if (perm.fields.includes('*')) return true;
    return perm.fields.includes(fieldName);
  }

  /**
   * Whether a specific field is writable for the given collection.
   */
  function canWriteField(collection: string, fieldName: string): boolean {
    if (!bundle) return false;
    if (bundle.admin) return true;
    const perm = bundle.byKey[`${collection}::update`];
    if (!perm) return false;
    if (perm.fields.includes('*')) return true;
    return perm.fields.includes(fieldName);
  }

  return {
    bundle,
    isLoading: query.isLoading,
    isAdmin,
    can,
    canReadField,
    canWriteField,
    canRead: (collection: string) => can(collection, 'read'),
    canCreate: (collection: string) => can(collection, 'create'),
    canWrite: (collection: string) => can(collection, 'update'),
    canDelete: (collection: string) => can(collection, 'delete'),
  };
}
