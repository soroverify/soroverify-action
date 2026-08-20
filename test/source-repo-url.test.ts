import { mockActionsModules, setInputs, VALID_CONTRACT_ID } from './helpers';

describe('run: source-repo URL construction', () => {
  let fetchMock: jest.Mock;
  let setFailedMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    setFailedMock = jest.fn();
    mockActionsModules(setFailedMock);
  });

  it('sends a full https://github.com URL for an owner/repo source-repo input', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
      'source-repo': 'owner/repo',
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ submissionId: 'sub-url' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'verified' }) });

    const { run } = await import('../src/index');
    await run();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const submitCall = fetchMock.mock.calls[0] as [string, { body: string }];
    const requestBody = JSON.parse(submitCall[1].body) as { sourceRepo: string };
    expect(requestBody.sourceRepo).toBe('https://github.com/owner/repo');
  });

  it('falls back to the current repository as a full URL when source-repo is not given', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ submissionId: 'sub-default' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'verified' }) });

    const { run } = await import('../src/index');
    await run();

    const submitCall = fetchMock.mock.calls[0] as [string, { body: string }];
    const requestBody = JSON.parse(submitCall[1].body) as { sourceRepo: string };
    expect(requestBody.sourceRepo).toBe('https://github.com/soroverify/demo');
  });
});
