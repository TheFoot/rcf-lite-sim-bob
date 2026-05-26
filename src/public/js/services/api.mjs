const BASE_URL = `${window.location.origin}/api/v1`;

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: res.statusText };
    }
    throw Object.assign(new Error(errorBody.message || `HTTP ${res.status}`), {
      status: res.status,
      body: errorBody,
    });
  }

  return res.json();
}

export function get(path) {
  return request('GET', path);
}

export function post(path, body) {
  return request('POST', path, body);
}

export function put(path, body) {
  return request('PUT', path, body);
}

export function del(path) {
  return request('DELETE', path);
}
