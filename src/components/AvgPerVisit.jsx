import React, { useMemo } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";

// 平均每次花費：用全部年度計算，退款（負數）不算
export function AvgPerVisit({ spending }) {
  const cards = useMemo(() => {
    const rows = spending.filter((r) => r.amount > 0);
    const calc = (list) => ({ count: list.length, avg: list.length ? Math.round(list.reduce((s, r) => s + r.amount, 0) / list.length) : 0 });
    return [
      { key: "全部", ...calc(rows) },
      ...Object.keys(MAIN_COLORS).map((k) => ({ key: k, color: MAIN_COLORS[k], ...calc(rows.filter((r) => r.main === k)) })),
    ].filter((c) => c.count > 0);
  }, [spending]);

  if (cards.length === 0) return null;

  return (
    <div className="avg">
      <div className="panel-label avg__title">平均每次花費</div>
      <div className="avg__grid">
        {cards.map((c) => (
          <div key={c.key} className={"avg__card" + (c.color ? "" : " is-all")}>
            <div className="main-card__head">
              {c.color && <span className="main-card__dot" style={{ background: c.color }} />}
              <span className="main-card__name">{c.key}</span>
            </div>
            <div className="num avg__value">{fmt(c.avg)}</div>
            <div className="num avg__count">共 {c.count} 次</div>
          </div>
        ))}
      </div>
    </div>
  );
}
