import { mockActionsModules, setInputs, VALID_CONTRACT_ID } from './helpers';

describe('run: verifier rejection error surfacing', () => {
  let fetchMock: jest.Mock;
  let setFailedMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    setFailedMock = jest.fn();
    mockActionsModules(setFailedMock);
  });

  it('surfaces the verifier error code and issues instead of a generic duplicated message', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
      'source-repo': 'owner/repo',
    });
    fetchMock.mockResolvedValueOnce({
      status: 400,
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        error: {
          code: 'validation_failed',
          issues: [
            {
              field: 'sourceRepo',
              reason: 'must be a plausible git URL (https://, git://, ssh://, or git@host:path)',
            },
          ],
        },
      }),
    });

    const { run } = await import('../src/index');
    await run();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).toHaveBeenCalledTimes(1);
    const [failureMessage] = setFailedMock.mock.calls[0] as [string];
    expect(failureMessage).toContain('validation_failed');
    expect(failureMessage).toContain('sourceRepo');
    expect(failureMessage).toContain('must be a plausible git URL');
    expect(failureMessage).not.toBe(
      'Verifier rejected the submission: The verifier rejected the submission.',
    );
  });
});
