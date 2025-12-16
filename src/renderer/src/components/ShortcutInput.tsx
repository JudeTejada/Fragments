import * as React from 'react';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';

type ShortcutInputProps = {
  value?: string;
  onChange: (value: string) => void;
};

export function ShortcutInput({ value, onChange }: ShortcutInputProps) {
  const [recording, setRecording] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setRecording(false);
      return;
    }

    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    if (e.key === 'Backspace' && parts.length === 0) {
      onChange('');
      setRecording(false);
      return;
    }

    const rawKey = e.key === ' ' ? 'Space' : e.key;
    const key = rawKey.length === 1 ? rawKey.toUpperCase() : rawKey;

    if (['Meta', 'Control', 'Alt', 'Shift'].includes(key)) return;

    parts.push(key);
    const accelerator = parts.join('+');
    onChange(accelerator);
    setRecording(false);
  };

  return (
    <div
      role="textbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setRecording(true)}
      onFocus={() => setRecording(true)}
      onBlur={() => setRecording(false)}
      className={cn(
        'flex min-h-9 cursor-text items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50',
        recording && 'border-ring ring-2 ring-ring/60',
      )}
    >
      {recording ? (
        <span className="text-muted-foreground">Press shortcut…</span>
      ) : value ? (
        <span className="flex flex-wrap items-center gap-1">
          {value.split('+').map((part) => (
            <Kbd key={part}>{part}</Kbd>
          ))}
        </span>
      ) : (
        <span className="text-muted-foreground">Click and press keys (e.g. Cmd+Shift+S)</span>
      )}
    </div>
  );
}
