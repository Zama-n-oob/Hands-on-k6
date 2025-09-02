import { check , sleep } from 'k6'
import { options } from '../k6.config.js'
import { baseURL } from '../config/config.js'
import { postRequest, deleteRequest, handleSummary } from '../support/helpers.js'
import { createUserBody } from '../data/userBody.js'
import { createProductBody } from '../data/productBody.js'
import { createCartBody } from '../data/cartBody.js'

export { options };

export default function(){
    let result;
    
    //Create a user
    const userBody = createUserBody()
    result = postRequest(`${baseURL}/usuarios`, JSON.stringify(userBody), {
        "Content-Type": "application/json",
    });
    check(result, { "POST /usuarios status was 201": (r) => r.status === 201 });
    sleep(1);

    //Login
    result = postRequest(
    `${baseURL}/login`,
    JSON.stringify({
      email: userBody.email,
      password: userBody.password,
    }),{
        "Content-Type": "application/json",
    });
    check(result, { "POST /login status was 200": (r) => r.status === 200 });
    const authToken = result.json().authorization;
    sleep(1);

    // Create a product
    const productBody = createProductBody();
    result = postRequest(`${baseURL}/produtos`, JSON.stringify(productBody), {
        "Content-Type": "application/json",
        Authorization: authToken,
    });
    check(result, { "POST /produtos status was 201": (r) => r.status === 201 });
    const productId = result.json()._id;
    sleep(1);

    // Create a cart
    const cartBody = createCartBody(productId);
    result = postRequest(`${baseURL}/carrinhos`, JSON.stringify(cartBody), {
        "Content-Type": "application/json",
        Authorization: authToken,
    });
    check(result, { "POST /carrinhos status was 201": (r) => r.status === 201 });
    sleep(1);

    // Delete a cart
    result = deleteRequest(`${baseURL}/carrinhos/concluir-compra`, {
        Authorization: authToken,
    });
    check(result, {
        "DELETE /carrinhos/concluir-compra status was 200": (r) => r.status === 200,
    });
}

export { handleSummary };