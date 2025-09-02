export const options = {
  //stages: [
    //{ duration: "1m", target: 20 }, // ramp-up to 20 users
    //{ duration: "5m", target: 50 }, // stay at 50 users for 5 minutes
    //{ duration: "1m", target: 0 }, // ramp-down to 0 users
  //],
  //thresholds: {
    //http_req_duration: ["avg<100", "p(95)<200"],
  //},
  //noConnectionReuse: false,
    executor: 'shared-iterations',
    vus: 2,
    //duration : '5s',
    iterations : 2,
    maxDuration: '10s',
};