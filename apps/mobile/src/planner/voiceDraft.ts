let sequence = 0;
let draft: { id: string; title: string } | undefined;

export function stageVoiceDraft(title: string) {
  const id = String(++sequence);
  draft = { id, title };
  return id;
}

export function voiceDraftTitle(id?: string) {
  return draft && draft.id === id ? draft.title : '';
}
