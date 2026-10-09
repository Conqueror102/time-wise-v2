/**
 * CSV helpers shared by the dashboard and API exports.
 */

function escapeCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value)
  // Stop spreadsheet apps from evaluating user-supplied text as a formula
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n")
}

/** Trigger a browser download of CSV text */
export function downloadCsv(filename: string, csv: string): void {
  // Leading BOM so Excel detects UTF-8 (names with accents)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
