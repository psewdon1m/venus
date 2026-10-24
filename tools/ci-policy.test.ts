import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parse} from 'yaml';
it('uses one PR head CI event, preserves full required checks and immutable action pins',()=>{
  const workflow=parse(readFileSync('.github/workflows/ci.yml','utf8'));
  expect(workflow.on.push.branches).toEqual(['main']);expect(workflow.on.pull_request.branches).toEqual(['main']);
  expect(Object.keys(workflow.on).sort()).toEqual(['pull_request','push']);
  expect(Object.keys(workflow.jobs).sort()).toEqual(['container-smoke','p02-integration','p03-integration','p06-release-integration','quality']);
  const statistics=parse(readFileSync('.github/workflows/p03-statistics.yml','utf8'));
  expect(Object.keys(statistics.on)).toEqual(['workflow_dispatch']);
  expect(Object.keys(statistics.jobs)).toEqual(['p03-measurements']);
  expect(statistics.jobs['p03-measurements'].strategy.matrix.section).toEqual(['invariants','fairness','gf','inference']);
  expect(statistics.jobs['p03-measurements']['timeout-minutes']).toBeGreaterThanOrEqual(120);
  for(const step of statistics.jobs['p03-measurements'].steps.filter((s:{uses?:string})=>s.uses)) expect(step.uses).toMatch(/@[a-f0-9]{40}$/);
  expect(workflow.jobs['p03-integration'].steps.some((s:{run?:string})=>s.run==='npm run test:p04')).toBe(true);
  expect(workflow.jobs['p03-integration'].steps.some((s:{with?:{name?:string;path?:string}})=>s.with?.name==='p04-integration'&&s.with.path==='.artifacts/p04/')).toBe(true);
  for(const job of Object.values(workflow.jobs) as {steps:{uses?:string;with?:Record<string,unknown>}[]}[]) {
    const checkout=job.steps.find(step=>step.uses?.startsWith('actions/checkout@'))!;
    expect(checkout.with?.ref).toBe('${{ github.event.pull_request.head.sha || github.sha }}');expect(checkout.with?.['fetch-depth']).toBe(0);
    for(const step of job.steps.filter(s=>s.uses)) expect(step.uses).toMatch(/@[a-f0-9]{40}$/);
  }
});
