type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class OllamaClient {
  constructor(
    private baseUrl: string,
    private model: string,
  ) {}

  async listModels(): Promise<string[]> {
    const parseModels = (payload: any) => {
      const models = payload?.models ?? payload?.data ?? [];
      return Array.isArray(models)
        ? models
            .map((m) => {
              if (typeof m === 'string') return m;
              if (m && typeof m.name === 'string') return m.name;
              return null;
            })
            .filter((m): m is string => Boolean(m))
        : [];
    };

    const fetchModels = async (path: string) => {
      const res = await fetch(`${this.baseUrl}${path}`, { method: 'GET' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error: ${res.status} ${text}`);
      }
      return parseModels(await res.json());
    };

    let lastError: unknown = null;

    try {
      return await fetchModels('/api/tags');
    } catch (err) {
      lastError = err;
      // Fallback for alternate endpoints
      try {
        return await fetchModels('/api/models');
      } catch (err2) {
        lastError = err2;
      }
    }

    if (lastError) {
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    }

    return [];
  }

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
  const client = new OllamaClient(baseUrl, model);
  let models: string[] = [];

  try {
    models = await client.listModels();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to reach Ollama.',
      models: [],
    };
  }

  if (!model) {
    return {
      ok: true,
      models,
      message: models.length === 0 ? 'No local models detected.' : 'Select a model to enable AI responses.',
    };
  }

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
    return { ok: false, message: `HTTP ${res.status}: ${text}`, models };
  }

  return { ok: true, models };
}
