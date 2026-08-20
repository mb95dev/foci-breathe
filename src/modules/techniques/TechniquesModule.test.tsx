import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TechniquesModule } from './TechniquesModule';

describe('TechniquesModule', () => {
  it('shows top-level categories on the Techniques home', () => {
    render(<TechniquesModule />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Techniques');
    expect(screen.getByRole('heading', { name: 'Techniques' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /The CBT Cycle/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thought Diffusion/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pattern Interrupt/ })).toBeInTheDocument();
  });

  it('opens a category and updates the breadcrumb trail', () => {
    render(<TechniquesModule />);
    fireEvent.click(screen.getByRole('button', { name: /The CBT Cycle/ }));
    expect(screen.getByRole('heading', { name: 'The CBT Cycle' })).toBeInTheDocument();
    expect(screen.getByText('CBT Cycle')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Techniques' })).toBeInTheDocument();
  });

  it('drills into Thoughts and can return via breadcrumb', () => {
    render(<TechniquesModule />);
    fireEvent.click(screen.getByRole('button', { name: /The CBT Cycle/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Thoughts/ }));
    expect(screen.getByRole('heading', { name: 'Thoughts' })).toBeInTheDocument();
    expect(screen.getByText('Thoughts', { selector: '[aria-current="page"]' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'CBT Cycle' }));
    expect(screen.getByRole('heading', { name: 'The CBT Cycle' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Techniques' }));
    expect(screen.getByRole('heading', { name: 'Techniques' })).toBeInTheDocument();
  });

  it('opens Pattern Interrupt and lists the four steps', () => {
    render(<TechniquesModule />);
    fireEvent.click(screen.getByRole('button', { name: /Pattern Interrupt/ }));
    expect(screen.getByText('Relabel')).toBeInTheDocument();
    expect(screen.getByText('Reattribute')).toBeInTheDocument();
    expect(screen.getByText('Refocus')).toBeInTheDocument();
    expect(screen.getByText('Revalue')).toBeInTheDocument();
  });
});
