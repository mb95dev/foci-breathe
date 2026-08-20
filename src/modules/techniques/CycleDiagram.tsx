import { CYCLE_EXAMPLES } from './content.ts';
import type { TechniqueId } from './content.ts';

interface CycleDiagramProps {
  onOpen: (id: TechniqueId) => void;
}

export function CycleDiagram({ onOpen }: CycleDiagramProps) {
  return (
    <div className="cycle-layout">
      <div className="cycle-stack">
        <button type="button" className="cycle-node" onClick={() => onOpen('thoughts')}>
          <strong>Thoughts</strong>
          <span>What you believe</span>
        </button>
        <div className="cycle-connector" />
        <button type="button" className="cycle-node" onClick={() => onOpen('emotions')}>
          <strong>Emotions</strong>
          <span>What you feel</span>
        </button>
        <div className="cycle-connector" />
        <button type="button" className="cycle-node" onClick={() => onOpen('behaviors')}>
          <strong>Behaviors</strong>
          <span>What you do</span>
        </button>
      </div>

      <div className="cycle-side">
        <div className="intervention-card">
          <h3>Intervention</h3>
          <p>
            The pause between thought and emotion. Techniques below aim at this gap —
            so the story does not automatically become a feeling, then a reaction.
          </p>
        </div>

        <button type="button" className="example-card" onClick={() => onOpen('thoughts')}>
          <h3>Thought example</h3>
          <p>“{CYCLE_EXAMPLES.thought}”</p>
        </button>

        <button type="button" className="example-card" onClick={() => onOpen('emotions')}>
          <h3>Emotion example</h3>
          <div className="chip-row">
            {CYCLE_EXAMPLES.emotions.map(item => (
              <span key={item} className="chip">{item}</span>
            ))}
          </div>
        </button>

        <button type="button" className="example-card" onClick={() => onOpen('behaviors')}>
          <h3>Behavior example</h3>
          <div className="chip-row">
            {CYCLE_EXAMPLES.behaviors.map(item => (
              <span key={item} className="chip">{item}</span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}
