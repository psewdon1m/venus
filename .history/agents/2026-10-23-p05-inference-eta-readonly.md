# Original05 inference runtime estimate — read only

2026-10-22T21:03:03.466363+00:00 — START. Scope actual original05 completed logs/ACK pending owners and configured original counts only. No Docker/test/native/APP/source/runner/caps/seeds/counts changes, no heavy work or new reviewpacket. Runtime estimate conditional on observed throughput; no invented progress/native state.
2026-10-22T21:03:32.411655+00:00 — Actual readonly snapshot:

```json
{
  "observed_at_utc": "2026-10-22T21:03:32.411655+00:00",
  "observed_at_istanbul": "2026-10-23T00:03:32.411655+03:00",
  "batch_terminal_exists": false,
  "STOP_exists": false,
  "carried_normal": 987,
  "new_completed_records": 536,
  "new_normal": 536,
  "new_FAIL": 0,
  "total_normal_completed_jobs": 1523,
  "total_original_jobs": 2609,
  "remaining_original_jobs": 1086,
  "pending_ACK_without_terminal_logs": [
    {
      "owner": "2e545012d23d47fbb0f7491478c0d7ca",
      "ordinal": 1532,
      "lane": 4,
      "range": {
        "section": "m3-inference",
        "start": 18300,
        "count": 100,
        "end": 18400
      },
      "ack_created_utc": "2026-10-22T21:01:33.373296+00:00",
      "ack_age_s": 119.038359
    },
    {
      "owner": "405a181055b244438ca9b730bf7e4edd",
      "ordinal": 1525,
      "lane": 5,
      "range": {
        "section": "m3-inference",
        "start": 17600,
        "count": 100,
        "end": 17700
      },
      "ack_created_utc": "2026-10-22T21:01:49.291297+00:00",
      "ack_age_s": 103.120358
    },
    {
      "owner": "9241e761aad94d4cbc04a1cad37db903",
      "ordinal": 1526,
      "lane": 6,
      "range": {
        "section": "m3-inference",
        "start": 17700,
        "count": 100,
        "end": 17800
      },
      "ack_created_utc": "2026-10-22T21:02:42.391862+00:00",
      "ack_age_s": 50.019793
    },
    {
      "owner": "977b611dc7284f2892bf5ecdd2332e1f",
      "ordinal": 1528,
      "lane": 0,
      "range": {
        "section": "m3-inference",
        "start": 17900,
        "count": 100,
        "end": 18000
      },
      "ack_created_utc": "2026-10-22T21:02:23.062032+00:00",
      "ack_age_s": 69.349623
    },
    {
      "owner": "a9de08d081184bd29f84b528b85558b5",
      "ordinal": 1515,
      "lane": 3,
      "range": {
        "section": "m3-inference",
        "start": 16600,
        "count": 100,
        "end": 16700
      },
      "ack_created_utc": "2026-10-22T21:01:17.995212+00:00",
      "ack_age_s": 134.416443
    },
    {
      "owner": "c4bed534143a423b9e75ae981147eb72",
      "ordinal": 1529,
      "lane": 1,
      "range": {
        "section": "m3-inference",
        "start": 18000,
        "count": 100,
        "end": 18100
      },
      "ack_created_utc": "2026-10-22T21:02:49.054194+00:00",
      "ack_age_s": 43.357461
    },
    {
      "owner": "f608ff803a344d5b835a7eb310c0b1f9",
      "ordinal": 1522,
      "lane": 2,
      "range": {
        "section": "m3-inference",
        "start": 17300,
        "count": 100,
        "end": 17400
      },
      "ack_created_utc": "2026-10-22T21:01:48.092212+00:00",
      "ack_age_s": 104.319443
    },
    {
      "owner": "fe835e5e50664d2ab69de069477cfec5",
      "ordinal": 1535,
      "lane": 7,
      "range": {
        "section": "m3-inference",
        "start": 18600,
        "count": 100,
        "end": 18700
      },
      "ack_created_utc": "2026-10-22T21:02:17.477826+00:00",
      "ack_age_s": 74.933829
    }
  ],
  "pending_ACK_is_not_live_Docker_state": true,
  "sections": {
    "c2-static": {
      "normal_completed_jobs": 10,
      "original_jobs": 10,
      "completed_case_observations_plus_accepted_prefix": 47040,
      "original_cases": 47040
    },
    "c2-trajectory": {
      "normal_completed_jobs": 370,
      "original_jobs": 370,
      "completed_case_observations_plus_accepted_prefix": 37072,
      "original_cases": 37072
    },
    "c2-canary": {
      "normal_completed_jobs": 3,
      "original_jobs": 3,
      "completed_case_observations_plus_accepted_prefix": 336,
      "original_cases": 336
    },
    "m3-invariants": {
      "normal_completed_jobs": 699,
      "original_jobs": 699,
      "completed_case_observations_plus_accepted_prefix": 70000,
      "original_cases": 70000
    },
    "m3-fairness": {
      "normal_completed_jobs": 168,
      "original_jobs": 168,
      "completed_case_observations_plus_accepted_prefix": 84000,
      "original_cases": 84000
    },
    "m3-gf": {
      "normal_completed_jobs": 100,
      "original_jobs": 100,
      "completed_case_observations_plus_accepted_prefix": 1000000,
      "original_cases": 1000000
    },
    "m3-inference": {
      "normal_completed_jobs": 173,
      "original_jobs": 1259,
      "completed_case_observations_plus_accepted_prefix": 17400,
      "original_cases": 126000
    }
  },
  "inference_finished_jobs": 173,
  "inference_duration_median_s": 160.538,
  "inference_duration_min_s": 120.158,
  "inference_duration_max_s": 208.639,
  "recent_throughput_windows": [
    {
      "last_completed_jobs": 16,
      "first_finish": "2026-10-22T20:58:16.995Z",
      "last_finish": "2026-10-22T21:02:49.053Z",
      "elapsed_s": 272.058,
      "completed_job_intervals": 15,
      "jobs_per_hour": 198.48708731226432,
      "remaining_jobs": 1086,
      "remaining_wall_hours_at_same_throughput": 5.471388666666666,
      "duration_median_s": 194.6125
    },
    {
      "last_completed_jobs": 32,
      "first_finish": "2026-10-22T20:52:16.688Z",
      "last_finish": "2026-10-22T21:02:49.053Z",
      "elapsed_s": 632.365,
      "completed_job_intervals": 31,
      "jobs_per_hour": 176.48035549089528,
      "remaining_jobs": 1086,
      "remaining_wall_hours_at_same_throughput": 6.153659408602151,
      "duration_median_s": 165.322
    },
    {
      "last_completed_jobs": 64,
      "first_finish": "2026-10-22T20:42:22.348Z",
      "last_finish": "2026-10-22T21:02:49.053Z",
      "elapsed_s": 1226.705,
      "completed_job_intervals": 63,
      "jobs_per_hour": 184.88552667511752,
      "remaining_jobs": 1086,
      "remaining_wall_hours_at_same_throughput": 5.873904894179893,
      "duration_median_s": 163.42849999999999
    }
  ],
  "estimate_conditions": "same8lanes/profile/case-mix/shared-host conditions, no interruption or failures; reducers/remainingUI/finalquality excluded"
}
```

No Docker/native/test/source mutations. PendingACK8 denotes started/nonterminal hostjobs, not independently observed liveDocker status. Estimate conditional and excludesreducers/UI/finalquality. COMPLETE_STOP.
