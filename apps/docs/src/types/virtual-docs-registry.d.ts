declare module 'virtual:docs-registry' {
  export interface DocEntry {
    slug: string;
    title: string;
    filePath: string;
    content: string;
    lastModified?: string;
  }

  export interface DocNode {
    type: 'file' | 'directory';
    name: string;
    slug?: string;
    children?: DocNode[];
  }

  export const docTree: DocNode[];
  export const docIndex: Record<string, DocEntry>;
  export const docList: DocEntry[];
}
