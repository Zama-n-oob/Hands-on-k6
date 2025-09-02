import http from 'k6/http'
import {sleep} from 'k6'
import {check} from 'k6'

export const options={
    executor: 'per-vu-iterations',
    vus: 2,
    iterations: 4,
    //duration : '1s'
}

export default function(){
    const url = 'https://reqres.in/api/users';
    const payload = JSON.stringify({
    "name": "morpheus",
    "job": "leader",
    }
    );
    const params = {
        headers : {
            'x-api-key': 'reqres-free-v1',
        }
    };
    const res = http.post(url, payload, params);
    console.log(JSON.stringify(res.body));
    check(res, {
        'is status code 201': (r) => r.status === 201,
        //'does response body has name': (r) => r.body.includes("morpheus"),
        //'does response body has name' : (r) => r.body.name("morpheus"),
        //'does response body has name' : (r) => JSON.stringify(r.body).includes("morpheus"),
    });
}
