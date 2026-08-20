import { ValidationError } from './errors';

// Soroban/Stellar contract addresses are 56-character base32 strings starting with 'C'.
const CONTRACT_ID_PATTERN = /^C[A-Z2-7]{55}$/;

export function validateVerifierUrl(value: string): string {
  if (!value || value.trim().length === 0) {
    throw new ValidationError('verifier-url must not be empty.');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ValidationError(`verifier-url is not a valid URL: "${value}".`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ValidationError(
      `verifier-url must use http or https, got "${url.protocol}" in "${value}".`,
    );
  }

  return value.replace(/\/+$/, '');
}

export function validateContractId(value: string): string {
  if (!value || value.trim().length === 0) {
    throw new ValidationError('contract-id must not be empty.');
  }

  if (!CONTRACT_ID_PATTERN.test(value)) {
    throw new ValidationError(
      `contract-id "${value}" is not well-formed. Expected a 56-character contract address starting with "C".`,
    );
  }

  return value;
}

export function validateSourceRepo(value: string): string {
  if (!/^[^/\s]+\/[^/\s]+$/.test(value)) {
    throw new ValidationError(
      `source-repo "${value}" is not well-formed. Expected "owner/repo".`,
    );
  }

  return value;
}

export function validateSourceRev(value: string): string {
  if (!/^[0-9a-f]{7,40}$/i.test(value)) {
    throw new ValidationError(
      `source-rev "${value}" is not well-formed. Expected a commit SHA.`,
    );
  }

  return value;
}
