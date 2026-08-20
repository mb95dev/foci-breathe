import { describe, expect, it } from 'vitest';
import {
  getBreadcrumbTrail,
  getChildren,
  getTechnique,
  getTopLevel,
} from './content';

describe('technique navigation', () => {
  it('lists three top-level categories', () => {
    expect(getTopLevel().map(item => item.id)).toEqual([
      'cbt-cycle',
      'thought-diffusion',
      'pattern-interrupt',
    ]);
  });

  it('nests thoughts, emotions, and behaviors under the CBT cycle', () => {
    expect(getChildren('cbt-cycle').map(item => item.id)).toEqual([
      'thoughts',
      'emotions',
      'behaviors',
    ]);
  });

  it('builds a breadcrumb from Techniques through CBT Cycle to Thoughts', () => {
    expect(getBreadcrumbTrail('thoughts').map(item => item.crumb)).toEqual([
      'CBT Cycle',
      'Thoughts',
    ]);
  });

  it('returns a single crumb for a top-level article', () => {
    expect(getBreadcrumbTrail('thought-diffusion').map(item => item.crumb)).toEqual([
      'Thought Diffusion',
    ]);
  });

  it('looks up a technique by id', () => {
    expect(getTechnique('emotions').title).toBe('Emotions');
  });
});
