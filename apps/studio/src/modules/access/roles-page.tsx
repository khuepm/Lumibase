import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus, Shield, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import type { RoleResource } from '@lumibase/sdk';
import { getApiClient } from '@/lib/api';
import { cn } from '@/lib/cn';
import { AccessLayout } from './index';

/**
 * Access Control › Roles
 *
 * Left panel: roles list.
 * Right drawer: role detail (edit name/flags, attached policies, assigned users).
 */
export function RolesPage() {
  const client = getApiClient();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ['access', 'roles'],
    queryFn: async () => (await client.access.roles.list()).data as RoleResource[],
  });

  const roles = rolesQuery.data ?? [];
  const selectedRole = roles.find((r) => r.id === selected);

  return (
    <AccessLayout>
      <div className="flex h-full gap-6">
        {/* List */}
        <section className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Roles</h1>
            <button
              type="button"
              id="create-role-btn"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New role
            </button>
          </div>

          {rolesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          <ul className="space-y-1">
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => { setSelected(role.id); setCreating(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition',
                    selected === role.id
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'hover:bg-muted/40',
                  )}
                >
                  {role.adminAccess
                    ? <ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" />
                    : <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1 truncate font-medium">{role.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
            {!rolesQuery.isLoading && roles.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No roles yet.</p>
            )}
          </ul>
        </section>

        {/* Detail / Create panel */}
        <div className="flex-1">
          {creating && (
            <CreateRolePanel
              onClose={() => setCreating(false)}
              onCreated={(id) => {
                qc.invalidateQueries({ queryKey: ['access', 'roles'] });
                setCreating(false);
                setSelected(id);
              }}
            />
          )}
          {!creating && selectedRole && (
            <RoleDetailPanel
              role={selectedRole}
              onDeleted={() => {
                qc.invalidateQueries({ queryKey: ['access', 'roles'] });
                setSelected(null);
              }}
              onSaved={() => qc.invalidateQueries({ queryKey: ['access', 'roles'] })}
            />
          )}
          {!creating && !selectedRole && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Select a role or create a new one
            </div>
          )}
        </div>
      </div>
    </AccessLayout>
  );
}

// ---------- Create Role Panel ----------

function CreateRolePanel({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const client = getApiClient();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [adminAccess, setAdminAccess] = useState(false);
  const [appAccess, setAppAccess] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => client.access.roles.create({ name, description: desc, adminAccess, appAccess }),
    onSuccess: (res) => onCreated((res.data as RoleResource).id),
    onError: () => setError('Failed to create role.'),
  });

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">New Role</h2>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Name *">
          <input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border bg-muted/20 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Editor"
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
        <div className="flex gap-6">
          <Toggle label="Admin Access" checked={adminAccess} onChange={setAdminAccess}
            hint="Bypasses all permission checks" />
          <Toggle label="App Access" checked={appAccess} onChange={setAppAccess}
            hint="Can log in to Studio" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {mutation.isPending ? 'Creating…' : 'Create Role'}
        </button>
      </div>
    </div>
  );
}

// ---------- Role Detail Panel ----------

function RoleDetailPanel({
  role,
  onDeleted,
  onSaved,
}: {
  role: RoleResource;
  onDeleted: () => void;
  onSaved: () => void;
}) {
  const client = getApiClient();
  const qc = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['access', 'roles', role.id],
    queryFn: async () => {
      const res = await client.access.roles.get(role.id);
      return res.data as (RoleResource & { policies: Array<{ policyId: string; priority: number }>; users: Array<{ userId: string }> });
    },
  });

  const detail = detailQuery.data;

  const [name, setName] = useState(role.name);
  const [desc, setDesc] = useState(role.description ?? '');
  const [adminAccess, setAdminAccess] = useState(role.adminAccess);
  const [appAccess, setAppAccess] = useState(role.appAccess);
  const [newUserId, setNewUserId] = useState('');
  const [newPolicyId, setNewPolicyId] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => client.access.roles.update(role.id, { name, description: desc, adminAccess, appAccess }),
    onSuccess: () => onSaved(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.access.roles.delete(role.id),
    onSuccess: onDeleted,
  });

  const assignUserMutation = useMutation({
    mutationFn: (uid: string) => client.access.roles.assignUser(role.id, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['access', 'roles', role.id] }); setNewUserId(''); },
  });

  const removeUserMutation = useMutation({
    mutationFn: (uid: string) => client.access.roles.removeUser(role.id, uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access', 'roles', role.id] }),
  });

  const attachPolicyMutation = useMutation({
    mutationFn: (pid: string) => client.access.roles.attachPolicy(role.id, pid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['access', 'roles', role.id] }); setNewPolicyId(''); },
  });

  const detachPolicyMutation = useMutation({
    mutationFn: (pid: string) => client.access.roles.detachPolicy(role.id, pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access', 'roles', role.id] }),
  });

  return (
    <div className="space-y-5 rounded-xl border bg-background p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Edit Role</h2>
        <button
          type="button"
          id="delete-role-btn"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border bg-muted/20 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
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
        <div className="flex gap-6">
          <Toggle label="Admin Access" checked={adminAccess} onChange={setAdminAccess} hint="Bypasses all checks" />
          <Toggle label="App Access" checked={appAccess} onChange={setAppAccess} hint="Can log in" />
        </div>
        <button
          type="button"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Attached Policies */}
      <section className="border-t pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Attached Policies</h3>
        <ul className="mb-2 space-y-1">
          {(detail?.policies ?? []).map((p) => (
            <li key={p.policyId} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
              <span className="font-mono text-xs">{p.policyId.slice(0, 8)}…</span>
              <span className="text-xs text-muted-foreground">priority {p.priority}</span>
              <button
                type="button"
                onClick={() => detachPolicyMutation.mutate(p.policyId)}
                className="text-destructive hover:opacity-70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newPolicyId}
            onChange={(e) => setNewPolicyId(e.target.value)}
            placeholder="Policy ID"
            className="flex-1 rounded-md border bg-muted/20 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => newPolicyId && attachPolicyMutation.mutate(newPolicyId)}
            className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-accent"
          >
            Attach
          </button>
        </div>
      </section>

      {/* Assigned Users */}
      <section className="border-t pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Assigned Users</h3>
        <ul className="mb-2 space-y-1">
          {(detail?.users ?? []).map((u) => (
            <li key={u.userId} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
              <span className="font-mono text-xs">{u.userId.slice(0, 12)}…</span>
              <button
                type="button"
                onClick={() => removeUserMutation.mutate(u.userId)}
                className="text-destructive hover:opacity-70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="User ID"
            className="flex-1 rounded-md border bg-muted/20 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => newUserId && assignUserMutation.mutate(newUserId)}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs hover:bg-accent"
          >
            <UserPlus className="h-3 w-3" /> Assign
          </button>
        </div>
      </section>
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

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-1',
          )}
        />
      </button>
      <span>
        {label}
        {hint && <span className="ml-1 text-xs text-muted-foreground">({hint})</span>}
      </span>
    </label>
  );
}
