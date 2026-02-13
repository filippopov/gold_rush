import api from './api';

export async function fetchLatestMetals() {
  const response = await api.get('/metals/latest');
  return response.data;
}

export async function fetchMetalHistory(symbol, limit = 30) {
  const response = await api.get('/metals/history', {
    params: { symbol, limit },
  });

  return response.data;
}
