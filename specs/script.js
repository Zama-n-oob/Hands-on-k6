import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
    vus: 5,
    duration: '10s',
};

export default function () {
    let res = http.get('https://httpbin.test.k6.io/get');

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
