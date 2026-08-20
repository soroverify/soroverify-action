import * as core from '@actions/core';
import * as github from '@actions/github';
import { PollTimeoutError, SubmissionRejectedError, ValidationError, VerifierRequestError } from './errors';
import { pollStatus } from './poll';
import { report } from './report';
import { submitSubmission } from './submit';
import {
  validateContractId,
  validateSourceRepo,
  validateSourceRev,
  validateVerifierUrl,
} from './validate';

function resolveSourceRepo(input: string): string {
  if (input.length > 0) {
    const ownerRepo = validateSourceRepo(input);
    return `https://github.com/${ownerRepo}`;
  }
  const { owner, repo } = github.context.repo;
  return `https://github.com/${owner}/${repo}`;
}

function resolveSourceRev(input: string): string {
  if (input.length > 0) {
    return validateSourceRev(input);
  }
  return validateSourceRev(github.context.sha);
}

function parseTimeoutSeconds(input: string): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`timeout-seconds must be a positive number, got "${input}".`);
  }
  return parsed;
}

function parseFailOnMismatch(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw new ValidationError(`fail-on-mismatch must be "true" or "false", got "${input}".`);
}

export async function run(): Promise<void> {
  try {
    const verifierUrl = validateVerifierUrl(core.getInput('verifier-url', { required: true }));
    const contractId = validateContractId(core.getInput('contract-id', { required: true }));
    const sourceRepo = resolveSourceRepo(core.getInput('source-repo'));
    const sourceRev = resolveSourceRev(core.getInput('source-rev'));
    const timeoutSeconds = parseTimeoutSeconds(core.getInput('timeout-seconds') || '600');
    const failOnMismatch = parseFailOnMismatch(core.getInput('fail-on-mismatch') || 'true');

    let submissionId: string;
    try {
      const submission = await submitSubmission({
        verifierUrl,
        contractId,
        sourceRepo,
        sourceRev,
      });
      submissionId = submission.submissionId;
    } catch (err) {
      if (err instanceof SubmissionRejectedError) {
        core.setFailed(`Verifier rejected the submission: ${err.message}`);
        return;
      }
      throw err;
    }

    core.info(`Submitted for verification. Submission ID: ${submissionId}`);

    let result;
    try {
      result = await pollStatus({ verifierUrl, submissionId, timeoutSeconds });
    } catch (err) {
      if (err instanceof PollTimeoutError) {
        core.setFailed(err.message);
        return;
      }
      throw err;
    }

    report({ submissionId, result, failOnMismatch });
  } catch (err) {
    if (err instanceof ValidationError) {
      core.setFailed(`Invalid input: ${err.message}`);
      return;
    }
    if (err instanceof VerifierRequestError) {
      core.setFailed(`Failed to communicate with the verifier: ${err.message}`);
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(`Unexpected error: ${message}`);
  }
}

if (require.main === module) {
  void run();
}
