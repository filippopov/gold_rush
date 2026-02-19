import api from './api';

export async function fetchHoldings() {
  const response = await api.get('/holdings');
  return response.data;
}

export async function upsertHolding(symbol, payload) {
  const response = await api.put(`/holdings/${encodeURIComponent(symbol)}`, payload);

  return response.data;
}
