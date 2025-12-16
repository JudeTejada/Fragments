import { buildPrompt } from '../../shared/prompts';
import type { AiActionType } from '../../shared/types';
import { OllamaClient, testOllamaConnection } from '../ollamaClient';
import { SettingsRepository } from '../repositories/settingsRepository';
import { SnippetRepository } from '../repositories/snippetRepository';
import { AiRunRepository } from '../repositories/aiRunRepository';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class AiService {
  private getClient() {
    const settings = SettingsRepository.getAll();
    const backend = settings.ai_backend ?? 'none';

    if (backend !== 'ollama') {
      throw new Error('AI backend not configured');
    }
    if (!settings.ollama_model_name) {
      throw new Error('Ollama model not set');
    }

    return new OllamaClient(OLLAMA_BASE_URL, settings.ollama_model_name);
  }

  async runOnSnippet(snippetId: string, type: AiActionType) {
    const snippet = SnippetRepository.get(snippetId);
    if (!snippet) {
      throw new Error('Snippet not found');
    }

    const client = this.getClient();
    const prompt = buildPrompt(type, snippet.language, snippet.content);

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a concise, accurate code assistant.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const resultText = await client.chat(messages);

    return AiRunRepository.create({
      snippetId,
      type,
      result: resultText,
    });
  }

  async listForSnippet(snippetId: string) {
    return AiRunRepository.listForSnippet(snippetId);
  }

  async testConnection() {
    const settings = SettingsRepository.getAll();
    const backend = settings.ai_backend ?? 'none';

    if (backend !== 'ollama') {
      return { ok: false, message: 'AI backend is not set to Ollama.' };
    }
    if (!settings.ollama_model_name) {
      return { ok: false, message: 'Ollama model name not configured.' };
    }

    return testOllamaConnection(OLLAMA_BASE_URL, settings.ollama_model_name);
  }
}
