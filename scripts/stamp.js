// build 完後執行：依 app.js、app.css 的內容算出版本號，寫進 index.html（例如 app.js?v=a1b2c3d4）。
// 內容有變，網址就跟著變，瀏覽器會自動抓新檔，不用再強制重新整理。
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

for (const file of ["app.js", "app.css"]) {
  const content = fs.readFileSync(path.join(root, file));
  const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
  const pattern = new RegExp(`(["'])${file.replace(".", "\\.")}(\\?v=[0-9a-f]*)?\\1`, "g");
  if (!pattern.test(html)) throw new Error(`index.html 裡找不到 ${file} 的引用`);
  html = html.replace(pattern, `$1${file}?v=${hash}$1`);
  console.log(`${file} -> v=${hash}`);
}

fs.writeFileSync(htmlPath, html);
