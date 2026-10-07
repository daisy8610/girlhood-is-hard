import React, { useMemo, useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { Chip } from "./ui";

// 常去的店家：依消費次數排前 5 名；退款（負數）和沒填地點的不算
export function StoreRanking({ spending }) {
  const [range, setRange] = useState("year");

  const list = useMemo(() => {
    const year = String(new Date().getFullYear());
    const map = {};
    spending.forEach((r) => {
      const place = String(r.place || "").trim();
      if (!place || !(r.amount > 0)) return;
      if (range === "year" && !(r.date && r.date.startsWith(year))) return;
      const s = (map[place] = map[place] || { place, count: 0, total: 0, mains: {} });
      s.count += 1;
      s.total += r.amount;
      if (r.main) s.mains[r.main] = (s.mains[r.main] || 0) + 1;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, 5)
      .map((s) => ({ ...s, main: Object.entries(s.mains).sort((a, b) => b[1] - a[1])[0]?.[0] }));
  }, [spending, range]);

  return (
    <div className="ranking">
      <div className="ranking__head">
        <div className="panel-label">常去的店家</div>
        <div className="ranking__range">
          {[["year", "今年"], ["all", "全部年度"]].map(([k, label]) => (
            <Chip key={k} small active={range === k} onClick={() => setRange(k)}>{label}</Chip>
          ))}
        </div>
      </div>
      <div className="list">
        {list.map((s, i) => (
          <div key={s.place} className="list-row">
            <div className="list-row__main">
              <div className="list-row__title">
                <span className="cat-dot" style={{ background: MAIN_COLORS[s.main] || "var(--ed-ash)" }} />
                {i + 1}. {s.place}
              </div>
            </div>
            <div className="list-row__prices">
              <div className="num list-row__amount">{s.count} 次</div>
              <div className="num list-row__sub-amount">共 {fmt(s.total)}・平均 {fmt(Math.round(s.total / s.count))}</div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="ranking__empty">這段期間還沒有消費紀錄</div>}
      </div>
    </div>
  );
}
