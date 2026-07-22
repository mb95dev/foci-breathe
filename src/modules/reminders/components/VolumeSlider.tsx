interface Props {
  volume: number;
  disabled: boolean;
  onChange: (volume: number) => void;
}

export function VolumeSlider({ volume, disabled, onChange }: Props) {
  const percent = Math.round(volume * 100);

  return (
    <section className="panel">
      <h3>Volume</h3>
      <label htmlFor="web-volume-slider">{percent}%</label>
      <input
        id="web-volume-slider"
        type="range"
        min={0}
        max={100}
        value={percent}
        disabled={disabled}
        onChange={event => onChange(Number(event.target.value) / 100)}
      />
    </section>
  );
}
