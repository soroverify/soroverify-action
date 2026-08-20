import { SubmissionRejectedError, VerifierRequestError } from './errors';
import { SubmissionRequest, SubmissionResponse } from './types';

interface ErrorIssue {
  field?: string;
  reason?: string;
}

interface ErrorDetail {
  code?: string;
  issues?: ErrorIssue[];
}

interface ErrorBody {
  message?: string;
  error?: string | ErrorDetail;
}

function formatIssues(issues: ErrorIssue[]): string {
  return issues
    .filter((issue) => typeof issue.reason === 'string' && issue.reason.length > 0)
    .map((issue) =>
      typeof issue.field === 'string' && issue.field.length > 0
        ? `${issue.field}: ${issue.reason as string}`
        : (issue.reason as string),
    )
    .join('; ');
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const candidate = body as ErrorBody;

    if (typeof candidate.message === 'string' && candidate.message.length > 0) {
      return candidate.message;
    }

    if (typeof candidate.error === 'string' && candidate.error.length > 0) {
      return candidate.error;
    }

    if (candidate.error && typeof candidate.error === 'object') {
      const detail = candidate.error;
      const issuesText =
        Array.isArray(detail.issues) && detail.issues.length > 0
          ? formatIssues(detail.issues)
          : '';

      if (issuesText.length > 0) {
        return typeof detail.code === 'string' && detail.code.length > 0
          ? `${detail.code}: ${issuesText}`
          : issuesText;
      }

      if (typeof detail.code === 'string' && detail.code.length > 0) {
        return detail.code;
      }
    }
  }
  return fallback;
}

export async function submitSubmission(
  request: SubmissionRequest,
): Promise<SubmissionResponse> {
  const url = `${request.verifierUrl}/submissions`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: request.contractId,
        sourceRepo: request.sourceRepo,
        sourceRev: request.sourceRev,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new VerifierRequestError(
      `Failed to reach verifier at ${url}: ${message}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status === 400) {
    throw new SubmissionRejectedError(
      extractErrorMessage(body, 'The verifier rejected the submission.'),
    );
  }

  if (!response.ok) {
    throw new VerifierRequestError(
      extractErrorMessage(
        body,
        `Verifier returned an unexpected status: ${response.status} ${response.statusText}.`,
      ),
    );
  }

  const parsed = body as Partial<SubmissionResponse> | undefined;
  if (!parsed || typeof parsed.submissionId !== 'string' || parsed.submissionId.length === 0) {
    throw new VerifierRequestError(
      'Verifier response did not include a submissionId.',
    );
  }

  return { submissionId: parsed.submissionId };
}
