const API = "http://localhost:8000";

export interface BackendNode {
  id: string;
  type: "vibe" | "sketch" | "excerpt";
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

// --- Chat ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function chatStream(messages: ChatMessage[]): Promise<Response> {
  return fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

// --- Style References ---

export async function fetchStyleReferences(): Promise<string[]> {
  const res = await fetch(`${API}/style-references`);
  const data = await res.json();
  return data.references;
}

export async function updateStyleReferences(references: string[]): Promise<string[]> {
  const res = await fetch(`${API}/style-references`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ references }),
  });
  const data = await res.json();
  return data.references;
}

// --- AI: Inline Rewrite (Cmd+K) ---

export async function aiInlineRewrite(
  selectedText: string,
  paragraphContext: string,
  note: string
): Promise<string[]> {
  const res = await fetch(`${API}/ai/inline-rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selected_text: selectedText, paragraph_context: paragraphContext, note }),
  });
  const data = await res.json();
  return data.alternatives;
}

// --- AI: Style Analyze + Rewrite (Cmd+L) ---

export async function aiStyleAnalyze(
  selectedText: string,
  styleReference: string
): Promise<string[]> {
  const res = await fetch(`${API}/ai/style-analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selected_text: selectedText, style_reference: styleReference }),
  });
  const data = await res.json();
  return data.elements;
}

export async function aiStyleRewrite(
  selectedText: string,
  styleReference: string,
  elements: string[]
): Promise<string> {
  const res = await fetch(`${API}/ai/style-rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selected_text: selectedText,
      style_reference: styleReference,
      elements,
    }),
  });
  const data = await res.json();
  return data.rewritten_text;
}

// --- State ---

export async function saveState(): Promise<{ status: string }> {
  const res = await fetch(`${API}/state/save`, { method: "POST" });
  return res.json();
}
