import * as React from 'react';
import type { AiActionType, AiRun } from '@shared/types';

export function useAiForSnippet(snippetId: string | null) {
  const [aiRuns, setAiRuns] = React.useState<AiRun[]>([]);
  const [loadingType, setLoadingType] = React.useState<AiActionType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [settingsMessage, setSettingsMessage] = React.useState<string | null>(null);

  const loadSettings = React.useCallback(async () => {
    try {
      const res = await window.api.settings.get();
      if (res.success && res.data) {
        const backend = res.data.ai_backend ?? 'none';
        const configured = backend === 'ollama' && Boolean(res.data.ollama_model_name);
        setIsConfigured(configured);
        setSettingsMessage(
          configured ? null : 'Enable AI in Settings to use your local Ollama model.'
        );
        return configured;
      }
      setSettingsMessage(res.error || 'Failed to load AI settings.');
    } catch (e) {
      setSettingsMessage(e instanceof Error ? e.message : 'Failed to load AI settings.');
    }
    setIsConfigured(false);
    return false;
  }, []);

  const refresh = React.useCallback(async () => {
    if (!snippetId) return;
    try {
      const res = await window.api.ai.listForSnippet(snippetId);
      if (res.success && res.data) {
        setAiRuns(res.data);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI runs');
    }
  }, [snippetId]);

  React.useEffect(() => {
    setAiRuns([]);
    setError(null);
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const run = React.useCallback(async (type: AiActionType) => {
    if (!snippetId) return;
    setLoadingType(type);
    setError(null);

    const configured = await loadSettings();
    if (!configured) {
      setLoadingType(null);
      setError('AI backend not configured. Open Settings to enable Ollama.');
      return;
    }

    try {
      const res = await window.api.ai.run({ snippetId, type });
      if (res.success && res.data) {
        setAiRuns((prev) => [res.data!, ...prev]);
      } else {
        setError(res.error || 'Failed to run AI');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run AI');
    } finally {
      setLoadingType(null);
    }
  }, [loadSettings, snippetId]);

  return { aiRuns, loadingType, error, isConfigured, settingsMessage, refresh, run };
}
