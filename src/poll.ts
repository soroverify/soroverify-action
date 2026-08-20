import { PollTimeoutError, VerifierRequestError } from './errors';
import { PollResult, StatusResponse, isTerminalStatus } from './types';

export interface PollOptions {
  verifierUrl: string;
  submissionId: string;
  timeoutSeconds: number;
  intervalSeconds?: number;
  /** Injectable for tests; defaults to real wall-clock sleep. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable for tests; defaults to Date.now. */
  now?: () => number;
}

const DEFAULT_INTERVAL_SECONDS = 15;

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStatus(verifierUrl: string, submissionId: string): Promise<StatusResponse> {
  const url = `${verifierUrl}/status/${encodeURIComponent(submissionId)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new VerifierRequestError(`Failed to reach verifier at ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new VerifierRequestError(
      `Verifier returned an unexpected status while polling: ${response.status} ${response.statusText}.`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new VerifierRequestError('Verifier returned an unparseable status response.');
  }

  const parsed = body as Partial<StatusResponse> | undefined;
  if (!parsed || typeof parsed.status !== 'string') {
    throw new VerifierRequestError('Verifier status response did not include a status field.');
  }

  return parsed as StatusResponse;
}

export async function pollStatus(options: PollOptions): Promise<PollResult> {
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const intervalMs = (options.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS) * 1000;
  const deadline = now() + options.timeoutSeconds * 1000;

  for (;;) {
    const result = await fetchStatus(options.verifierUrl, options.submissionId);

    if (isTerminalStatus(result.status)) {
      return result.detail !== undefined
        ? { status: result.status, detail: result.detail }
        : { status: result.status };
    }

    if (now() >= deadline) {
      throw new PollTimeoutError(
        `Timed out after ${options.timeoutSeconds}s waiting for a verification result. ` +
          'This means the result is not yet known, not that verification failed.',
      );
    }

    const remainingMs = deadline - now();
    await sleep(Math.min(intervalMs, remainingMs));
  }
}
