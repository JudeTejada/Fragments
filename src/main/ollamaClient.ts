type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class OllamaClient {
  constructor(
    private baseUrl: string,
    private model: string,
  ) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data?.message?.content ?? '';
  }
}

export async function testOllamaConnection(baseUrl: string, model: string) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, message: `HTTP ${res.status}: ${text}` };
  }

  return { ok: true };
}
