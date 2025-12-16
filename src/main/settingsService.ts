import type { Settings } from '../shared/types';
import { SettingsRepository } from './repositories/settingsRepository';

export const DEFAULT_QUICK_CAPTURE_SHORTCUT = 'CommandOrControl+Shift+S';

export function getEffectiveSettings(): Settings & { quick_capture_shortcut: string } {
  const raw = SettingsRepository.getAll();

  return {
    ...raw,
    quick_capture_shortcut: raw.quick_capture_shortcut || DEFAULT_QUICK_CAPTURE_SHORTCUT,
  };
}
