import React from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { SectionTitle } from "./ui";
import { TrendChart } from "./TrendChart";
import { VouchersPanel } from "./VouchersPanel";

export function Overview({ totals, budgetTotals, spending, budget, vouchers, voucherH }) {
  const sorted = Object.entries(totals.byMain).sort((a, b) => b[1] - a[1]);
  const upcoming = budget.filter((r) => r.status !== "已完成").slice(0, 5);
  const pct = Math.min(100, Math.round((budgetTotals.planned / budgetTotals.cap) * 100));

  return (
    <div>
      {/* 存摺卡片 */}
      <div style={{
        background: "linear-gradient(135deg,#8a3b4d,#B5445B 60%,#c15a6c)", color: "#FBEDEF",
        borderRadius: 14, padding: "18px 18px 16px", marginBottom: 18, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "repeating-linear-gradient(115deg, transparent 0 26px, #fff 26px 27px)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 10px" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>今年累積支出</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmt(totals.ytd)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>歷年總支出</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmt(totals.all)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>年度預算上限</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt(budgetTotals.cap)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{new Date().getFullYear()} 已規劃</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt(budgetTotals.planned)}</div>
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 12 }}>
          <div style={{ height: 7, background: "rgba(255,255,255,0.25)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "#FBEDEF" }} />
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 4, textAlign: "right" }} className="mono">{pct}% of {fmt(budgetTotals.cap)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
        {sorted.map(([k, v]) => (
          <div key={k} style={{ border: "1px solid #EADFD4", borderRadius: 10, padding: 12, background: "#FBF7F2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: MAIN_COLORS[k] || "#999" }} />
              <span style={{ fontSize: 12.5, color: "#6b5f54" }}>{k}</span>
            </div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      <TrendChart spending={spending} />
      <VouchersPanel data={vouchers} h={voucherH} />

      <SectionTitle sub="尚未完成的預算項目">近期規劃</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {upcoming.map((r) => (
          <div key={r.id} className="row-hover" style={{
            display: "flex", justifyContent: "space-between", padding: "10px 12px",
            border: "1px dashed #EADFD4", borderRadius: 8, gap: 8, background: "#FBF7F2",
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14 }}>{r.item}</div>
              <div style={{ fontSize: 11, color: "#9a8d80" }}>{r.date || "未定日期"} · {r.place || "—"}</div>
            </div>
            <div className="mono" style={{ fontSize: 14, flexShrink: 0 }}>{fmt(r.budget)}</div>
          </div>
        ))}
        {upcoming.length === 0 && <div style={{ color: "#9a8d80", fontSize: 13 }}>目前沒有未完成的計畫項目 🎉</div>}
      </div>
    </div>
  );
}
