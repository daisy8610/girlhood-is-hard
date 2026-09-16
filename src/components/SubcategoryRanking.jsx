import React, { useMemo, useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { Chip } from "./ui";

export function SubcategoryRanking({ spending }) {
  const [range, setRange] = useState("year");

  const ranked = useMemo(() => {
    const year = String(new Date().getFullYear());
    const rows = range === "year" ? spending.filter((r) => r.date && r.date.startsWith(year)) : spending;
    const byKey = {};
    rows.forEach((r) => {
      const key = r.sub || r.main || "其他";
      const entry = byKey[key] || { key, main: r.main, total: 0 };
      entry.total += r.amount > 0 ? r.amount : 0;
      byKey[key] = entry;
    });
    const list = Object.values(byKey).filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
    const sum = list.reduce((s, e) => s + e.total, 0);
    return { list, sum };
  }, [spending, range]);

  return (
    <div className="ranking">
      <div className="ranking__head">
        <div className="panel-label">子分類佔比排行</div>
        <div className="ranking__range">
          {[["year", "今年"], ["all", "全部年度"]].map(([k, label]) => (
            <Chip key={k} small active={range === k} onClick={() => setRange(k)}>{label}</Chip>
          ))}
        </div>
      </div>
      <div className="ranking__list">
        {ranked.list.map((e, i) => {
          const pct = ranked.sum ? Math.round((e.total / ranked.sum) * 1000) / 10 : 0;
          return (
            <div key={e.key} className="ranking__item">
              <div className="ranking__row">
                <span className="ranking__text">{i + 1}. {e.key}</span>
                <span className="mono ranking__text">{fmt(e.total)}（{pct}%）</span>
              </div>
              <div className="bar-track bar-track--ranking">
                <div className="bar-fill" style={{ width: pct + "%", background: MAIN_COLORS[e.main] || "var(--ed-ink)" }} />
              </div>
            </div>
          );
        })}
        {ranked.list.length === 0 && <div className="ranking__empty">這段期間還沒有消費紀錄</div>}
      </div>
    </div>
  );
}
