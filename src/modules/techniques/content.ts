export type TechniqueId =
  | 'cbt-cycle'
  | 'thoughts'
  | 'emotions'
  | 'behaviors'
  | 'thought-diffusion'
  | 'pattern-interrupt';

export interface TechniqueMeta {
  id: TechniqueId;
  title: string;
  crumb: string;
  summary: string;
  parentId: TechniqueId | null;
}

export interface TechniqueStep {
  label?: string;
  body: string;
}

export const TECHNIQUE_META: readonly TechniqueMeta[] = [
  {
    id: 'cbt-cycle',
    title: 'The CBT Cycle',
    crumb: 'CBT Cycle',
    summary: 'How thoughts, emotions, and behaviors keep each other going — and where to interrupt.',
    parentId: null,
  },
  {
    id: 'thoughts',
    title: 'Thoughts',
    crumb: 'Thoughts',
    summary: 'What you believe. The story the mind tells, often before you notice it.',
    parentId: 'cbt-cycle',
  },
  {
    id: 'emotions',
    title: 'Emotions',
    crumb: 'Emotions',
    summary: 'What you feel. The body reacts to the story as if it were fact.',
    parentId: 'cbt-cycle',
  },
  {
    id: 'behaviors',
    title: 'Behaviors',
    crumb: 'Behaviors',
    summary: 'What you do. Actions that feed the next round of thoughts.',
    parentId: 'cbt-cycle',
  },
  {
    id: 'thought-diffusion',
    title: 'Thought Diffusion',
    crumb: 'Thought Diffusion',
    summary: 'Create distance from a thought instead of arguing with it or suppressing it.',
    parentId: null,
  },
  {
    id: 'pattern-interrupt',
    title: 'Pattern Interrupt',
    crumb: 'Pattern Interrupt',
    summary: 'Name the loop, unhook from it, and redirect attention into a demanding task.',
    parentId: null,
  },
] as const;

const META_BY_ID = new Map(TECHNIQUE_META.map(item => [item.id, item]));

export function getTechnique(id: TechniqueId): TechniqueMeta {
  const meta = META_BY_ID.get(id);
  if (!meta) {
    throw new Error(`Unknown technique: ${id}`);
  }
  return meta;
}

export function getChildren(parentId: TechniqueId): TechniqueMeta[] {
  return TECHNIQUE_META.filter(item => item.parentId === parentId);
}

export function getTopLevel(): TechniqueMeta[] {
  return TECHNIQUE_META.filter(item => item.parentId === null);
}

export function getBreadcrumbTrail(id: TechniqueId): TechniqueMeta[] {
  const trail: TechniqueMeta[] = [];
  let current: TechniqueMeta | undefined = getTechnique(id);
  while (current) {
    trail.unshift(current);
    current = current.parentId ? getTechnique(current.parentId) : undefined;
  }
  return trail;
}

export const CYCLE_EXAMPLES = {
  thought: 'They didn’t text back because they don’t value me',
  emotions: ['Hurt', 'Rejection', 'Sadness', 'Anger'] as const,
  behaviors: ['Withdraw', 'Send an angry text', 'Ruminate', 'Avoid contact'] as const,
} as const;

export const DIFFUSION_INTRO =
  'When you’re caught in a thought loop, this practice creates distance between you and the thought instead of fighting it.';

export const DIFFUSION_STEPS: readonly TechniqueStep[] = [
  { body: 'Notice when you’re stuck in a repetitive thought.' },
  {
    body: 'Say to yourself: “I am noticing that I’m having the thought that…” followed by the specific thought.',
  },
  {
    body: 'Visualize the thought as text scrolling across a screen, or as words written on leaves floating down a stream.',
  },
  { body: 'Observe the thought passing by without engaging with its content.' },
];

export const DIFFUSION_EFFECT =
  'This creates psychological distance between you and your thoughts. Research by Masuda and colleagues (2010) found that this practice reduced both the emotional impact and believability of negative thoughts by over 40% compared with trying to suppress or argue with them.';

export const INTERRUPT_INTRO =
  'Breaking a thought loop takes two moves: interrupt the current pattern, then redirect attention. Dr. Jeffrey Schwartz at UCLA School of Medicine developed this four-step approach.';

export const INTERRUPT_STEPS: readonly TechniqueStep[] = [
  {
    label: 'Relabel',
    body: 'Identify the thought loop by name: “This is rumination” or “This is catastrophizing.”',
  },
  {
    label: 'Reattribute',
    body: 'Remind yourself: “This is my brain getting stuck, not an accurate reflection of reality.”',
  },
  {
    label: 'Refocus',
    body: 'Immediately do a pre-chosen absorbing task that needs full attention — a math problem, naming everything blue around you, or counting backward from 100 by 7s.',
  },
  {
    label: 'Revalue',
    body: 'Afterward, briefly note: “That thought pattern isn’t helpful or necessary.”',
  },
];

export const INTERRUPT_EFFECT =
  'Schwartz’s research, published in the Archives of General Psychiatry, showed that consistent practice can change activity patterns in the caudate nucleus — a brain area involved in sticky thought loops.';

export const REFOCUS_TASKS = [
  'Count backward from 100 by 7s',
  'Name every blue object in the room',
  'Solve a short math problem out loud',
] as const;
