import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SoundSettings } from './SoundSettings';
import type { TickerSoundApi } from '../hooks/useTickerSound';

function makeApi(overrides: Partial<TickerSoundApi> = {}): TickerSoundApi {
  return {
    source: 'default',
    customSoundName: null,
    customBuffer: null,
    error: null,
    notice: null,
    uploadFile: vi.fn(async () => undefined),
    preview: vi.fn(),
    revertToDefault: vi.fn(async () => undefined),
    dismissMessage: vi.fn(),
    ...overrides,
  };
}

describe('SoundSettings', () => {
  it('shows "Default tick" when no custom sound is active', () => {
    render(<SoundSettings ticker={makeApi()} />);
    expect(screen.getByText('Default tick')).toBeInTheDocument();
  });

  it('shows the custom file name when a custom sound is active', () => {
    render(<SoundSettings ticker={makeApi({ source: 'custom', customSoundName: 'my-tick.mp3' })} />);
    expect(screen.getByText('my-tick.mp3')).toBeInTheDocument();
  });

  it('hides the revert button for the default sound', () => {
    render(<SoundSettings ticker={makeApi()} />);
    expect(screen.queryByText('Use default')).not.toBeInTheDocument();
  });

  it('shows the revert button only when custom is active, and it calls revertToDefault', () => {
    const api = makeApi({ source: 'custom', customSoundName: 'x.wav' });
    render(<SoundSettings ticker={api} />);
    fireEvent.click(screen.getByText('Use default'));
    expect(api.revertToDefault).toHaveBeenCalled();
  });

  it('invokes preview from the Preview button', () => {
    const api = makeApi();
    render(<SoundSettings ticker={api} />);
    fireEvent.click(screen.getByText('Preview'));
    expect(api.preview).toHaveBeenCalled();
  });

  it('has a file input with the correct accept attribute', () => {
    render(<SoundSettings ticker={makeApi()} />);
    const input = screen.getByLabelText('Upload custom ticker sound');
    expect(input).toHaveAttribute('accept', 'audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg');
  });

  it('calls uploadFile when a file is selected', () => {
    const api = makeApi();
    render(<SoundSettings ticker={api} />);
    const input = screen.getByLabelText('Upload custom ticker sound');
    const file = new File([new Uint8Array(8)], 'tick.mp3', { type: 'audio/mpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(api.uploadFile).toHaveBeenCalledWith(file);
  });

  it('renders the error message with a dismiss control', () => {
    const api = makeApi({ error: 'Unsupported file type.' });
    render(<SoundSettings ticker={api} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unsupported file type.');
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(api.dismissMessage).toHaveBeenCalled();
  });

  it('renders the notice message', () => {
    const api = makeApi({ notice: 'Could not be saved.' });
    render(<SoundSettings ticker={api} />);
    expect(screen.getByRole('status')).toHaveTextContent('Could not be saved.');
  });
});
