// columns: [{ key, label }], rows: array of objects
export function exportToCSV(rows, columns, filename) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",")
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const value = row[c.key] ?? ""
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(",")
    )
    .join("\n")

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
