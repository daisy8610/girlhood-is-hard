import React from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { TrendChart } from "./TrendChart";
import { SubcategoryRanking } from "./SubcategoryRanking";
import { VouchersPanel } from "./VouchersPanel";

export function Overview({ totals, cap, spending, vouchers, voucherH }) {
  const sorted = Object.entries(totals.byMain).sort((a, b) => b[1] - a[1]);
  const pct = Math.min(100, Math.round((totals.ytd / cap) * 100));
  const remaining = cap - totals.ytd;

  return (
    <div>
      {/* 存摺卡片 */}
      <div style={{
        background: "linear-gradient(135deg,#C25B72,#D9718A 60%,#E08FA0)", color: "#FFF3F6",
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
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt(cap)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>剩餘額度</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmt(remaining)}</div>
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 12 }}>
          <div style={{ height: 7, background: "rgba(255,255,255,0.25)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "#FFF3F6" }} />
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 4, textAlign: "right" }} className="mono">已花 {pct}% of {fmt(cap)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
        {sorted.map(([k, v]) => (
          <div key={k} style={{ border: "1px solid #F3DCDF", borderRadius: 10, padding: 12, background: "#FFF9F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: MAIN_COLORS[k] || "#999" }} />
              <span style={{ fontSize: 12.5, color: "#7A5560" }}>{k}</span>
            </div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      <TrendChart spending={spending} />
      <SubcategoryRanking spending={spending} />
      <VouchersPanel data={vouchers} h={voucherH} />
    </div>
  );
}
