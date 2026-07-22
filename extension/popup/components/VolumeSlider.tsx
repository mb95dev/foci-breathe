interface Props {
  volume: number;
  onChange: (volume: number) => void;
}

export function VolumeSlider({ volume, onChange }: Props) {
  const percent = Math.round(volume * 100);

  return (
    <section className="panel">
      <h2>Volume</h2>
      <label htmlFor="volume-slider">{percent}%</label>
      <input
        id="volume-slider"
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={event => onChange(Number(event.target.value) / 100)}
      />
    </section>
  );
}
