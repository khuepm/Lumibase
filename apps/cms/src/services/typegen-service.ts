import { collections as collectionsTable, fields, relations, scopeSite } from '@lumibase/database';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '@lumibase/database';

export interface TypegenManifest {
  version: number;
  site: string;
  collections: TypegenCollection[];
}

export interface TypegenCollection {
  name: string;
  primaryKey: string;
  fields: TypegenField[];
}

export interface TypegenField {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  branded?: string;
  kind?: 'm2o' | 'o2m' | 'm2m' | 'm2a';
  target?: string;
  enum?: string[];
}

export class TypegenService {
  constructor(private readonly deps: { db: Database; siteId: string }) {}

  async getManifest(include?: string[], exclude?: string[]): Promise<TypegenManifest> {
    const { db, siteId } = this.deps;

    let collectionRows = await db
      .select()
      .from(collectionsTable)
      .where(scopeSite(collectionsTable.siteId, siteId))
      .orderBy(asc(collectionsTable.name));

    if (include?.length) {
      collectionRows = collectionRows.filter((c) => include.includes(c.name));
    }
    if (exclude?.length) {
      collectionRows = collectionRows.filter((c) => !exclude.includes(c.name));
    }

    const relationRows = await db
      .select()
      .from(relations)
      .where(scopeSite(relations.siteId, siteId));

    const resultCollections: TypegenCollection[] = [];

    for (const coll of collectionRows) {
      const fieldRows = await db
        .select()
        .from(fields)
        .where(eq(fields.collectionId, coll.id))
        .orderBy(asc(fields.sortOrder), asc(fields.name));

      const typegenFields: TypegenField[] = fieldRows.map((f) => {
        const field: TypegenField = {
          name: f.name,
          type: f.type,
          required: f.required,
          nullable: !f.required,
        };

        // Detect relation fields
        const rel = relationRows.find(
          (r) => r.manyCollection === coll.name && r.manyField === f.name,
        );
        if (rel) {
          field.kind = 'm2o';
          field.target = rel.oneCollection;
        }

        // Handle branded ID fields
        if (f.type === 'uuid' && f.name === 'id') {
          field.branded = `${coll.name.charAt(0).toUpperCase()}${coll.name.slice(1)}Id`;
        }

        // Extract enum from validation if present
        const validation = f.validation as { rules?: Array<{ rule: string; options?: unknown }> } | undefined;
        if (validation?.rules) {
          const choiceRule = validation.rules.find((r) => r.rule === 'choices');
          if (choiceRule && 'options' in choiceRule && Array.isArray(choiceRule.options)) {
            field.enum = choiceRule.options as string[];
          }
        }

        return field;
      });

      resultCollections.push({
        name: coll.name,
        primaryKey: 'id',
        fields: typegenFields,
      });
    }

    return {
      version: 1,
      site: siteId,
      collections: resultCollections,
    };
  }
}
