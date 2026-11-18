const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Cannot reach the local ActuariaAI API. Start the FastAPI backend on port 8000.');
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const detail = typeof body?.detail === 'string'
      ? body.detail
      : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }
  return body;
}

export function fetchHealth() {
  return request('/health');
}

export function predictClaim(policyholder) {
  return request('/predict', {
    method: 'POST',
    body: JSON.stringify(policyholder)
  });
}

export function fetchModelsMetrics() {
  return request('/models');
}

export function fetchRiskSegmentation() {
  return request('/segmentation');
}

export function fetchDatasetSummary() {
  return request('/dataset');
}

export function simulatePortfolioBatch(policies) {
  return request('/portfolio/simulate', {
    method: 'POST',
    body: JSON.stringify({ policies })
  });
}

export function fetchUnderwritingRules() {
  return request('/actuarial/underwriting-rules');
}
