import React, { useMemo } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";

export function TrendChart({ spending }) {
  const data = useMemo(() => {
    const years = Array.from(new Set(spending.filter((r) => r.date).map((r) => r.date.slice(0, 4)))).sort();
    const mains = Object.keys(MAIN_COLORS);
    const byYear = years.map((y) => {
      const rows = spending.filter((r) => r.date && r.date.startsWith(y));
      const parts = {};
      let total = 0;
      mains.forEach((k) => {
        const v = rows.filter((r) => r.main === k).reduce((s, r) => s + (r.amount > 0 ? r.amount : 0), 0);
        parts[k] = v;
        total += v;
      });
      return { y, parts, total };
    });
    const max = Math.max(1, ...byYear.map((x) => x.total));
    return { years, byYear, max, mains };
  }, [spending]);

  const n = Math.max(1, data.years.length);
  const W = Math.max(300, n * 58), H = 190, padL = 8, padB = 26, barGap = 8;
  const barW = (W - padL * 2) / n - barGap;

  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: 13, color: "#6b5f54" }}>年度支出比較</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {data.mains.map((k) => (
            <span key={k} style={{ fontSize: 11, color: "#6b5f54", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: MAIN_COLORS[k] }} />
              {k}
            </span>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 480, marginTop: 8 }}>
          {data.byYear.map((x, i) => {
            const xPos = padL + i * ((W - padL * 2) / n) + barGap / 2;
            let y = H - padB;
            const chartH = H - padB - 24;
            return (
              <g key={x.y}>
                {data.mains.map((k) => {
                  const h = (x.parts[k] / data.max) * chartH;
                  if (h <= 0) return null;
                  y -= h;
                  return (
                    <rect key={k} x={xPos} y={y} width={barW} height={h} fill={MAIN_COLORS[k]} rx={2}>
                      <title>{x.y} {k}：{fmt(x.parts[k])}</title>
                    </rect>
                  );
                })}
                {x.total > 0 && (
                  <text x={xPos + barW / 2} y={y - 5} textAnchor="middle" fontSize="9.5" fill="#8a7f74" fontFamily="'IBM Plex Mono',monospace">
                    {Math.round(x.total / 1000)}k
                  </text>
                )}
                <text x={xPos + barW / 2} y={H - padB + 15} textAnchor="middle" fontSize="10" fill="#9a8d80">{x.y}</text>
              </g>
            );
          })}
          <line x1={padL} y1={H - padB} x2={W - padL} y2={H - padB} stroke="#EADFD4" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
