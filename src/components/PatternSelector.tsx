import type { BreathingPattern } from '../types/breathing';
import { PATTERNS } from '../types/breathing';

interface Props {
  selected: BreathingPattern;
  onSelect: (pattern: BreathingPattern) => void;
  disabled: boolean;
}

export function PatternSelector({ selected, onSelect, disabled }: Props) {
  return (
    <div className="pattern-selector">
      <h3 className="section-title">Technique</h3>
      <div className="pattern-list">
        {PATTERNS.map(p => {
          const isFoci = p.id.startsWith('foci-');
          return (
            <button
              key={p.id}
              className={`pattern-card ${p.id === selected.id ? 'active' : ''} ${isFoci ? 'foci' : ''}`}
              onClick={() => onSelect(p)}
              disabled={disabled}
              style={{
                borderColor: p.id === selected.id ? p.color : 'transparent',
              }}
            >
              <div className="pattern-dot" style={{ backgroundColor: p.color }} />
              <div className="pattern-info">
                <span className="pattern-name">
                  {p.name}
                  {isFoci && <span className="foci-badge">FOCI</span>}
                </span>
                <span className="pattern-subtitle">{p.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="pattern-desc">{selected.description}</p>
    </div>
  );
}
