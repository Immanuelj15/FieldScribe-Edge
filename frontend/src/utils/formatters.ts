export function formatDate(isoString?: string | null): string {
  if (!isoString) return 'Not set';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatConfidence(confidence?: number | null): string {
  if (confidence === undefined || confidence === null) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
}

export function truncateText(text: string, maxLength: number = 80): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export function downloadFile(content: string, filename: string, type: string = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

