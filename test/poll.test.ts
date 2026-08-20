import { PollTimeoutError, VerifierRequestError } from '../src/errors';
import { pollStatus } from '../src/poll';

describe('pollStatus', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it('stops on a terminal state and does not poll again', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'verified' }),
    });

    const result = await pollStatus({
      verifierUrl: 'https://verifier.example.com',
      submissionId: 'sub-1',
      timeoutSeconds: 60,
      sleep: jest.fn().mockResolvedValue(undefined),
    });

    expect(result.status).toBe('verified');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps polling through pending states until a terminal one arrives', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'mismatch' }) });

    const sleep = jest.fn().mockResolvedValue(undefined);
    const result = await pollStatus({
      verifierUrl: 'https://verifier.example.com',
      submissionId: 'sub-2',
      timeoutSeconds: 60,
      sleep,
    });

    expect(result.status).toBe('mismatch');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('respects timeout-seconds and throws PollTimeoutError distinct from a verification failure', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'pending' }) });

    let simulatedTime = 0;
    const sleep = jest.fn().mockImplementation(async (ms: number) => {
      simulatedTime += ms;
    });

    await expect(
      pollStatus({
        verifierUrl: 'https://verifier.example.com',
        submissionId: 'sub-3',
        timeoutSeconds: 30,
        intervalSeconds: 15,
        sleep,
        now: () => simulatedTime,
      }),
    ).rejects.toThrow(PollTimeoutError);

    await expect(
      pollStatus({
        verifierUrl: 'https://verifier.example.com',
        submissionId: 'sub-3',
        timeoutSeconds: 30,
        intervalSeconds: 15,
        sleep,
        now: () => simulatedTime,
      }),
    ).rejects.toThrow(/not that verification failed/);
  });

  it('throws VerifierRequestError on a non-ok HTTP response while polling', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });

    await expect(
      pollStatus({
        verifierUrl: 'https://verifier.example.com',
        submissionId: 'sub-4',
        timeoutSeconds: 60,
        sleep: jest.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow(VerifierRequestError);
  });
});
