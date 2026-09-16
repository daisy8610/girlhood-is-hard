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
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: "var(--fs-md)", color: "var(--ed-smoke)" }}>子分類佔比排行</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["year", "今年"], ["all", "全部年度"]].map(([k, label]) => (
            <Chip key={k} small active={range === k} onClick={() => setRange(k)}>{label}</Chip>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ranked.list.map((e, i) => {
          const pct = ranked.sum ? Math.round((e.total / ranked.sum) * 1000) / 10 : 0;
          return (
            <div key={e.key} style={{ fontSize: "var(--fs-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "var(--ed-smoke)" }}>{i + 1}. {e.key}</span>
                <span className="mono" style={{ color: "var(--ed-smoke)" }}>{fmt(e.total)}（{pct}%）</span>
              </div>
              <div style={{ height: 5, background: "var(--ed-stone)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: MAIN_COLORS[e.main] || "var(--ed-ink)" }} />
              </div>
            </div>
          );
        })}
        {ranked.list.length === 0 && <div style={{ color: "var(--ed-ash)", fontSize: "var(--fs-md)" }}>這段期間還沒有消費紀錄</div>}
      </div>
    </div>
  );
}
