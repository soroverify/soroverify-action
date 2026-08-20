import { mockActionsModules, setInputs, VALID_CONTRACT_ID } from './helpers';

describe('run: submission handling', () => {
  let fetchMock: jest.Mock;
  let setFailedMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    setFailedMock = jest.fn();
    mockActionsModules(setFailedMock);
  });

  it('rejects a malformed contract-id before any network call', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': 'not-well-formed',
    });

    const { run } = await import('../src/index');
    await run();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFailedMock).toHaveBeenCalledWith(expect.stringContaining('Invalid input'));
  });

  it('fails immediately with the verifier message on submission rejection (400) and does not retry', async () => {
    setInputs({
      'verifier-url': 'https://verifier.example.com',
      'contract-id': VALID_CONTRACT_ID,
    });
    fetchMock.mockResolvedValueOnce({
      status: 400,
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({ message: 'contract-id is not deployed on this network' }),
    });

    const { run } = await import('../src/index');
    await run();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).toHaveBeenCalledWith(
      'Verifier rejected the submission: contract-id is not deployed on this network',
    );
  });
});
