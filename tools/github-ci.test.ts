import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parse} from 'yaml';
describe('ordinary CI trust boundary', () => {
  it('cannot request release credentials, write access or execute privileged fork events', () => {
    const text = readFileSync('.github/workflows/ci.yml','utf8');
    const ci = parse(text);
    expect(ci.permissions).toEqual({contents: 'read'});
    expect(Object.keys(ci.on).sort()).toEqual(['pull_request','push']);
    expect(text).not.toMatch(/pull_request_target|secrets\.|id-token:|packages:\s*write|persist-credentials:\s*true|environment:|docker\s+push|cosign|--push/);
    for (const job of Object.values(ci.jobs) as {steps: {uses?: string}[]; permissions?: unknown}[]) {
      expect(job.permissions).toBeUndefined();
      for (const step of job.steps) if (step.uses) expect(step.uses).toMatch(/@[a-f0-9]{40}$/);
    }
  });
});
