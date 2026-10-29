export interface MedicationItem {
  name: string;
  dosage?: string | null;
  route?: string | null;
  timestamp?: string | null;
  source_text?: string | null;
}

export interface ProcedureItem {
  name: string;
  timestamp?: string | null;
  source_text?: string | null;
}

export interface ExtractionPayload {
  event_timestamp?: string | null;
  source_note: string;
  medications: MedicationItem[];
  procedures: ProcedureItem[];
  observations: string[];
  missing_information: string[];
  extraction_confidence?: number | null;
  model_used?: string | null;
}

export interface ClinicalRecord {
  record_id: string;
  event_timestamp?: string | null;
  source_note: string;
  medications: MedicationItem[];
  procedures: ProcedureItem[];
  observations: string[];
  missing_information: string[];
  review_status: 'pending' | 'reviewed' | 'confirmed';
  extraction_confidence?: number | null;
  model_used?: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at?: string | null;
  reviewer_notes?: string | null;
  human_edited: boolean;
}

export interface HealthStatus {
  status: string;
  version: string;
  nebius_integration: {
    api_endpoint: string;
    configured_model: string;
    api_key_configured: boolean;
    api_key_masked: string;
    mode: string;
  };
  target_hackathon: string;
  supported_features: string[];
}
