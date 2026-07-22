import { useState } from 'react';
import { INTERVAL_PRESETS_MS } from '../../../shared/reminders/defaults.ts';
import { formatIntervalLabel } from '../../../shared/reminders/format.ts';
import { minutesToMs, msToMinutes, validateIntervalMinutes } from '../../../shared/reminders/validation.ts';

interface Props {
  intervalMs: number;
  disabled: boolean;
  onChange: (intervalMs: number) => void;
}

export function IntervalPicker({ intervalMs, disabled, onChange }: Props) {
  const [customMinutes, setCustomMinutes] = useState(String(msToMinutes(intervalMs)));
  const [customError, setCustomError] = useState<string | null>(null);

  const applyCustom = () => {
    const minutes = Number(customMinutes);
    if (!validateIntervalMinutes(minutes)) {
      setCustomError('Enter a whole number between 1 and 480 minutes.');
      return;
    }
    setCustomError(null);
    onChange(minutesToMs(minutes));
  };

  return (
    <section className="panel">
      <h2>Interval</h2>
      <div className="preset-row">
        {INTERVAL_PRESETS_MS.map(preset => (
          <button
            key={preset}
            type="button"
            className={preset === intervalMs ? 'chip active' : 'chip'}
            disabled={disabled}
            onClick={() => onChange(preset)}
          >
            {formatIntervalLabel(preset)}
          </button>
        ))}
      </div>

      <div className="custom-row">
        <label htmlFor="custom-interval">Custom (minutes)</label>
        <input
          id="custom-interval"
          type="number"
          min={1}
          max={480}
          value={customMinutes}
          disabled={disabled}
          onChange={event => setCustomMinutes(event.target.value)}
        />
        <button type="button" disabled={disabled} onClick={applyCustom}>Apply</button>
      </div>
      {customError && <p className="field-error">{customError}</p>}
    </section>
  );
}
