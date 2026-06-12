import { useRef } from 'react';
import type { TickerSoundApi } from '../hooks/useTickerSound';

interface Props {
  ticker: TickerSoundApi;
}

export function SoundSettings({ ticker }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void ticker.uploadFile(file);
    }
    e.target.value = ''; // allow re-selecting the same file
  };

  return (
    <div className="sound-settings">
      <h3 className="section-title">Ticker Sound</h3>

      <div className="sound-current">
        <span className="sound-name" title={ticker.customSoundName ?? 'Default tick'}>
          {ticker.source === 'custom' && ticker.customSoundName
            ? ticker.customSoundName
            : 'Default tick'}
        </span>
      </div>

      <div className="sound-actions">
        <button
          className="sound-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload sound
        </button>
        <button className="sound-btn" onClick={ticker.preview}>
          Preview
        </button>
        {ticker.source === 'custom' && (
          <button className="sound-btn" onClick={() => void ticker.revertToDefault()}>
            Use default
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
        onChange={handleFileChange}
        className="sound-file-input"
        aria-label="Upload custom ticker sound"
      />

      {ticker.error && (
        <div className="sound-message error" role="alert">
          {ticker.error}
          <button className="sound-dismiss" onClick={ticker.dismissMessage} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {ticker.notice && (
        <div className="sound-message notice" role="status">
          {ticker.notice}
          <button className="sound-dismiss" onClick={ticker.dismissMessage} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
