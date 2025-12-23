// import http from "k6/http";
// import { check, sleep } from "k6";
// import { Counter } from "k6/metrics";

// // ===== Config =====
// const BASE = __ENV.BASE_URL || "https://bdris-dashboard-qa-api.mpower-social.com";
// //const BASE = __ENV.BASE_URL || "https://dashboard.bdris.gov.bd/apiserver";
// const ENDPOINT = `${BASE}/rest/api/login/otp`;

// const LOGIN_USERNAME = __ENV.LOGIN_USERNAME || "superadmin"; // avoid Windows USERNAME env var
// const MOBILE = __ENV.MOBILE || "mehedi@mpower-social.com";

// // Start barrier (so VUs hit at the same moment)
// const START_DELAY_MS = Number(__ENV.START_DELAY_MS || 3000);

// // Bucket settings (to locate where failures start)
// const BUCKET_SIZE = Number(__ENV.BUCKET_SIZE || 100); // 20k VUs -> 200 buckets

// // Headers that matched your Postman success
// const ORIGIN = __ENV.ORIGIN || "https://bdris-dashboard-qa.mpower-social.com";
// const REFERER = __ENV.REFERER || "https://bdris-dashboard-qa.mpower-social.com/";
// //const ORIGIN = __ENV.ORIGIN || "https://dashboard.bdris.gov.bd";
// //const REFERER = __ENV.REFERER || "https://dashboard.bdris.gov.bd/";
// const PASSWORD_HEADER = __ENV.PASSWORD || "Test@123";
// const USER_AGENT = __ENV.USER_AGENT || "Mozilla/5.0";

// // ===== Metrics =====
// const otp_success = new Counter("otp_success"); // tagged by bucket
// const otp_failed = new Counter("otp_failed");   // tagged by bucket + status_code

// export const options = {
//   discardResponseBodies: true,
//   scenarios: {
//     burst: {
//       executor: "per-vu-iterations",
//       vus: Number(__ENV.VUS) || 100,       // set 20000 when ready
//       iterations: 1,                       // each VU hits once
//       maxDuration: __ENV.MAX_DURATION || "5m",
//     },
//   },
// };

// const params = {
//   headers: {
//     accept: "application/json, text/plain, */*",
//     "content-type": "application/json",
//     origin: ORIGIN,
//     referer: REFERER,
//     "user-agent": USER_AGENT,
//     password: PASSWORD_HEADER, // remove if your backend doesn’t require it
//   },
//   timeout: "30s",
// };

// export function setup() {
//   const startAt = Date.now() + START_DELAY_MS;
//   console.log(`Burst test armed. All VUs will fire at ~${new Date(startAt).toISOString()} (delay ${START_DELAY_MS}ms)`);
//   return { startAt };
// }

// export default function (data) {
//   // Barrier: wait until startAt so the hit is concurrent
//   const waitMs = data.startAt - Date.now();
//   if (waitMs > 0) sleep(waitMs / 1000);

//   const bucketId = Math.floor((__VU - 1) / BUCKET_SIZE) + 1;
//   const bucketLabel = `B${bucketId}`; // e.g., B1, B2...

//   const res = http.post(
//     ENDPOINT,
//     JSON.stringify({ username: LOGIN_USERNAME, mobile: MOBILE }),
//     params
//   );

//   const ok = check(res, {
//     "OTP 200/201": (r) => r.status === 200 || r.status === 201,
//   });

//   if (ok) {
//     otp_success.add(1, { bucket: bucketLabel });
//   } else {
//     otp_failed.add(1, { bucket: bucketLabel, code: String(res.status) });
//   }
// }

// // ---- Summary parsing helpers (bucketed) ----
// function readSubmetrics(metric) {
//   const sub = metric?.submetrics;
//   if (!sub) return [];
//   const entries = Array.isArray(sub) ? sub : Object.values(sub);
//   return entries
//     .map((sm) => ({
//       tags: sm?.tags || sm?.metric?.tags || {},
//       count: sm?.values?.count ?? 0,
//     }))
//     .filter((x) => x.count > 0);
// }

// export function handleSummary(data) {
//   const succ = data.metrics?.otp_success?.values?.count ?? 0;
//   const fail = data.metrics?.otp_failed?.values?.count ?? 0;
//   const total = succ + fail;
//   const rate = total ? ((succ / total) * 100).toFixed(2) : "0.00";

//   // find first bucket that has failures
//   const failSubs = readSubmetrics(data.metrics?.otp_failed);
//   const failByBucket = new Map(); // bucket -> total fails
//   const codeByBucket = new Map(); // bucket -> Map(code -> count)

//   for (const x of failSubs) {
//     const b = x.tags.bucket || "unknown";
//     const c = x.tags.code || "unknown";
//     failByBucket.set(b, (failByBucket.get(b) || 0) + x.count);

//     if (!codeByBucket.has(b)) codeByBucket.set(b, new Map());
//     const m = codeByBucket.get(b);
//     m.set(c, (m.get(c) || 0) + x.count);
//   }

//   const bucketsSorted = [...failByBucket.keys()].sort((a, b) => {
//     const na = Number(a.replace("B", "")) || 0;
//     const nb = Number(b.replace("B", "")) || 0;
//     return na - nb;
//   });

//   const firstFailBucket = bucketsSorted.length ? bucketsSorted[0] : null;

//   let firstFailRange = "N/A";
//   if (firstFailBucket) {
//     const bNum = Number(firstFailBucket.replace("B", ""));
//     const startVU = (bNum - 1) * BUCKET_SIZE + 1;
//     const endVU = bNum * BUCKET_SIZE;
//     firstFailRange = `${startVU}–${endVU}`;
//   }

//   // Build tiny table for up to 10 failing buckets
//   const rows = bucketsSorted.slice(0, 10).map((b) => {
//     const totalFails = failByBucket.get(b) || 0;
//     const codes = codeByBucket.get(b) || new Map();
//     // pick top code for that bucket
//     let topCode = "-";
//     let topCount = 0;
//     for (const [code, cnt] of codes.entries()) {
//       if (cnt > topCount) { topCount = cnt; topCode = code; }
//     }
//     return `<tr><td>${b}</td><td>${totalFails}</td><td>${topCode}</td></tr>`;
//   }).join("");

//   const html = `<!doctype html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <title> BDRIS Dashboard Login Report</title>
//   <style>
//     body { font-family: Arial, sans-serif; margin: 24px; }
//     .row { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
//     .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px 16px; min-width: 220px; }
//     .label { color: #666; font-size: 13px; }
//     .value { font-size: 36px; font-weight: 700; margin-top: 6px; }
//     table { border-collapse: collapse; margin-top: 12px; min-width: 360px; }
//     th, td { border: 1px solid #eee; padding: 8px 10px; text-align: left; }
//     th { background: #fafafa; }
//     code { background:#f6f8fa; padding:2px 6px; border-radius:6px; }
//   </style>
// </head>
// <body>
//   <h1> BDRIS Dashboard Login Report</h1>
//   <div>Endpoint: <code>${ENDPOINT}</code></div>

//   <div class="row">
//     <div class="card"><div class="label">Successful</div><div class="value">${succ}</div></div>
//     <div class="card"><div class="label">Failed</div><div class="value">${fail}</div></div>
//     <div class="card"><div class="label">Success rate</div><div class="value">${rate}%</div></div>
//   </div>

// </body>
// </html>`;

//   return { "login-report.html": html };
// }


import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

// ===== Config =====
const BASE = __ENV.BASE_URL || "https://bdris-dashboard-qa-api.mpower-social.com";
const ENDPOINT = `${BASE}/rest/api/login/otp`;

const LOGIN_USERNAME = __ENV.LOGIN_USERNAME || "superadmin"; // avoid Windows USERNAME env var
const MOBILE = __ENV.MOBILE || "mehedi@mpower-social.com";

// Start barrier (so VUs hit at the same moment)
const START_DELAY_MS = Number(__ENV.START_DELAY_MS || 3000);

// Headers that matched your Postman success
const ORIGIN = __ENV.ORIGIN || "https://bdris-dashboard-qa.mpower-social.com";
const REFERER = __ENV.REFERER || "https://bdris-dashboard-qa.mpower-social.com/";
const PASSWORD_HEADER = __ENV.PASSWORD || "Test@123";
const USER_AGENT = __ENV.USER_AGENT || "Mozilla/5.0";

// ===== Metrics =====
const otp_success = new Counter("otp_success");
const otp_failed = new Counter("otp_failed");

export const options = {
  discardResponseBodies: true,
  scenarios: {
    burst: {
      //executor: "shared-iterations",
      executor: "per-vu-iterations",
      vus: 6000,
      iterations: 1, // each VU hits once
      maxDuration: "5m",
    },
  },
};

const params = {
  headers: {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    origin: ORIGIN,
    referer: REFERER,
    "user-agent": USER_AGENT,
    password: PASSWORD_HEADER, // remove if backend doesn’t require it
  },
  timeout:  "60s",
};

export function setup() {
  const startAt = Date.now() + START_DELAY_MS;
  console.log(
    `Burst test armed. All VUs will fire at ~${new Date(startAt).toISOString()} (delay ${START_DELAY_MS}ms)`
  );
  return { startAt };
}

export default function (data) {
  // Barrier: wait until startAt so the hit is concurrent
  const waitMs = data.startAt - Date.now();
  if (waitMs > 0) sleep(waitMs / 1000);

  const payload = JSON.stringify({ username: LOGIN_USERNAME, mobile: MOBILE });

  const res = http.post(ENDPOINT, payload, params);

  const ok = check(res, {
    "OTP 200/201": (r) => r.status === 200 || r.status === 201,
  });

  if (ok) {
    otp_success.add(1);
    return;
  }

  // ---- FAIL PATH: print to command line (only failures) ----
  otp_failed.add(1);

  // "Hit number": with iterations=1, hit == VU; if you later increase iterations, use VU+ITER together
  const hit = __VU; // since iterations=1
  const iter = __ITER;

  const dur = res.timings?.duration ?? -1;
  const err = res.error ? ` error="${res.error}"` : "";
  const errCode = res.error_code ? ` error_code=${res.error_code}` : "";

  console.error(
    `[FAIL] hit=${hit} iter=${iter} status=${res.status}${errCode} durationMs=${dur} url=${res.url}${err}`
  );
}

// Optional simple HTML report (no bucket logic, no per-hit info)
export function handleSummary(data) {
  const succ = data.metrics?.otp_success?.values?.count ?? 0;
  const fail = data.metrics?.otp_failed?.values?.count ?? 0;
  const total = succ + fail;
  const rate = total ? ((succ / total) * 100).toFixed(2) : "0.00";

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>BDRIS Dashboard Login Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px 16px; min-width: 220px; }
    .label { color: #666; font-size: 13px; }
    .value { font-size: 36px; font-weight: 700; margin-top: 6px; }
    code { background:#f6f8fa; padding:2px 6px; border-radius:6px; }
  </style>
</head>
<body>
  <h1>BDRIS Dashboard Login Report</h1>
  <div>Endpoint: <code>${ENDPOINT}</code></div>

  <div class="row">
    <div class="card"><div class="label">Successful</div><div class="value">${succ}</div></div>
    <div class="card"><div class="label">Failed</div><div class="value">${fail}</div></div>
    <div class="card"><div class="label">Success rate</div><div class="value">${rate}%</div></div>
  </div>
</body>
</html>`;

  return { "login-report.html": html };
}
