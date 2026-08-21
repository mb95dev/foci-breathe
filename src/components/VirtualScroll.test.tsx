import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualScroll } from './VirtualScroll';

describe('VirtualScroll', () => {
  it('renders children inside a scroll viewport', () => {
    render(
      <VirtualScroll>
        <p>long content</p>
      </VirtualScroll>,
    );
    expect(screen.getByTestId('virtual-scroll')).toBeInTheDocument();
    expect(screen.getByText('long content')).toBeInTheDocument();
  });
});
