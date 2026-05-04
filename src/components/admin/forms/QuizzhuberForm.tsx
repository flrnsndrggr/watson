import type { QuizzhuberPuzzle, QuizzhuberQuestion } from '@/types';
import { JsonModeToggle } from './JsonModeToggle';

export type QuizzhuberPayload = Pick<QuizzhuberPuzzle, 'episode' | 'intro' | 'questions'>;

const CATEGORIES = ['Geschichte','Geografie','Politik','Sprache','Musik','Sport','Brauchtum','Wirtschaft','Wissenschaft'];

export function emptyQuizzhuber(): QuizzhuberPayload {
  return {
    episode: 1,
    intro: '',
    questions: Array.from({ length: 10 }, (): QuizzhuberQuestion => ({
      prompt: '',
      options: ['', '', '', ''],
      correct_index: 0,
      category: '',
      explanation: '',
    })),
  };
}

export function QuizzhuberForm({ value, onChange }: { value: QuizzhuberPayload; onChange: (v: QuizzhuberPayload) => void }) {
  const updateQ = (i: number, patch: Partial<QuizzhuberQuestion>) =>
    onChange({ ...value, questions: value.questions.map((q, j) => j === i ? { ...q, ...patch } : q) });

  return (
    <JsonModeToggle value={value} onChange={onChange}>
      <div className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
          <label className="text-xs font-semibold">Episode
            <input type="number" value={value.episode}
              onChange={(e) => onChange({ ...value, episode: parseInt(e.target.value) || 0 })}
              className="block w-20 rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold">Intro (Host-Text)
            <textarea value={value.intro}
              onChange={(e) => onChange({ ...value, intro: e.target.value })}
              rows={3}
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
        </div>

        <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">10 Fragen</h2>
        {value.questions.map((q, i) => (
          <div key={i} className="rounded border border-gray-200 bg-white p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold">#{i + 1}</span>
              <select value={q.category ?? ''} onChange={(e) => updateQ(i, { category: e.target.value })}
                className="rounded border border-gray-200 px-2 py-1 text-xs">
                <option value="">— Kategorie —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })}
              placeholder="Frage" rows={2}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" />
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2">
              <input type="url" value={q.image_url ?? ''}
                onChange={(e) => updateQ(i, { image_url: e.target.value || undefined })}
                placeholder="Bild-URL (optional)"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs" />
              <input type="text" value={q.image_alt ?? ''}
                onChange={(e) => updateQ(i, { image_alt: e.target.value || undefined })}
                placeholder="Alt-Text (optional)"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 rounded border px-2 py-1.5 cursor-pointer ${
                  q.correct_index === oi ? 'border-green-400 bg-green-50' : 'border-gray-200'
                }`}>
                  <input type="radio" checked={q.correct_index === oi}
                    onChange={() => updateQ(i, { correct_index: oi })}
                    aria-label={`Frage ${i+1} Option ${oi+1} korrekt`} />
                  <input type="text" value={opt}
                    onChange={(e) => updateQ(i, { options: q.options.map((o, j) => j === oi ? e.target.value : o) })}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 bg-transparent text-sm outline-none" />
                </label>
              ))}
            </div>
            <input type="text" value={q.explanation ?? ''} onChange={(e) => updateQ(i, { explanation: e.target.value })}
              placeholder="Erklärung (optional)"
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs" />
          </div>
        ))}
      </div>
    </JsonModeToggle>
  );
}
