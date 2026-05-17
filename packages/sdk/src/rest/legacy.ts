import { LumiClient } from "../client";
import {
  CollectionResource,
  FieldResource,
  RelationResource,
  ListItemsParams,
  ItemRow,
  ListItemsResponse,
  RevisionRow,
  DefaultSchema,
  RoleResource,
  RoleDetail,
  PolicyResource,
  PolicyDetail,
  PermissionRow,
  PermissionAction,
  PermissionBundle,
  PermissionCheckResult,
  PresetResource,
  TranslationResource,
  SettingResource,
} from "../types";

export function legacyRest() {
  return function <TSchema extends DefaultSchema>(client: LumiClient<TSchema>) {
    const schema = {
      listCollections: () =>
        client.rawRequest<CollectionResource[]>("/api/v1/collections"),
      getCollection: (name: string) =>
        client.rawRequest<CollectionResource>(`/api/v1/collections/${name}`),
      createCollection: (
        input: Partial<CollectionResource> & { name: string },
      ) =>
        client.rawRequest<CollectionResource>("/api/v1/collections", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      updateCollection: (name: string, patch: Partial<CollectionResource>) =>
        client.rawRequest<CollectionResource>(`/api/v1/collections/${name}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      deleteCollection: (name: string) =>
        client.rawRequest<null>(`/api/v1/collections/${name}`, {
          method: "DELETE",
        }),
      listFields: (collectionName: string) =>
        client.rawRequest<FieldResource[]>(
          `/api/v1/collections/${collectionName}/fields`,
        ),
      upsertField: (
        collectionName: string,
        fieldName: string,
        input: Partial<FieldResource> & { type: string; interface: string },
      ) =>
        client.rawRequest<FieldResource>(
          `/api/v1/collections/${collectionName}/fields/${fieldName}`,
          {
            method: "PUT",
            body: JSON.stringify(input),
          },
        ),
      deleteField: (collectionName: string, fieldName: string) =>
        client.rawRequest<null>(
          `/api/v1/collections/${collectionName}/fields/${fieldName}`,
          { method: "DELETE" },
        ),
      listRelations: () =>
        client.rawRequest<RelationResource[]>("/api/v1/relations"),
      createRelation: (input: Omit<RelationResource, "id" | "siteId">) =>
        client.rawRequest<RelationResource>("/api/v1/relations", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      deleteRelation: (id: string) =>
        client.rawRequest<null>(`/api/v1/relations/${id}`, {
          method: "DELETE",
        }),
      diff: (name: string, proposed: Record<string, unknown>) =>
        client.rawRequest<unknown>("/api/v1/collections/diff", {
          method: "POST",
          body: JSON.stringify({ name, ...proposed }),
        }),
      apply: (name: string, proposed: Record<string, unknown>) =>
        client.rawRequest<CollectionResource>(
          `/api/v1/collections/${name}/schema`,
          {
            method: "PUT",
            body: JSON.stringify(proposed),
          },
        ),
      typegen: (filters?: { include?: string[]; exclude?: string[] }) => {
        const params = new URLSearchParams();
        if (filters?.include?.length)
          params.set("include", filters.include.join(","));
        if (filters?.exclude?.length)
          params.set("exclude", filters.exclude.join(","));
        const qs = params.toString();
        return client.rawRequest<unknown>(
          `/api/v1/typegen/schema${qs ? `?${qs}` : ""}`,
        );
      },
    };

    function items<TName extends keyof TSchema & string>(name: TName) {
      type Row = ItemRow<
        TSchema[TName] extends Record<string, unknown>
          ? TSchema[TName]
          : Record<string, unknown>
      >;
      type ListResp = ListItemsResponse<
        TSchema[TName] extends Record<string, unknown>
          ? TSchema[TName]
          : Record<string, unknown>
      >;

      function buildQuery(params?: ListItemsParams): string {
        if (!params) return "";
        const qs = new URLSearchParams();
        if (params.fields?.length) qs.set("fields", params.fields.join(","));
        if (params.filter) qs.set("filter", JSON.stringify(params.filter));
        if (params.sort?.length) qs.set("sort", params.sort.join(","));
        if (params.limit !== undefined) qs.set("limit", String(params.limit));
        if (params.offset !== undefined)
          qs.set("offset", String(params.offset));
        if (params.status) qs.set("status", params.status);
        if (params.search) qs.set("search", params.search);
        const s = qs.toString();
        return s ? `?${s}` : "";
      }

      const base = `/api/v1/items/${name}`;

      return {
        list: async (params?: ListItemsParams): Promise<ListResp> => {
          const res = await client.rawRequest<ListResp[keyof ListResp]>(
            `${base}${buildQuery(params)}`,
          );
          return res as unknown as ListResp;
        },
        detail: (id: string, fields?: string[]) =>
          client.rawRequest<Row>(
            `${base}/${id}${fields?.length ? `?fields=${fields.join(",")}` : ""}`,
          ),
        create: (input: {
          data: Partial<Row["data"]>;
          status?: string;
          sort?: number;
        }) =>
          client.rawRequest<Row>(base, {
            method: "POST",
            body: JSON.stringify(input),
          }),
        patch: (
          id: string,
          input: {
            data?: Partial<Row["data"]>;
            status?: string;
            sort?: number;
          },
        ) =>
          client.rawRequest<Row>(`${base}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(input),
          }),
        replace: (
          id: string,
          input: { data: Row["data"]; status?: string; sort?: number },
        ) =>
          client.rawRequest<Row>(`${base}/${id}`, {
            method: "PUT",
            body: JSON.stringify(input),
          }),
        delete: (id: string) =>
          client.rawRequest<null>(`${base}/${id}`, { method: "DELETE" }),
        bulk: (
          op: "create" | "update" | "delete",
          payload: Array<Record<string, unknown>>,
        ) =>
          client.rawRequest<Row[]>(`${base}/bulk`, {
            method: "POST",
            body: JSON.stringify({ op, items: payload }),
          }),
        listRevisions: (id: string) =>
          client.rawRequest<RevisionRow[]>(`${base}/${id}/revisions`),
        revertRevision: (id: string, revisionId: string) =>
          client.rawRequest<Row>(`${base}/${id}/revert/${revisionId}`, {
            method: "POST",
          }),
      };
    }

    const roles = {
      list: () => client.rawRequest<RoleResource[]>("/api/v1/roles"),
      detail: (id: string) =>
        client.rawRequest<RoleDetail>(`/api/v1/roles/${id}`),
      create: (input: Partial<RoleResource> & { name: string }) =>
        client.rawRequest<RoleResource>("/api/v1/roles", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      update: (id: string, patch: Partial<RoleResource>) =>
        client.rawRequest<RoleResource>(`/api/v1/roles/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      delete: (id: string) =>
        client.rawRequest<null>(`/api/v1/roles/${id}`, { method: "DELETE" }),
      attachPolicy: (
        id: string,
        input: { policyId: string; priority?: number },
      ) =>
        client.rawRequest<{
          roleId: string;
          policyId: string;
          priority: number;
        }>(`/api/v1/roles/${id}/policies`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      detachPolicy: (id: string, policyId: string) =>
        client.rawRequest<null>(`/api/v1/roles/${id}/policies/${policyId}`, {
          method: "DELETE",
        }),
      assignUser: (id: string, input: { userId: string }) =>
        client.rawRequest<{ userId: string; siteId: string; roleId: string }>(
          `/api/v1/roles/${id}/users`,
          { method: "POST", body: JSON.stringify(input) },
        ),
      removeUser: (id: string, userId: string) =>
        client.rawRequest<null>(`/api/v1/roles/${id}/users/${userId}`, {
          method: "DELETE",
        }),
    };

    const policies = {
      list: () => client.rawRequest<PolicyResource[]>("/api/v1/policies"),
      detail: (id: string) =>
        client.rawRequest<PolicyDetail>(`/api/v1/policies/${id}`),
      create: (input: Partial<PolicyResource> & { name: string }) =>
        client.rawRequest<PolicyResource>("/api/v1/policies", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      update: (id: string, patch: Partial<PolicyResource>) =>
        client.rawRequest<PolicyResource>(`/api/v1/policies/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      delete: (id: string) =>
        client.rawRequest<null>(`/api/v1/policies/${id}`, { method: "DELETE" }),
      addPermission: (
        id: string,
        input: {
          collection: string;
          action: PermissionAction;
          permissions?: Record<string, unknown>;
          validation?: Record<string, unknown>;
          presets?: Record<string, unknown>;
          fields?: string[];
        },
      ) =>
        client.rawRequest<PermissionRow>(`/api/v1/policies/${id}/permissions`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      patchPermission: (
        id: string,
        permId: string,
        patch: Partial<PermissionRow>,
      ) =>
        client.rawRequest<PermissionRow>(
          `/api/v1/policies/${id}/permissions/${permId}`,
          { method: "PATCH", body: JSON.stringify(patch) },
        ),
      removePermission: (id: string, permId: string) =>
        client.rawRequest<null>(
          `/api/v1/policies/${id}/permissions/${permId}`,
          { method: "DELETE" },
        ),
      attachUser: (id: string, input: { userId: string; priority?: number }) =>
        client.rawRequest<{
          userId: string;
          policyId: string;
          priority: number;
        }>(`/api/v1/policies/${id}/users`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      detachUser: (id: string, userId: string) =>
        client.rawRequest<null>(`/api/v1/policies/${id}/users/${userId}`, {
          method: "DELETE",
        }),
    };

    const permissions = {
      me: () => client.rawRequest<PermissionBundle>("/api/v1/permissions/me"),
      check: (input: {
        collection: string;
        action: PermissionAction;
        item?: Record<string, unknown>;
      }) =>
        client.rawRequest<PermissionCheckResult>("/api/v1/permissions/check", {
          method: "POST",
          body: JSON.stringify(input),
        }),
    };

    const presets = {
      list: (collection?: string) =>
        client.rawRequest<PresetResource[]>(`/api/v1/presets${collection ? `?collection=${collection}` : ""}`),
      get: (id: string) => client.rawRequest<PresetResource>(`/api/v1/presets/${id}`),
      create: (input: Partial<PresetResource> & { collection: string }) =>
        client.rawRequest<PresetResource>("/api/v1/presets", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      update: (id: string, patch: Partial<PresetResource>) =>
        client.rawRequest<PresetResource>(`/api/v1/presets/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      delete: (id: string) => client.rawRequest<null>(`/api/v1/presets/${id}`, { method: "DELETE" }),
    };

    const translations = {
      list: (params?: { namespace?: string; language?: string }) => {
        const qs = new URLSearchParams();
        if (params?.namespace) qs.set("namespace", params.namespace);
        if (params?.language) qs.set("language", params.language);
        const s = qs.toString();
        return client.rawRequest<TranslationResource[]>(`/api/v1/translations${s ? `?${s}` : ""}`);
      },
      get: (id: string) => client.rawRequest<TranslationResource>(`/api/v1/translations/${id}`),
      create: (input: Partial<TranslationResource> & { language: string; namespace: string; key: string; value: string }) =>
        client.rawRequest<TranslationResource>("/api/v1/translations", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      update: (id: string, patch: Partial<TranslationResource>) =>
        client.rawRequest<TranslationResource>(`/api/v1/translations/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      delete: (id: string) => client.rawRequest<null>(`/api/v1/translations/${id}`, { method: "DELETE" }),
    };

    const settings = {
      list: (scope?: string) =>
        client.rawRequest<SettingResource[]>(`/api/v1/settings${scope ? `?scope=${scope}` : ""}`),
      get: (key: string) => client.rawRequest<SettingResource>(`/api/v1/settings/${key}`),
      set: (key: string, value: Record<string, unknown>, scope?: string) =>
        client.rawRequest<SettingResource>("/api/v1/settings", {
          method: "POST",
          body: JSON.stringify({ key, value, scope }),
        }),
      delete: (key: string) => client.rawRequest<null>(`/api/v1/settings/${key}`, { method: "DELETE" }),
    };

    return {
      schema,
      items,
      roles,
      policies,
      permissions,
      presets,
      translations,
      settings,
      auth: {
        me: () =>
          client.rawRequest<{
            logtoId: string;
            email?: string;
            roles: string[];
            siteId: string;
          }>("/api/v1/auth/me"),
      },
      // Phantom type witness
      _schemaType: undefined as unknown as TSchema,
      // Backward compat request method
      request: client.rawRequest,
    };
  };
}
