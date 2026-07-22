import { useState } from 'react';
import type { Prompt } from '../../../../shared/reminders/types.ts';
import { validatePromptText } from '../../../../shared/reminders/validation.ts';

interface Props {
  prompts: readonly Prompt[];
  disabled: boolean;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function PromptLibrary({ prompts, disabled, onAdd, onDelete, onEdit }: Props) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitAdd = () => {
    if (!validatePromptText(draft)) {
      setError('Prompt text cannot be empty.');
      return;
    }
    setError(null);
    onAdd(draft);
    setDraft('');
  };

  const submitEdit = (id: string) => {
    if (!validatePromptText(editText)) {
      setError('Prompt text cannot be empty.');
      return;
    }
    setError(null);
    onEdit(id, editText);
    setEditingId(null);
    setEditText('');
  };

  return (
    <section className="panel">
      <h3>Prompt library</h3>
      <div className="add-row">
        <input
          type="text"
          placeholder="Add a mindfulness prompt"
          value={draft}
          disabled={disabled}
          onChange={event => setDraft(event.target.value)}
        />
        <button type="button" disabled={disabled} onClick={submitAdd}>Add</button>
      </div>
      {error && <p className="field-error">{error}</p>}

      <ul className="prompt-list">
        {prompts.map(prompt => (
          <li key={prompt.id}>
            {editingId === prompt.id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  disabled={disabled}
                  onChange={event => setEditText(event.target.value)}
                />
                <button type="button" disabled={disabled} onClick={() => submitEdit(prompt.id)}>Save</button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{prompt.text}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setEditingId(prompt.id);
                    setEditText(prompt.text);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="danger" disabled={disabled} onClick={() => onDelete(prompt.id)}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
