import http from "k6/http";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export function postRequest(url, body, headers) {
  return http.post(url, body, { headers: headers });
}

export function getRequest(url, headers) {
  return http.get(url, { headers: headers });
}

export function deleteRequest(url, headers) {
  return http.del(url, null, { headers: headers });
}

export function handleSummary(data) {
  return {
    "report/test-summary.html": htmlReport(data, { debug: true }),
  };
}