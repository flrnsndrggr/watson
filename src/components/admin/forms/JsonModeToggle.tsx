import { useState } from 'react';

interface Props<T> {
  value: T;
  onChange: (next: T) => void;
  children: React.ReactNode;
}

export function JsonModeToggle<T>({ value, onChange, children }: Props<T>) {
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const switchToJson = () => {
    setJsonText(JSON.stringify(value, null, 2));
    setJsonError(null);
    setMode('json');
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onChange(parsed as T);
      setJsonError(null);
      setMode('form');
    } catch (e: any) {
      setJsonError(e?.message ?? 'Invalid JSON');
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode('form')}
          className={`px-3 py-1.5 text-sm font-semibold border-b-2 ${
            mode === 'form' ? 'border-[var(--color-cyan)] text-black' : 'border-transparent text-[var(--color-gray-text)]'
          }`}
        >
          Formular
        </button>
        <button
          type="button"
          onClick={mode === 'form' ? switchToJson : () => setMode('json')}
          className={`px-3 py-1.5 text-sm font-semibold border-b-2 ${
            mode === 'json' ? 'border-[var(--color-cyan)] text-black' : 'border-transparent text-[var(--color-gray-text)]'
          }`}
        >
          JSON
        </button>
      </div>

      {mode === 'form' ? (
        children
      ) : (
        <div className="space-y-2">
          {jsonError && (
            <div className="rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
              {jsonError}
            </div>
          )}
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full min-h-[400px] rounded border border-gray-200 p-3 font-mono text-xs"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyJson}
              className="rounded bg-[var(--color-cyan)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-85 cursor-pointer"
            >
              Übernehmen
            </button>
            <button
              type="button"
              onClick={() => setMode('form')}
              className="rounded border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Tiny chip-input for editing string arrays (accepted_answers, alt_nouns, etc.).
export function ChipInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1 rounded border border-gray-200 px-2 py-1.5 min-h-[40px]">
      {value.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-[var(--color-gray-text)] hover:text-black cursor-pointer"
            aria-label={`${chip} entfernen`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none"
      />
    </div>
  );
}
