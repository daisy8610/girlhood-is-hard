export const fmt = (n) =>
  n == null ? "—" : (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("zh-TW");

// 蜜桃乳霜色。備選莫蘭迪粉霧色：醫美 #D4A5A5、頭髮 #9AAFC4、美容 #D9BD94、指甲 #A8BFA3
export const MAIN_COLORS = {
  "醫美": "#E8A6AE",
  "頭髮": "#A0BCDB",
  "美容": "#F2C9A0",
  "指甲": "#AED3B8",
};

export const MAIN_CATEGORIES = Object.keys(MAIN_COLORS);

export const num = (v) => (v == null || v === "" ? null : Number(v));

export function download(filename, text, type) {
  try {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return true;
  } catch (e) {
    return false;
  }
}

export function toCSV(rows, headers) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.map((h) => esc(h.label)).join(",")];
  rows.forEach((r) => lines.push(headers.map((h) => esc(r[h.key])).join(",")));
  return "\ufeff" + lines.join("\n");
}
