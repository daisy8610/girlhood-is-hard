import React, { useMemo } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";

const MAX_BAR_PX = 110;

// 今年 1～12 月的疊色長條圖；退款（負數）不算
export function MonthlyChart({ spending }) {
  const data = useMemo(() => {
    const now = new Date();
    const year = String(now.getFullYear());
    const thisMonth = now.getMonth(); // 0～11
    const mains = Object.keys(MAIN_COLORS);
    const months = Array.from({ length: 12 }, () => Object.fromEntries(mains.map((k) => [k, 0])));
    spending.forEach((r) => {
      if (!r.date || !r.date.startsWith(year) || !(r.amount > 0) || !(r.main in MAIN_COLORS)) return;
      months[Number(r.date.slice(5, 7)) - 1][r.main] += r.amount;
    });
    const totals = months.map((m) => mains.reduce((s, k) => s + m[k], 0));
    const max = Math.max(1, ...totals);
    const avg = Math.round(totals.slice(0, thisMonth + 1).reduce((s, v) => s + v, 0) / (thisMonth + 1));
    return { months, totals, max, avg, mains, thisMonth };
  }, [spending]);

  return (
    <div className="trend monthly">
      <div className="trend__head">
        <div className="panel-label">今年每月花費</div>
        <div className="monthly__avg num">月平均 {fmt(data.avg)}</div>
      </div>
      <div className="monthly__bars">
        {data.months.map((m, i) => {
          const segs = data.mains.filter((k) => m[k] > 0);
          const future = i > data.thisMonth;
          return (
            <div key={i} className="monthly__col">
              {data.totals[i] > 0 && <div className="num monthly__total">{(data.totals[i] / 1000).toFixed(1)}k</div>}
              <div className="monthly__stack">
                {segs.map((k, idx) => (
                  <div
                    key={k}
                    className={"bar-seg" + (idx === segs.length - 1 ? " is-top" : "")}
                    style={{ height: Math.max(2, (m[k] / data.max) * MAX_BAR_PX), background: MAIN_COLORS[k] }}
                  />
                ))}
                {segs.length === 0 && !future && <div className="monthly__empty" />}
              </div>
              <div className={"monthly__label" + (i === data.thisMonth ? " is-current" : "")}>{i + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
