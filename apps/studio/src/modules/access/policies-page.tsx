import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Clock, Globe, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { PolicyResource, PermissionRow, PermissionAction } from '@lumibase/sdk';
import { getApiClient } from '@/lib/api';
import { cn } from '@/lib/cn';
import { AccessLayout } from './index';

const ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete', 'share'];

/**
 * Access Control › Policies
 *
 * Left: policy list + create.
 * Right: policy detail with Permission Matrix (collections × actions),
 *        time-bound guard, IP allow/deny.
 */
export function PoliciesPage() {
  const client = getApiClient();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const policiesQuery = useQuery({
    queryKey: ['access', 'policies'],
    queryFn: async () => (await client.access.policies.list()).data as PolicyResource[],
  });

  const policies = policiesQuery.data ?? [];
  const selectedPolicy = policies.find((p) => p.id === selected);

  return (
    <AccessLayout>
      <div className="flex h-full gap-6">
        {/* List */}
        <section className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Policies</h1>
            <button
              type="button"
              id="create-policy-btn"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New policy
            </button>
          </div>

          {policiesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          <ul className="space-y-1">
            {policies.map((policy) => (
              <li key={policy.id}>
                <button
                  type="button"
                  onClick={() => { setSelected(policy.id); setCreating(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition',
                    selected === policy.id
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'hover:bg-muted/40',
                  )}
                >
                  <span className="flex-1 truncate font-medium">{policy.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
            {!policiesQuery.isLoading && policies.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No policies yet.</p>
            )}
          </ul>
        </section>

        {/* Detail panel */}
        <div className="flex-1 overflow-auto">
          {creating && (
            <CreatePolicyPanel
              onClose={() => setCreating(false)}
              onCreated={(id) => {
                qc.invalidateQueries({ queryKey: ['access', 'policies'] });
                setCreating(false);
                setSelected(id);
              }}
            />
          )}
          {!creating && selectedPolicy && (
            <PolicyDetailPanel
              policy={selectedPolicy}
              onDeleted={() => {
                qc.invalidateQueries({ queryKey: ['access', 'policies'] });
                setSelected(null);
              }}
              onSaved={() => qc.invalidateQueries({ queryKey: ['access', 'policies'] })}
            />
          )}
          {!creating && !selectedPolicy && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Select a policy or create a new one
            </div>
          )}
        </div>
      </div>
    </AccessLayout>
  );
}

// ---------- Create Policy ----------

function CreatePolicyPanel({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const client = getApiClient();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => client.access.policies.create({ name, description: desc }),
    onSuccess: (res) => onCreated((res.data as PolicyResource).id),
    onError: () => setError('Failed to create policy.'),
  });

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">New Policy</h2>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <Field label="Name *">
          <input
            id="policy-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border bg-muted/20 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Read-only Public"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full rounded-md border bg-muted/20 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {mutation.isPending ? 'Creating…' : 'Create Policy'}
        </button>
      </div>
    </div>
  );
}

// ---------- Policy Detail ----------

function PolicyDetailPanel({
  policy,
  onDeleted,
  onSaved,
}: {
  policy: PolicyResource;
  onDeleted: () => void;
  onSaved: () => void;
}) {
  const client = getApiClient();
  const qc = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['access', 'policies', policy.id],
    queryFn: async () => {
      const res = await client.access.policies.get(policy.id);
      return res.data as PolicyResource & { permissions: PermissionRow[] };
    },
  });

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => (await client.schema.listCollections()).data,
  });

  const detail = detailQuery.data;
  const collections = collectionsQuery.data ?? [];

  // Guards state
  const rules = (policy.rules ?? {}) as Record<string, unknown>;
  const [validFrom, setValidFrom] = useState((rules.validFrom as string) ?? '');
  const [validUntil, setValidUntil] = useState((rules.validUntil as string) ?? '');
  const [ipAllow, setIpAllow] = useState<string[]>((rules.ipAllow as string[]) ?? []);
  const [ipDeny, setIpDeny] = useState<string[]>((rules.ipDeny as string[]) ?? []);
  const [ipInput, setIpInput] = useState('');
  const [ipDenyInput, setIpDenyInput] = useState('');

  const deleteMutation = useMutation({
    mutationFn: () => client.access.policies.delete(policy.id),
    onSuccess: onDeleted,
  });

  const saveGuardsMutation = useMutation({
    mutationFn: () =>
      client.access.policies.update(policy.id, {
        rules: {
          ...(validFrom ? { validFrom } : {}),
          ...(validUntil ? { validUntil } : {}),
          ...(ipAllow.length ? { ipAllow } : {}),
          ...(ipDeny.length ? { ipDeny } : {}),
        },
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['access', 'policies'] }); onSaved(); },
  });

  // Permission matrix helpers
  const permMap: Record<string, Record<PermissionAction, PermissionRow | undefined>> = {};
  for (const perm of detail?.permissions ?? []) {
    if (!permMap[perm.collection]) {
      permMap[perm.collection] = { create: undefined, read: undefined, update: undefined, delete: undefined, share: undefined };
    }
    permMap[perm.collection]![perm.action] = perm;
  }

  const togglePerm = useMutation({
    mutationFn: async ({
      collection,
      action,
      existing,
    }: {
      collection: string;
      action: PermissionAction;
      existing?: PermissionRow;
    }) => {
      if (existing) {
        await client.access.policies.deletePermission(policy.id, existing.id);
      } else {
        await client.access.policies.addPermission(policy.id, { collection, action, fields: ['*'] });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access', 'policies', policy.id] }),
  });

  // Selected cell for field/rule editing
  const [editCell, setEditCell] = useState<{ collection: string; action: PermissionAction } | null>(null);
  const editPerm = editCell
    ? permMap[editCell.collection]?.[editCell.action]
    : undefined;

  const [newCollection, setNewCollection] = useState('');

  const addCollection = () => {
    const coll = newCollection.trim();
    if (!coll || permMap[coll]) return;
    // Create a read permission to bootstrap the row
    client.access.policies.addPermission(policy.id, { collection: coll, action: 'read', fields: ['*'] }).then(() => {
      qc.invalidateQueries({ queryKey: ['access', 'policies', policy.id] });
      setNewCollection('');
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border bg-background px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold">{policy.name}</h2>
          {policy.description && <p className="text-xs text-muted-foreground">{policy.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      {/* Permission Matrix */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold">Permissions</h3>
          <div className="flex items-center gap-2">
            <select
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              className="rounded-md border bg-muted/20 px-2 py-1 text-xs outline-none"
            >
              <option value="">Add collection…</option>
              {collections
                .filter((c) => !permMap[c.name])
                .map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
            </select>
            <button
              type="button"
              onClick={addCollection}
              disabled={!newCollection}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 text-left">Collection</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-3 py-2 text-center">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permMap).map(([coll, actions]) => (
                <tr key={coll} className="border-b hover:bg-muted/10">
                  <td className="px-4 py-2 font-mono text-xs font-medium">{coll}</td>
                  {ACTIONS.map((action) => {
                    const perm = actions[action];
                    const isEdit = editCell?.collection === coll && editCell?.action === action;
                    return (
                      <td key={action} className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            title={perm ? `${coll}.${action} — click to edit` : `Grant ${action}`}
                            onClick={() => {
                              if (!perm) {
                                togglePerm.mutate({ collection: coll, action });
                              } else {
                                setEditCell(isEdit ? null : { collection: coll, action });
                              }
                            }}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded transition',
                              perm
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'border border-dashed text-muted-foreground/40 hover:border-primary/60 hover:text-primary',
                              isEdit && 'ring-2 ring-primary',
                            )}
                          >
                            {perm && <Check className="h-3.5 w-3.5" />}
                          </button>
                          {perm && (
                            <button
                              type="button"
                              title="Revoke"
                              onClick={() => togglePerm.mutate({ collection: coll, action, existing: perm })}
                              className="text-[10px] text-muted-foreground/50 hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {Object.keys(permMap).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No collections added. Use the dropdown above to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cell editor */}
        {editCell && editPerm && (
          <PermissionCellEditor
            policyId={policy.id}
            perm={editPerm}
            onClose={() => setEditCell(null)}
            onSaved={() => qc.invalidateQueries({ queryKey: ['access', 'policies', policy.id] })}
          />
        )}
      </div>

      {/* Time-bound + IP guards */}
      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-muted-foreground" /> Time &amp; IP Guards
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid from">
            <input
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full rounded-md border bg-muted/20 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
          <Field label="Valid until">
            <input
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-md border bg-muted/20 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="IP Allow list">
            <IpTagInput
              tags={ipAllow}
              input={ipInput}
              onInput={setIpInput}
              onAdd={() => { if (ipInput.trim()) { setIpAllow([...ipAllow, ipInput.trim()]); setIpInput(''); } }}
              onRemove={(i) => setIpAllow(ipAllow.filter((_, idx) => idx !== i))}
              icon={<Globe className="h-3 w-3 text-emerald-600" />}
            />
          </Field>
          <Field label="IP Deny list">
            <IpTagInput
              tags={ipDeny}
              input={ipDenyInput}
              onInput={setIpDenyInput}
              onAdd={() => { if (ipDenyInput.trim()) { setIpDeny([...ipDeny, ipDenyInput.trim()]); setIpDenyInput(''); } }}
              onRemove={(i) => setIpDeny(ipDeny.filter((_, idx) => idx !== i))}
              icon={<Globe className="h-3 w-3 text-destructive" />}
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={() => saveGuardsMutation.mutate()}
          disabled={saveGuardsMutation.isPending}
          className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {saveGuardsMutation.isPending ? 'Saving…' : 'Save guards'}
        </button>
      </div>
    </div>
  );
}

// ---------- Cell editor (fields list) ----------

function PermissionCellEditor({
  policyId,
  perm,
  onClose,
  onSaved,
}: {
  policyId: string;
  perm: PermissionRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = getApiClient();
  const [fieldsStr, setFieldsStr] = useState((perm.fields ?? ['*']).join(', '));

  const mutation = useMutation({
    mutationFn: () =>
      client.access.policies.updatePermission(policyId, perm.id, {
        fields: fieldsStr.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => { onSaved(); onClose(); },
  });

  return (
    <div className="border-t bg-muted/10 px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {perm.collection} · {perm.action} — field access
        </p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-1 text-xs text-muted-foreground">
        Comma-separated field names, or <code className="font-mono">*</code> for all.
      </p>
      <input
        value={fieldsStr}
        onChange={(e) => setFieldsStr(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
        placeholder="*, title, slug, status"
      />
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-2 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
      >
        {mutation.isPending ? 'Saving…' : 'Update fields'}
      </button>
    </div>
  );
}

// ---------- Shared Primitives ----------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function IpTagInput({
  tags,
  input,
  onInput,
  onAdd,
  onRemove,
  icon,
}: {
  tags: string[];
  input: string;
  onInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {tags.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-[11px] font-mono"
          >
            {icon} {t}
            <button type="button" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="127.0.0.1"
          className="flex-1 rounded-md border bg-muted/20 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
        >
          Add
        </button>
      </div>
    </div>
  );
}
