import http from 'k6/http'
import {check} from 'k6'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"

export const options={
    //executor: 'shared-iterations',
    vus: 1000,
    duration : '30s',
    iterations : 1000,
    //maxDuration: '60s',
}

export default function(){
  const url = 'https://jitsitest.mpower-social.com/AdministrativeHistoriansVanishWorst';
  const res = http.get(url);

  const success = check(res, {
    'is status code 200': (r) => r.status === 200,
  });

  if (!success) {
      console.log(`Failed with status code: ${res.status}`);
      //failedStatusCodes.push(res.status);
  }
}

export function handleSummary(data) {
  //data.failedStatusCodes = failedStatusCode;
  return {
    "TestSummaryReport.html": htmlReport(data, { debug: true })
    //stdout: JSON.stringify({ failedStatusCodes }, null, 2),
  };
}