/** Input failed validation before any network call was made. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** The verifier rejected the submission outright (HTTP 400). Not retried. */
export class SubmissionRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionRejectedError';
  }
}

/** A network or unexpected HTTP error occurred talking to the verifier. */
export class VerifierRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerifierRequestError';
  }
}

/** Polling exceeded timeout-seconds without reaching a terminal status. */
export class PollTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PollTimeoutError';
  }
}
