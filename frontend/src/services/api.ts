import { ClinicalRecord, ExtractionPayload, HealthStatus } from '../types/clinical';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch('/health');
  if (!res.ok) {
    throw new Error(`Failed to fetch health status: ${res.statusText}`);
  }
  return res.json();
}

export async function extractNote(text: string, event_timestamp?: string): Promise<ExtractionPayload> {
  const res = await fetch(`${API_BASE}/notes/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      event_timestamp: event_timestamp || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Extraction failed with status ${res.status}`);
  }

  return res.json();
}

export async function listRecords(search?: string, status?: string): Promise<ClinicalRecord[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (status && status !== 'all') params.append('status', status);

  const url = `${API_BASE}/records${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch records: ${res.statusText}`);
  }
  return res.json();
}

export async function getRecord(recordId: string): Promise<ClinicalRecord> {
  const res = await fetch(`${API_BASE}/records/${encodeURIComponent(recordId)}`);
  if (!res.ok) {
    throw new Error(`Record ${recordId} not found.`);
  }
  return res.json();
}

export async function createRecord(data: Partial<ClinicalRecord>): Promise<ClinicalRecord> {
  const res = await fetch(`${API_BASE}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create record: ${res.statusText}`);
  }
  return res.json();
}

export async function updateRecord(recordId: string, updates: Partial<ClinicalRecord>): Promise<ClinicalRecord> {
  const res = await fetch(`${API_BASE}/records/${encodeURIComponent(recordId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update record: ${res.statusText}`);
  }
  return res.json();
}

export async function confirmRecord(recordId: string, reviewerNotes?: string): Promise<ClinicalRecord> {
  const res = await fetch(`${API_BASE}/records/${encodeURIComponent(recordId)}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reviewer_notes: reviewerNotes || null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to confirm record: ${res.statusText}`);
  }
  return res.json();
}

export async function exportRecord(recordId: string, format: 'json' | 'fhir' | 'narrative'): Promise<any> {
  const res = await fetch(`${API_BASE}/records/${encodeURIComponent(recordId)}/export?format=${format}`);
  if (!res.ok) {
    throw new Error(`Export failed: ${res.statusText}`);
  }
  if (format === 'narrative') {
    return res.text();
  }
  return res.json();
}
