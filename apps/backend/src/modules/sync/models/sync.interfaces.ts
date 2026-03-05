export enum SyncSource {
  File = 'file',
  API = 'api',
}

export interface SyncStats {
  read: number;
  inserted: number;
  updated: number;
  errored: number;
  issues: string[];
  source: string;
}

export interface RawEmployee {
  external_id: string;
  first_name: string;
  last_name: string;
  email: string;
  hourly_rate: string;
  active: string;
}

export interface RawShift {
  external_id: string;
  employee_external_id: string;
  start_at: string;
  end_at: string;
  break_minutes: string;
}

export enum SyncRunStatus {
  Processing = 'Processing',
  Success = 'Success',
  Error = 'Error',
}
