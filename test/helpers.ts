export const VALID_CONTRACT_ID = 'C'.padEnd(56, 'A');

export function setInputs(inputs: Record<string, string>): void {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('INPUT_')) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(inputs)) {
    process.env[`INPUT_${key.replace(/-/g, '_').toUpperCase()}`] = value;
  }
}

export function mockActionsModules(setFailedMock: jest.Mock): void {
  jest.doMock('@actions/core', () => ({
    getInput: (name: string) => {
      const key = `INPUT_${name.replace(/-/g, '_').toUpperCase()}`;
      return process.env[key] ?? '';
    },
    setFailed: setFailedMock,
    setOutput: jest.fn(),
    info: jest.fn(),
  }));
  jest.doMock('@actions/github', () => ({
    context: { repo: { owner: 'soroverify', repo: 'demo' }, sha: 'a'.repeat(40) },
  }));
}
