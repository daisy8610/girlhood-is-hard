export const fmt = (n) =>
  n == null ? "—" : (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("zh-TW");

// 莫蘭迪奶茶色。備選莫蘭迪粉霧色：醫美 #D4A5A5、頭髮 #9AAFC4、美容 #D9BD94、指甲 #A8BFA3
export const MAIN_COLORS = {
  "醫美": "#C99A9E",
  "頭髮": "#8EA4BA",
  "美容": "#CDAA7D",
  "指甲": "#9DB59A",
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
