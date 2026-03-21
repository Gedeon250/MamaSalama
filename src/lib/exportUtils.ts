import { format } from 'date-fns';

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
) {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  const headerRow = keys.map(key => headers?.[key] || key).join(',');
  
  const rows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',')
  );

  const csv = [headerRow, ...rows].join('\n');
  downloadFile(csv, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDateForExport(date: string | null | undefined): string {
  if (!date) return '';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return date;
  }
}
