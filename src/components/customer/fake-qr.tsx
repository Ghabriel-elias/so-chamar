export function FakeQr({ seed, label }: { seed: string; label: string }) {
  const size = 21;
  const cells: boolean[] = [];

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  for (let index = 0; index < size * size; index += 1) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    cells.push((hash >>> 16) % 100 < 45);
  }

  const isFinder = (row: number, column: number) => {
    const inCorner = (r0: number, c0: number) =>
      row >= r0 && row < r0 + 7 && column >= c0 && column < c0 + 7;
    return inCorner(0, 0) || inCorner(0, size - 7) || inCorner(size - 7, 0);
  };

  const finderFilled = (row: number, column: number) => {
    const r = row % 7 === 0 || row % 7 === 6;
    const c = column % 7 === 0 || column % 7 === 6;
    const inner =
      row % 7 >= 2 && row % 7 <= 4 && column % 7 >= 2 && column % 7 <= 4;
    return r || c || inner;
  };

  return (
    <figure className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        className="animate-pop h-56 w-56 rounded-lg border border-border-strong bg-white p-3 shadow-soft"
      >
        {cells.map((filled, index) => {
          const row = Math.floor(index / size);
          const column = index % size;
          const on = isFinder(row, column)
            ? finderFilled(row, column)
            : filled;

          if (!on) return null;

          return (
            <rect
              key={index}
              x={column}
              y={row}
              width="1"
              height="1"
              className="fill-ink"
            />
          );
        })}
      </svg>

      <figcaption className="text-note text-gray">{label}</figcaption>
    </figure>
  );
}
