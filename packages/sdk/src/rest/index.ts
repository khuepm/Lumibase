import { LumiClient } from "../client";
import { DefaultSchema, ListItemsParams, ItemRow, ListItemsResponse } from "../types";

export * from "./legacy";

export function readItems<
  Schema extends DefaultSchema,
  Collection extends keyof Schema & string,
  Row = ItemRow<Schema[Collection] extends Record<string, unknown> ? Schema[Collection] : Record<string, unknown>>,
  ListResp = ListItemsResponse<Schema[Collection] extends Record<string, unknown> ? Schema[Collection] : Record<string, unknown>>
>(collection: Collection, params?: ListItemsParams) {
  return async (client: LumiClient<Schema>): Promise<ListResp> => {
    const qs = new URLSearchParams();
    if (params?.fields?.length) qs.set("fields", params.fields.join(","));
    if (params?.filter) qs.set("filter", JSON.stringify(params.filter));
    if (params?.sort?.length) qs.set("sort", params.sort.join(","));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    
    const s = qs.toString();
    const query = s ? `?${s}` : "";

    const res = await client.rawRequest<ListResp[keyof ListResp]>(`/api/v1/items/${collection}${query}`);
    return res as unknown as ListResp;
  };
}

export function readItem<
  Schema extends DefaultSchema,
  Collection extends keyof Schema & string,
  Row = ItemRow<Schema[Collection] extends Record<string, unknown> ? Schema[Collection] : Record<string, unknown>>
>(collection: Collection, id: string, fields?: string[]) {
  return async (client: LumiClient<Schema>): Promise<Row> => {
    const res = await client.rawRequest<Row>(
      `/api/v1/items/${collection}/${id}${fields?.length ? `?fields=${fields.join(",")}` : ""}`
    );
    return res as unknown as Row;
  };
}
