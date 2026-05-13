const API_BASE_URL = "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || "Request failed";
    throw new Error(message);
  }

  return data;
}

export { API_BASE_URL, request };
