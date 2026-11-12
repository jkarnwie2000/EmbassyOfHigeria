/** Browser fetch helper. Throws ApiClientError carrying the server's message and field details. */
export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

export async function apiFetch(url, { method = 'GET', body, headers } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError('Network error. Please check your connection and try again.', 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    throw new ApiClientError(data?.error || `Request failed (${res.status})`, res.status, data?.details);
  }
  return data;
}

/** Upload with progress events (fetch has no upload progress). */
export function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiClientError(data?.error || `Upload failed (${xhr.status})`, xhr.status, data?.details));
    };
    xhr.onerror = () => reject(new ApiClientError('Network error during upload.', 0));
    xhr.send(formData);
  });
}

/** Applies server field errors ({"a.b": msg}) to a react-hook-form instance. */
export function applyServerErrors(setError, details, prefix = '') {
  for (const [key, message] of Object.entries(details || {})) {
    const name = prefix && key.startsWith(prefix + '.') ? key.slice(prefix.length + 1) : key;
    setError(name, { type: 'server', message: String(message) });
  }
}
