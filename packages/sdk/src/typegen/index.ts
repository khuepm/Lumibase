import type { TypegenManifest } from './types';
export type { TypegenManifest, TypegenCollection, TypegenField } from './types';

export interface GenerateOptions {
  format?: 'single' | 'per-collection';
  branded?: boolean;
}

export function generateTypes(manifest: TypegenManifest, options: GenerateOptions = {}): string {
  const { format = 'single', branded = true } = options;

  if (format === 'single') {
    return generateSingleFile(manifest, branded);
  }

  return generatePerCollection(manifest, branded);
}

function generateSingleFile(manifest: TypegenManifest, branded: boolean): string {
  const imports = [
    "import type { ID, Locale } from '@lumibase/sdk';",
    branded ? "import type { Brand } from '@lumibase/sdk';" : '',
  ]
    .filter(Boolean)
    .join('\n');

  const collectionInterfaces = manifest.collections
    .map((coll) => generateCollectionInterface(coll, branded))
    .join('\n\n');

  const collectionsMap = `export interface LumibaseCollections {
${manifest.collections.map((c) => `  ${c.name}: ${capitalize(c.name)};`).join('\n')}
}`;

  const schemaType = 'export type LumibaseSchema = LumibaseCollections;';

  return `${imports}\n\n${collectionInterfaces}\n\n${collectionsMap}\n\n${schemaType}`;
}

function generatePerCollection(manifest: TypegenManifest, branded: boolean): string {
  // For per-collection format, return a map of filename -> content
  // This is a placeholder - actual implementation would return an object
  return generateSingleFile(manifest, branded);
}

function generateCollectionInterface(coll: TypegenManifest['collections'][0], branded: boolean): string {
  const fields = coll.fields
    .map((f) => {
      const tsType = mapFieldTypeToTs(f, branded);
      const optional = f.required ? '' : '?';
      return `  ${f.name}${optional}: ${tsType};`;
    })
    .join('\n');

  return `export interface ${capitalize(coll.name)} {
${fields}
}`;
}

function mapFieldTypeToTs(field: TypegenManifest['collections'][0]['fields'][0], branded: boolean): string {
  if (field.kind === 'm2o') {
    return `${capitalize(field.target || 'unknown')} | null`;
  }
  if (field.kind === 'o2m' || field.kind === 'm2m') {
    return `${capitalize(field.target || 'unknown')}[]`;
  }
  if (field.kind === 'm2a') {
    return `Array<{ collection: string; item: unknown }>`;
  }

  if (field.enum && field.enum.length > 0) {
    return field.enum.map((v) => `'${v}'`).join(' | ');
  }

  const typeMap: Record<string, string> = {
    string: 'string',
    text: 'string',
    hash: 'string',
    csv: 'string',
    integer: 'number',
    bigInteger: 'number',
    decimal: 'number',
    boolean: 'boolean',
    json: 'unknown',
    uuid: branded ? `Brand<'${field.branded || 'ID'}', string>` : 'ID',
    date: 'string',
    datetime: 'string',
    time: 'string',
    timestamp: 'string',
    geometry: 'GeoJSON.Geometry',
  };

  const tsType = typeMap[field.type] || 'unknown';

  if (!field.required || field.nullable) {
    return `${tsType} | null`;
  }

  return tsType;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
