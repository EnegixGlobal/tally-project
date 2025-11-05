export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const token = localStorage.getItem('token');

  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const newInit = {
    ...init,
    headers,
  };

  const response = await fetch(input, newInit);

  if (response.status === 401) {
    // Handle Unauthorized globally (optional)
    alert('Session expired or unauthorized. Please login again.');
    // e.g., window.location.href = '/login';
  }

  if (!response.ok) {
    // Optionally throw or handle other errors
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Network response was not ok');
  }

  // Return parsed JSON data
  return response.json();
}
