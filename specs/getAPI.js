import http from 'k6/http'
import {check} from 'k6'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"

export const options={
    //executor: 'shared-iterations',
    vus: 1,
    duration : '60s',
    iterations : 200,
    //maxDuration: '60s',
}

export default function(){
  const url = 'http://hadashboard.mpower-social.com';
  const res = http.get(url);

  const success = check(res, {
    'is status code 200': (r) => r.status === 200,
  });

  if (!success) {
      console.log(`Failed with status code: ${res.status}`);
      //failedStatusCodes.push(res.status);
  }
}

// export default function(){
//     const url = 'https://reqres.in/api/users/2';
//     const params = {
//         headers : {
//             'x-api-key': 'reqres-free-v1',
//         }
//     };
//     const res = http.get(url, params);
    
//     check(res, {
//             'is status code 200': (r) => r.status === 200,
//         });
// }

export function handleSummary(data) {
  //data.failedStatusCodes = failedStatusCode;
  return {
    "TestSummaryReport.html": htmlReport(data, { debug: true }),
    //stdout: JSON.stringify({ failedStatusCodes }, null, 2),
  };
}
