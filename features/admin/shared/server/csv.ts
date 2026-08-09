import "server-only";

function safeCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const serialized = value instanceof Date ? value.toISOString() : String(value);
  const formulaSafe = /^[=+\-@]/.test(serialized) ? `'${serialized}` : serialized;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export function rowsToCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(safeCell).join(","), ...rows.map(row => row.map(safeCell).join(","))].join("\r\n");
}

export function csvResponse(filename: string, body: string) {
  return new Response(`\uFEFF${body}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
