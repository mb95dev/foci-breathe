import { useState } from 'react';
import { CycleDiagram } from './CycleDiagram.tsx';
import {
  DIFFUSION_EFFECT,
  DIFFUSION_INTRO,
  DIFFUSION_STEPS,
  getBreadcrumbTrail,
  getChildren,
  getTechnique,
  getTopLevel,
  INTERRUPT_EFFECT,
  INTERRUPT_INTRO,
  INTERRUPT_STEPS,
  REFOCUS_TASKS,
  type TechniqueId,
  type TechniqueMeta,
  type TechniqueStep,
} from './content.ts';
import './techniques.css';

export function TechniquesModule() {
  const [currentId, setCurrentId] = useState<TechniqueId | null>(null);

  return (
    <div className="techniques-module">
      <Breadcrumb currentId={currentId} onNavigate={setCurrentId} />
      {currentId === null ? (
        <Catalog onOpen={setCurrentId} />
      ) : (
        <TechniquePage id={currentId} onOpen={setCurrentId} />
      )}
      <p className="disclaimer">
        Educational tools for noticing thought loops — not a substitute for professional care.
      </p>
    </div>
  );
}

function Breadcrumb({
  currentId,
  onNavigate,
}: {
  currentId: TechniqueId | null;
  onNavigate: (id: TechniqueId | null) => void;
}) {
  const trail = currentId ? getBreadcrumbTrail(currentId) : [];

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          {currentId === null ? (
            <span aria-current="page">Techniques</span>
          ) : (
            <button type="button" onClick={() => onNavigate(null)}>
              Techniques
            </button>
          )}
        </li>
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={item.id}>
              <span className="breadcrumb-sep" aria-hidden="true">›</span>
              {isLast ? (
                <span aria-current="page">{item.crumb}</span>
              ) : (
                <button type="button" onClick={() => onNavigate(item.id)}>
                  {item.crumb}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Catalog({ onOpen }: { onOpen: (id: TechniqueId) => void }) {
  return (
    <>
      <section className="techniques-hero">
        <h2>Techniques</h2>
        <p>
          Thought, emotion, and behavior form a self-driving loop. These tools create a pause
          in that loop — linguistic distance, or a clean interrupt and redirect.
        </p>
      </section>
      <div className="category-grid">
        {getTopLevel().map(item => (
          <CategoryCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </>
  );
}

function CategoryCard({
  item,
  onOpen,
}: {
  item: TechniqueMeta;
  onOpen: (id: TechniqueId) => void;
}) {
  const children = getChildren(item.id);
  return (
    <button type="button" className="category-card" onClick={() => onOpen(item.id)}>
      <span className="category-kicker">
        {children.length > 0 ? 'Category' : 'Practice'}
      </span>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
    </button>
  );
}

function TechniquePage({
  id,
  onOpen,
}: {
  id: TechniqueId;
  onOpen: (id: TechniqueId) => void;
}) {
  const meta = getTechnique(id);

  return (
    <article className="technique-page">
      <h2>{meta.title}</h2>
      <p className="technique-lede">{meta.summary}</p>
      <TechniqueBody id={id} onOpen={onOpen} />
    </article>
  );
}

function TechniqueBody({
  id,
  onOpen,
}: {
  id: TechniqueId;
  onOpen: (id: TechniqueId) => void;
}) {
  switch (id) {
    case 'cbt-cycle':
      return (
        <>
          <CycleDiagram onOpen={onOpen} />
          <p className="technique-copy">
            Thoughts, emotions, and behaviors reinforce one another. A thought can also skip
            straight to behavior. Breaking the loop needs an intervention that creates
            psychological distance and gives the brain something else to do.
          </p>
          <div className="category-grid">
            {getChildren('cbt-cycle').map(item => (
              <CategoryCard key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        </>
      );
    case 'thoughts':
      return (
        <LoopPart
          exampleTitle="Example thought"
          example="“They didn’t text back because they don’t value me.”"
          body="The mind presents a story as fact. You do not have to debate the story — you can notice it as a thought, then choose a technique."
          onOpen={onOpen}
        />
      );
    case 'emotions':
      return (
        <LoopPart
          exampleTitle="Example feelings"
          chips={['Hurt', 'Rejection', 'Sadness', 'Anger']}
          body="Feelings arrive fast once the story is believed. The intervention is the pause before the feeling takes the wheel — not the suppression of the feeling itself."
          onOpen={onOpen}
        />
      );
    case 'behaviors':
      return (
        <LoopPart
          exampleTitle="Example reactions"
          chips={['Withdraw', 'Send an angry text', 'Ruminate', 'Avoid contact']}
          body="What you do next writes the next thought. Withdrawal and rumination both confirm the original story. A different action interrupts the evidence the loop is collecting."
          onOpen={onOpen}
        />
      );
    case 'thought-diffusion':
      return (
        <Practice
          intro={DIFFUSION_INTRO}
          steps={DIFFUSION_STEPS}
          effect={DIFFUSION_EFFECT}
        />
      );
    case 'pattern-interrupt':
      return (
        <>
          <Practice
            intro={INTERRUPT_INTRO}
            steps={INTERRUPT_STEPS}
            effect={INTERRUPT_EFFECT}
          />
          <section className="technique-panel">
            <h3>Refocus tasks</h3>
            <div className="chip-row">
              {REFOCUS_TASKS.map(task => (
                <span key={task} className="chip">{task}</span>
              ))}
            </div>
          </section>
        </>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function LoopPart({
  exampleTitle,
  example,
  chips,
  body,
  onOpen,
}: {
  exampleTitle: string;
  example?: string;
  chips?: readonly string[];
  body: string;
  onOpen: (id: TechniqueId) => void;
}) {
  return (
    <>
      <section className="technique-panel">
        <h3>{exampleTitle}</h3>
        {example ? <p className="technique-copy">{example}</p> : null}
        {chips ? (
          <div className="chip-row">
            {chips.map(item => (
              <span key={item} className="chip">{item}</span>
            ))}
          </div>
        ) : null}
      </section>
      <p className="technique-copy">{body}</p>
      <section className="technique-panel">
        <h3>Try an intervention</h3>
        <div className="related-row">
          <button type="button" onClick={() => onOpen('thought-diffusion')}>
            Thought Diffusion
          </button>
          <button type="button" onClick={() => onOpen('pattern-interrupt')}>
            Pattern Interrupt
          </button>
        </div>
      </section>
    </>
  );
}

function Practice({
  intro,
  steps,
  effect,
}: {
  intro: string;
  steps: readonly TechniqueStep[];
  effect: string;
}) {
  return (
    <>
      <p className="technique-copy">{intro}</p>
      <section className="technique-panel">
        <h3>Steps</h3>
        <ol className="step-list">
          {steps.map(step => (
            <li key={step.label ?? step.body}>
              {step.label ? <strong>{step.label}</strong> : null}
              {step.body}
            </li>
          ))}
        </ol>
      </section>
      <aside className="evidence">
        <p>{effect}</p>
      </aside>
    </>
  );
}
