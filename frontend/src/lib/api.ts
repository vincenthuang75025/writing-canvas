const API = "http://localhost:8000";

export interface BackendNode {
  id: string;
  type: "vibe" | "sketch" | "snippet";
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
}

export interface BackendDocument {
  content: Record<string, unknown>;
}

// --- Nodes ---

export async function fetchNodes(): Promise<BackendNode[]> {
  const res = await fetch(`${API}/nodes`);
  return res.json();
}

export async function createNode(
  node: Omit<BackendNode, "id" | "level">
): Promise<BackendNode> {
  const res = await fetch(`${API}/nodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(node),
  });
  return res.json();
}

export async function updateNode(
  id: string,
  updates: Partial<Pick<BackendNode, "content" | "x" | "y" | "w" | "h">>
): Promise<BackendNode> {
  const res = await fetch(`${API}/nodes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteNode(id: string): Promise<void> {
  await fetch(`${API}/nodes/${id}`, { method: "DELETE" });
}

// --- Document ---

export async function fetchDocument(): Promise<BackendDocument> {
  const res = await fetch(`${API}/document`);
  return res.json();
}

export async function updateDocument(
  content: Record<string, unknown>
): Promise<BackendDocument> {
  const res = await fetch(`${API}/document`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

// --- AI ---

export async function aiSuggest(nodeId: string): Promise<{ content: string; type: string }> {
  const res = await fetch(`${API}/ai/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ node_id: nodeId }),
  });
  return res.json();
}

export async function aiRewrite(
  snippetContent: string,
  documentSelection: string
): Promise<{ rewritten: string }> {
  const res = await fetch(`${API}/ai/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      snippet_content: snippetContent,
      document_selection: documentSelection,
    }),
  });
  return res.json();
}
