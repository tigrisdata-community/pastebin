export interface Paste {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
}

export function createPaste(id: string, title: string, body: string): Paste {
  return {
    id,
    title,
    body,
    createdAt: new Date(),
  };
}
