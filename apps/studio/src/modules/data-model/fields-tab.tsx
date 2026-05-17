import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getApiClient } from '@/lib/api';
import { FieldInspector, type FieldFormState } from './field-inspector';

interface FieldsTabProps {
  collectionName: string;
}

/**
 * Fields tab: drag-drop reorder + inspector for adding/editing fields.
 * Uses dnd-kit per the roadmap.
 */
export function FieldsTab({ collectionName }: FieldsTabProps) {
  const client = getApiClient();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FieldFormState | null>(null);

  const fieldsQuery = useQuery({
    queryKey: ['fields', collectionName],
    queryFn: async () =>
      (await client.schema.listFields(collectionName)).data,
  });

  const upsertMutation = useMutation({
    mutationFn: async (state: FieldFormState) => {
      await client.schema.upsertField(collectionName, state.name, {
        name: state.name,
        type: state.type,
        interface: state.interface,
        required: state.required,
        sortOrder: state.sortOrder,
        display: state.display ?? null,
        displayOptions: state.displayOptions ?? {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields', collectionName] });
      queryClient.invalidateQueries({ queryKey: ['collection', collectionName] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fieldName: string) => {
      await client.schema.deleteField(collectionName, fieldName);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['fields', collectionName] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { name: string; type: string; interface: string; sortOrder: number }[]) => {
      // Persist new sortOrder for each field. Backend supports per-field upsert.
      for (const f of newOrder) {
        await client.schema.upsertField(collectionName, f.name, {
          name: f.name,
          type: f.type,
          interface: f.interface,
          sortOrder: f.sortOrder,
        });
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['fields', collectionName] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fields = fieldsQuery.data ?? [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    reorderMutation.mutate(
      reordered.map((f, i) => ({
        name: f.name,
        type: f.type,
        interface: f.interface,
        sortOrder: i,
      })),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Fields</h2>
        <button
          type="button"
          onClick={() =>
            setEditing({
              name: '',
              type: 'string',
              interface: 'input',
              required: false,
              sortOrder: fields.length,
              display: null,
              displayOptions: {},
            })
          }
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs"
        >
          <Plus className="h-3 w-3" /> Add field
        </button>
      </div>

      {fieldsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading fields…</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y rounded-lg border">
            {fields.map((f) => (
              <SortableField
                key={f.id}
                id={f.id}
                name={f.name}
                type={f.type}
                interfaceName={f.interface}
                required={f.required}
                onEdit={() =>
                  setEditing({
                    name: f.name,
                    type: f.type,
                    interface: f.interface,
                    required: f.required,
                    sortOrder: f.sortOrder,
                    display: ((f as unknown as { display?: string | null }).display) ?? null,
                    displayOptions:
                      ((f as unknown as { displayOptions?: Record<string, unknown> })
                        .displayOptions) ?? {},
                  })
                }
                onDelete={() => {
                  if (confirm(`Delete field "${f.name}"?`)) {
                    deleteMutation.mutate(f.name);
                  }
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {fields.length === 0 && !fieldsQuery.isLoading && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No fields yet. Click <strong>Add field</strong> to begin.
        </p>
      )}

      {editing && (
        <FieldInspector
          state={editing}
          siblingFields={fields
            .filter((f) => f.name !== editing.name)
            .map((f) => ({ name: f.name, type: f.type, interface: f.interface }))}
          onCancel={() => setEditing(null)}
          onSubmit={(state) => upsertMutation.mutate(state)}
          isSubmitting={upsertMutation.isPending}
        />
      )}
    </div>
  );
}

interface SortableFieldProps {
  id: string;
  name: string;
  type: string;
  interfaceName: string;
  required: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableField({ id, name, type, interfaceName, required, onEdit, onDelete }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 px-3 py-2">
      <button
        type="button"
        className="cursor-grab text-muted-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <button
          type="button"
          onClick={onEdit}
          className="font-medium hover:underline"
        >
          {name}
        </button>
        <span className="ml-2 text-xs text-muted-foreground">
          {type} · {interfaceName}
          {required && ' · required'}
        </span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive"
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
