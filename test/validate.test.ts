import { ValidationError } from '../src/errors';
import {
  validateContractId,
  validateSourceRepo,
  validateSourceRev,
  validateVerifierUrl,
} from '../src/validate';

describe('validateContractId', () => {
  const validId = 'C'.padEnd(56, 'A');

  it('accepts a well-formed contract id', () => {
    expect(validateContractId(validId)).toBe(validId);
  });

  it('rejects an empty contract id', () => {
    expect(() => validateContractId('')).toThrow(ValidationError);
  });

  it('rejects a contract id with the wrong length', () => {
    expect(() => validateContractId('CTOOSHORT')).toThrow(ValidationError);
  });

  it('rejects a contract id that does not start with C', () => {
    const malformed = 'A'.padEnd(56, 'A');
    expect(() => validateContractId(malformed)).toThrow(ValidationError);
  });

  it('rejects a contract id with invalid characters', () => {
    const malformed = 'C' + '1'.repeat(55);
    expect(() => validateContractId(malformed)).toThrow(ValidationError);
  });
});

describe('validateVerifierUrl', () => {
  it('accepts a well-formed https URL and strips trailing slashes', () => {
    expect(validateVerifierUrl('https://verifier.example.com/')).toBe(
      'https://verifier.example.com',
    );
  });

  it('rejects an empty URL', () => {
    expect(() => validateVerifierUrl('')).toThrow(ValidationError);
  });

  it('rejects a malformed URL', () => {
    expect(() => validateVerifierUrl('not a url')).toThrow(ValidationError);
  });

  it('rejects a non-http(s) protocol', () => {
    expect(() => validateVerifierUrl('ftp://verifier.example.com')).toThrow(ValidationError);
  });
});

describe('validateSourceRepo', () => {
  it('accepts owner/repo', () => {
    expect(validateSourceRepo('soroverify/soroverify-action')).toBe(
      'soroverify/soroverify-action',
    );
  });

  it('rejects a repo without an owner', () => {
    expect(() => validateSourceRepo('soroverify-action')).toThrow(ValidationError);
  });
});

describe('validateSourceRev', () => {
  it('accepts a short SHA', () => {
    expect(validateSourceRev('abc1234')).toBe('abc1234');
  });

  it('accepts a full SHA', () => {
    const sha = 'a'.repeat(40);
    expect(validateSourceRev(sha)).toBe(sha);
  });

  it('rejects a non-hex value', () => {
    expect(() => validateSourceRev('not-a-sha')).toThrow(ValidationError);
  });
});
