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
