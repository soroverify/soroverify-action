import * as core from '@actions/core';
import { PollResult } from './types';

export interface ReportOptions {
  submissionId: string;
  result: PollResult;
  failOnMismatch: boolean;
}

const SUMMARY_LINES: Record<PollResult['status'], string> = {
  verified: 'Verification succeeded: the deployed contract matches the submitted source.',
  mismatch: 'Verification found a mismatch: the deployed contract does not match the submitted source.',
  inconclusive: 'Verification was inconclusive: the verifier could not reach a definitive result.',
};

export function report(options: ReportOptions): void {
  const { submissionId, result, failOnMismatch } = options;

  core.setOutput('status', result.status);
  core.setOutput('submission-id', submissionId);

  const summary = SUMMARY_LINES[result.status];
  core.info(summary);
  core.info(`Submission ID: ${submissionId}`);
  if (result.detail) {
    core.info(`Detail: ${result.detail}`);
  }

  if (result.status === 'mismatch' && failOnMismatch) {
    core.setFailed(`${summary} (fail-on-mismatch is enabled)`);
    return;
  }

  core.info('This action succeeded; the verification outcome above is reported for visibility.');
}
