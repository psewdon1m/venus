from pathlib import Path
p=Path(__file__).resolve().parent
s=(p.parent/'a17-truthdare-cohorts-actual-independent-round01/audit.mjs').read_text()
for a,b in [
 ('truth_or_dare','yes_but'),('TRUTH_OR_DARE','YES_BUT'),
 ('venus-pilot470-e16f4b63eec3','venus-pilot470-c236b59884cb'),('venus-pilot470-d5c45d4bec58','venus-pilot470-4d7342b7925c'),
 ('online-truthdare01','online-yesbut01'),('inperson-truthdare01','inperson-yesbut01'),
 ("assert.deepEqual(report.negative_profiles,negativeProfiles(cohort));","assert.deepEqual(report.negative_profiles.map(({context,mode,N,relation})=>({context,mode,N,relation})),negativeProfiles(cohort));assert.equal(report.negative_profiles.length,1);assert.equal(report.negative_profiles[0].status,'PASS');assert.equal(report.negative_profiles[0].code,'TOPIC_SAFE_POOL_EXHAUSTED');"),
 ("['completed_rounds','finishes','choices']","['completed_rounds','finishes','conditions']"),
 ("for(const k of ['rooms_created','rooms_closed','locales_checked_sessions'])assert.equal(report[k],7);","for(const k of ['rooms_created','rooms_closed'])assert.equal(report[k],8);assert.equal(report.locales_checked_sessions,7);"),
 ('assert.equal(report.WS_connections,35)','assert.equal(report.WS_connections,37)'),('assert.equal(report.requests,4647)','assert.equal(report.requests,5551)'),
 ('assert.equal(report.conditions,0)','assert.equal(report.choices,0)'),
 ("assert.equal(diag.length,spec.context==='online'?0:1)","assert.equal(diag.length,0)"),
 ('requests:4647,WS_connections:35,rooms_created_closed:7','requests:5551,WS_connections:37,rooms_created_closed:8'),
 ('choices:140,locale_sessions:7','conditions:140,separate_all_X_negative:report.negative_profiles[0],locale_sessions:7'),
 ('34fa6ecdf8fe3024f257faa0448ef87d43b8294cae769c725995c5ed26174d23','b16a31a77caa8eba725a92083963c275f8f5c1dac7f751bec8508e8d7da04c6a'),
 ('Object.keys(op.files).length,16','Object.keys(op.files).length,18'),
 ('requests:9294,WS_connections:70,rooms_created_closed:14','requests:11102,WS_connections:74,rooms_created_closed:16,distinct_positive_rooms_sessions:14,separate_all_X_negatives:2'),
 ]:
 assert a in s,a
 s=s.replace(a,b)
s=s.replace("assert.equal(descriptor.matrix_expected_completed_rounds,840);","assert.equal(descriptor.matrix_expected_completed_rounds,840);assert.equal(descriptor.matrix_negative_profiles,2);assert.equal(descriptor.rate_schedule.negative_profile_deadline_ms,90000);")
# Empty diagnostics in both runs: preserve emptiness, without carrying TD's event expectations.
start=s.index("for(const event of diag){")
end=s.index("\n const lines=",start)
s=s[:start]+s[end:]
(p/'audit.mjs').write_text(s,encoding='utf-8')
print('Prepared read-only YB audit from preserved TD audit; no original file edited.')
