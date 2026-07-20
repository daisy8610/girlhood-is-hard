import React, { useMemo, useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";

const MAX_BAR_PX = 140;
const GAP = 2; // 2px surface gap between stacked segments

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
    <div style={{ marginBottom: 26, background: "#FFF9F6", border: "1px solid #F3DCDF", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "#7A5560" }}>年度支出比較</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {data.mains.map((k) => (
            <span key={k} style={{ fontSize: 11, color: "#7A5560", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: MAIN_COLORS[k] }} />
              {k}
            </span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: "#A88690", marginBottom: 8 }}>點一下柱子看該年明細</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, overflowX: "auto", paddingTop: 140 }}>
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
            <div key={x.y} style={{ position: "relative", flex: "1 0 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {isOpen && (
                <div style={{
                  position: "absolute", bottom: "100%", ...cardPos,
                  marginBottom: 8, background: "#fff", borderRadius: 12, boxShadow: "0 6px 20px rgba(90,60,50,0.18)",
                  padding: "12px 14px", minWidth: 168, zIndex: 10,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2420", marginBottom: 8 }}>{x.y}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {segments.length === 0 && <div style={{ fontSize: 12.5, color: "#A88690" }}>這一年沒有紀錄</div>}
                    {[...segments].reverse().map((s) => (
                      <div key={s.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#5a5044" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 8, background: MAIN_COLORS[s.k], flexShrink: 0 }} />
                          {s.k}
                        </span>
                        <span className="mono" style={{ fontSize: 12.5, color: "#2B2420" }}>{fmt(s.v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {x.total > 0 && (
                <div className="mono" style={{ fontSize: 9.5, color: "#7A5560", marginBottom: 4 }}>{Math.round(x.total / 1000)}k</div>
              )}
              <button
                onClick={() => setOpenYear(isOpen ? null : x.y)}
                style={{
                  border: "none", background: "transparent", padding: 0, width: "100%",
                  display: "flex", flexDirection: "column-reverse", height: MAX_BAR_PX,
                  cursor: "pointer",
                }}
              >
                {segments.map((s, idx) => {
                  const isTop = idx === segments.length - 1;
                  const isBottom = idx === 0;
                  const h = Math.max(2, (s.v / data.max) * MAX_BAR_PX - (isBottom ? 0 : GAP));
                  return (
                    <div
                      key={s.k}
                      style={{
                        width: "100%", maxWidth: 24, margin: "0 auto", height: h,
                        marginBottom: isBottom ? 0 : GAP,
                        background: MAIN_COLORS[s.k],
                        borderTopLeftRadius: isTop ? 4 : 0, borderTopRightRadius: isTop ? 4 : 0,
                      }}
                    />
                  );
                })}
              </button>
              <div style={{ fontSize: 10, color: "#A88690", marginTop: 6 }}>{x.y}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
