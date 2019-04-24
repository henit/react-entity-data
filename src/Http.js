
// import 'whatwg-fetch';

let Http = {};

Http._fetch = (...args) => fetch(...args);

Http.request = async (options = {}) => {
  const {
    baseUrl,
    headers,
    method = 'GET',
    path = '',
    query = {},
    body,
    credentials = 'include',
    contentType = 'application/json'
  } = options;

  const url = baseUrl
    .concat(path)
    .concat(Object.keys(query).length > 0 ?
      '?' + Object.keys(query)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&')
      :
      '');

  let fetchHeaders = new Headers();
  if (headers) {
    for (let name in headers) {
      fetchHeaders.append(name, headers[name]);
    }
  }
  if (contentType && (!headers || !headers['Content-Type'])) {
    fetchHeaders.append('Content-Type', contentType);
  }

  let res;
  try {
    res = await Http._fetch(url, {
      headers: fetchHeaders,
      method,
      credentials,
      body: (contentType && contentType.includes('json')) ? JSON.stringify(body) : body
    });

  } catch (e) {
    let error = new Error('Can\'t connect to url.');
    error.statusCode = null;
    error.connectionError = true;
    throw error;
  }

  if (!res) {
    let error = new Error('No result from fetch');
    throw error;
  }

  const responseContentType = res.headers.get('Content-Type');
  const statusCode = res.status;

  const isJson = Boolean(responseContentType && (
    responseContentType.includes('application/json') || responseContentType.includes('application/hal+json')
  ));

  const response = await (isJson ? res.json() : res.text());

  if (statusCode >= 200 && statusCode <= 290) {
    // Success response
    return {
      statusCode,
      response,
      error: null
    };

  } else {
    // Error response
    if (isJson) {
      let error = new Error(response.message || res.statusText);
      error.details = response.details;
      error.stack = response.stack;
      error.connectionError = false;
      error.statusCode = statusCode;
      throw error;

    } else {
      let error = new Error(res.statusText || 'Unknown request error');
      error.connectionError = false;
      error.statusCode = statusCode;
      throw error;
    }
  }
};

Http.get = (path, query, options = {}) =>
  Http.request({
    ...options,
    method: 'GET',
    path,
    query
  });

Http.post = (path, body, options = {}) =>
  Http.request({
    ...options,
    method: 'POST',
    path,
    body
  });

Http.put = (path, body, options = {}) =>
  Http.request({
    ...options,
    method: 'PUT',
    path,
    body
  });

Http.patch = (path, body, options = {}) =>
  Http.request({
    ...options,
    method: 'PATCH',
    path,
    body
  });

Http.delete = (path, query, options = {}) =>
  Http.request({
    ...options,
    method: 'DELETE',
    path,
    query
  });

export default Http;
