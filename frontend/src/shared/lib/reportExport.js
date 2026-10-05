// Export helpers for admin reports. Each takes the report's columns and rows.

const fmtCell = (value, format) => {
  if (value === null || value === undefined) return ""
  if (format === "date") return new Date(value).toLocaleString("en-IN")
  if (format === "money") return Number(value).toFixed(2)
  return String(value)
}

function download(content, type, filename) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

export function exportCSV(name, columns, rows) {
  const head = columns.map((c) => `"${c.label}"`).join(",")
  const body = rows.map((r) => columns.map((c) => `"${fmtCell(r[c.key], c.format).replace(/"/g, '""')}"`).join(","))
  download("﻿" + [head, ...body].join("\n"), "text/csv;charset=utf-8;", `${name}_${stamp()}.csv`)
}

export function exportExcel(name, columns, rows) {
  const head = columns.map((c) => `<th>${c.label}</th>`).join("")
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${fmtCell(r[c.key], c.format)}</td>`).join("")}</tr>`)
    .join("")
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
  download(html, "application/vnd.ms-excel", `${name}_${stamp()}.xls`)
}

export function exportJSON(name, rows) {
  download(JSON.stringify(rows, null, 2), "application/json", `${name}_${stamp()}.json`)
}

// PDF goes through the browser's print dialog, so the admin can choose "Save as PDF".
export function exportPDF(title, summary, columns, rows) {
  const win = window.open("", "_blank")
  if (!win) return
  const cards = summary.map((s) => `<div class="card"><div>${s.label}</div><b>${fmtCell(s.value, s.format)}</b></div>`).join("")
  const head = columns.map((c) => `<th>${c.label}</th>`).join("")
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${fmtCell(r[c.key], c.format)}</td>`).join("")}</tr>`)
    .join("")
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0f2238}
      h1{font-size:20px;margin:0 0 4px} .sub{color:#666;font-size:12px;margin-bottom:16px}
      .cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
      .card{border:1px solid #ddd;border-radius:8px;padding:8px 12px;min-width:140px;font-size:12px}
      .card b{display:block;font-size:16px;margin-top:4px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border-bottom:1px solid #eee;padding:6px;text-align:left}
      th{background:#f5f5f5}
    </style></head><body>
    <h1>${title}</h1><div class="sub">Generated ${new Date().toLocaleString("en-IN")}</div>
    <div class="cards">${cards}</div>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=function(){window.print()}</script></body></html>`)
  win.document.close()
}
