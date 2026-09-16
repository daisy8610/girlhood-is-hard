import React, { useMemo, useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";

const MAX_BAR_PX = 140;
const GAP = 2; // 疊加區段之間的 2px 間隔，要跟 styles.css 的 .bar-seg.is-stacked 一致

export function TrendChart({ spending }) {
  const [openYear, setOpenYear] = useState(null);

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
    return { byYear, max, mains };
  }, [spending]);

  return (
    <div className="trend">
      <div className="trend__head">
        <div className="panel-label">年度支出比較</div>
        <div className="trend__legend">
          {data.mains.map((k) => (
            <span key={k} className="trend__legend-item">
              <span className="legend-dot" style={{ background: MAIN_COLORS[k] }} />
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="trend__hint">點一下柱子看該年明細</div>
      <div className="trend__bars">
        {data.byYear.map((x, idx) => {
          const segments = data.mains.map((k) => ({ k, v: x.parts[k] })).filter((s) => s.v > 0);
          const isOpen = openYear === x.y;
          const isFirst = idx === 0;
          const isLast = idx === data.byYear.length - 1;
          const cardPos = isFirst
            ? { left: 0, transform: "none" }
            : isLast
            ? { right: 0, transform: "none" }
            : { left: "50%", transform: "translateX(-50%)" };
          return (
            <div key={x.y} className="trend__col">
              {isOpen && (
                <div className="trend__card" style={cardPos}>
                  <div className="trend__card-year">{x.y}</div>
                  <div className="trend__card-list">
                    {segments.length === 0 && <div className="trend__card-empty">這一年沒有紀錄</div>}
                    {[...segments].reverse().map((s) => (
                      <div key={s.k} className="trend__card-row">
                        <span className="trend__card-name">
                          <span className="legend-dot" style={{ background: MAIN_COLORS[s.k] }} />
                          {s.k}
                        </span>
                        <span className="num trend__card-amount">{fmt(s.v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {x.total > 0 && (
                <div className="num trend__total">{Math.round(x.total / 1000)}k</div>
              )}
              <button className="trend__bar" onClick={() => setOpenYear(isOpen ? null : x.y)} style={{ height: MAX_BAR_PX }}>
                {segments.map((s, idx) => {
                  const isTop = idx === segments.length - 1;
                  const isBottom = idx === 0;
                  const h = Math.max(2, (s.v / data.max) * MAX_BAR_PX - (isBottom ? 0 : GAP));
                  return (
                    <div
                      key={s.k}
                      className={"bar-seg" + (isBottom ? "" : " is-stacked") + (isTop ? " is-top" : "")}
                      style={{ height: h, background: MAIN_COLORS[s.k] }}
                    />
                  );
                })}
              </button>
              <div className="trend__year">{x.y}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
