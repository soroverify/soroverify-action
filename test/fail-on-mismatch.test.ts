import { mockActionsModules, setInputs, VALID_CONTRACT_ID } from './helpers';

describe('run: fail-on-mismatch behavior', () => {
  let fetchMock: jest.Mock;
  let setFailedMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    setFailedMock = jest.fn();
    mockActionsModules(setFailedMock);
  });

  it('succeeds and only sets the output when fail-on-mismatch is false, even on a mismatch result', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
      'fail-on-mismatch': 'false',
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ submissionId: 'sub-2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'mismatch' }) });

    const { run } = await import('../src/index');
    await run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('fails with a message stating what was found when fail-on-mismatch is true and the result is mismatch', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ submissionId: 'sub-3' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'mismatch' }) });

    const { run } = await import('../src/index');
    await run();

    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining('Verification found a mismatch'),
    );
  });

  it('succeeds regardless of fail-on-mismatch when the result is inconclusive', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ submissionId: 'sub-4' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'inconclusive' }) });

    const { run } = await import('../src/index');
    await run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
