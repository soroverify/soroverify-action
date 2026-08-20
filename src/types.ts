export type VerificationStatus = 'verified' | 'mismatch' | 'inconclusive';

export interface SubmissionRequest {
  verifierUrl: string;
  contractId: string;
  sourceRepo: string;
  sourceRev: string;
}

export interface SubmissionResponse {
  submissionId: string;
}

export interface StatusResponse {
  status: VerificationStatus | 'pending';
  detail?: string;
}

export interface PollResult {
  status: VerificationStatus;
  detail?: string;
}

const TERMINAL_STATUSES: ReadonlySet<string> = new Set<VerificationStatus>([
  'verified',
  'mismatch',
  'inconclusive',
]);

export function isTerminalStatus(status: string): status is VerificationStatus {
  return TERMINAL_STATUSES.has(status);
}
