function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row?.[c.key])).join(','));
  return [header, ...lines].join('\r\n');
}

export function downloadCsv(filename, csvText) {
  // Add UTF-8 BOM so Excel opens it nicely.
  const blob = new Blob(["\ufeff", csvText], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  link.parentElement.removeChild(link);

  window.URL.revokeObjectURL(url);
}
