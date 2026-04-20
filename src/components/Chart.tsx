type Point = { x: number; y: number };

export function LineChart({
  data,
  width = 600,
  height = 180,
  stroke = "#7cc4ff",
  fill = "rgba(124, 196, 255, 0.12)",
  showAxis = true,
  yUnit = "",
}: {
  data: { t: number; v: number }[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showAxis?: boolean;
  yUnit?: string;
}) {
  if (data.length < 2) {
    return (
      <div
        className="text-muted text-xs flex items-center justify-center border border-dashed border-edge rounded-lg"
        style={{ height }}
      >
        Not enough data to plot.
      </div>
    );
  }
  const pad = showAxis ? { l: 40, r: 8, t: 10, b: 22 } : { l: 0, r: 0, t: 0, b: 0 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;

  const xs = data.map((d) => d.t);
  const ys = data.map((d) => d.v);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.1 || Math.abs(yMax) * 0.05 || 1;
  const y0 = yMin - yPad, y1 = yMax + yPad;

  const scale = (p: Point) => ({
    x: pad.l + ((p.x - xMin) / (xMax - xMin || 1)) * w,
    y: pad.t + (1 - (p.y - y0) / (y1 - y0 || 1)) * h,
  });

  const pts = data.map((d) => scale({ x: d.t, y: d.v }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area =
    `${path} L${pts[pts.length - 1].x.toFixed(1)},${pad.t + h} L${pts[0].x.toFixed(1)},${pad.t + h} Z`;

  const last = data[data.length - 1];
  const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));
  const fmtDate = (t: number) => new Date(t).toLocaleDateString();

  const yTicks = [y0, (y0 + y1) / 2, y1];
  const xTicks = [xs[0], xs[Math.floor(xs.length / 2)], xs[xs.length - 1]];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r={3.5}
        fill={stroke}
      />
      {showAxis && (
        <>
          {yTicks.map((t, i) => {
            const y = pad.t + (1 - (t - y0) / (y1 - y0 || 1)) * h;
            return (
              <g key={i}>
                <line x1={pad.l} x2={pad.l + w} y1={y} y2={y} stroke="#22262d" strokeDasharray="2 3" />
                <text x={pad.l - 6} y={y + 3} fontSize={10} textAnchor="end" fill="#8a8f98">
                  {fmt(t)}
                  {yUnit}
                </text>
              </g>
            );
          })}
          {xTicks.map((t, i) => {
            const x = pad.l + ((t - xMin) / (xMax - xMin || 1)) * w;
            return (
              <text key={i} x={x} y={height - 6} fontSize={10} textAnchor="middle" fill="#8a8f98">
                {fmtDate(t)}
              </text>
            );
          })}
        </>
      )}
      <title>
        latest {fmt(last.v)}
        {yUnit} on {fmtDate(last.t)}
      </title>
    </svg>
  );
}

export function Sparkline({
  data,
  stroke = "#7cc4ff",
  height = 32,
  width = 120,
}: {
  data: { t: number; v: number }[];
  stroke?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const xs = data.map((d) => d.t);
  const ys = data.map((d) => d.v);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const yRange = yMax - yMin || 1;
  const xRange = xMax - xMin || 1;
  const pts = data.map((d) => [
    ((d.t - xMin) / xRange) * width,
    height - ((d.v - yMin) / yRange) * (height - 2) - 1,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}
