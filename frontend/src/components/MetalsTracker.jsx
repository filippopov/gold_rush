import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLatestMetals, fetchMetalHistory } from '../services/metals';

const AUTO_REFRESH_INTERVAL_MS = 60_000;
const HISTORY_LIMIT_OPTIONS = [30, 60, 120];

function MetalsTracker() {
  const [metals, setMetals] = useState([]);
  const [metalsLoading, setMetalsLoading] = useState(true);
  const [metalsError, setMetalsError] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedHistoryLimit, setSelectedHistoryLimit] = useState(30);
  const [lastMetalsRefreshAt, setLastMetalsRefreshAt] = useState(null);

  const fetchMetalsData = useCallback(async () => {
    try {
      setMetalsLoading(true);
      setMetalsError('');

      const latestPayload = await fetchLatestMetals();
      const latestItems = latestPayload.items ?? [];

      const withHistory = await Promise.all(
        latestItems.map(async (item) => {
          try {
            const historyPayload = await fetchMetalHistory(item.symbol, selectedHistoryLimit);
            const sortedHistory = [...(historyPayload.items ?? [])].sort(
              (a, b) => new Date(a.providerTimestampUtc) - new Date(b.providerTimestampUtc)
            );

            return {
              ...item,
              history: sortedHistory,
            };
          } catch {
            return {
              ...item,
              history: [],
            };
          }
        })
      );

      setMetals(withHistory);
      setSelectedSymbol((current) => {
        if (current && withHistory.some((metal) => metal.symbol === current)) {
          return current;
        }

        return withHistory[0]?.symbol ?? '';
      });
      setLastMetalsRefreshAt(new Date());
    } catch {
      setMetalsError('Failed to load metals data. Fetch prices first using backend command.');
      setMetals([]);
      setSelectedSymbol('');
    } finally {
      setMetalsLoading(false);
    }
  }, [selectedHistoryLimit]);

  useEffect(() => {
    fetchMetalsData();

    const intervalId = window.setInterval(() => {
      fetchMetalsData();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchMetalsData]);

  const selectedMetal = useMemo(
    () => metals.find((metal) => metal.symbol === selectedSymbol) ?? null,
    [metals, selectedSymbol]
  );

  const renderSparkline = (history, width = 240, height = 64, stroke = '#d6b45d') => {
    if (!history || history.length < 2) {
      return <p className="muted" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Not enough history for chart</p>;
    }

    const prices = history
      .map((point) => Number.parseFloat(point.price))
      .filter((value) => Number.isFinite(value));

    if (prices.length < 2) {
      return <p className="muted" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Not enough history for chart</p>;
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const points = prices
      .map((price, index) => {
        const x = (index / (prices.length - 1)) * width;
        const y = height - ((price - minPrice) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none">
        <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
      </svg>
    );
  };

  return (
    <div className="panel" style={{ marginTop: '0.75rem' }}>
      <h3>Precious Metals Tracker</h3>
      <div className="tracker-head">
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>Auto-refresh: every 60 seconds</p>
        <button onClick={fetchMetalsData} className="btn btn-secondary">
          Refresh now
        </button>
      </div>
      {lastMetalsRefreshAt && (
        <p className="muted" style={{ marginTop: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
          Last refresh: {lastMetalsRefreshAt.toLocaleTimeString()}
        </p>
      )}

      {metalsLoading && <p className="muted">Loading metals data...</p>}
      {!metalsLoading && metalsError && <p className="error-text">{metalsError}</p>}
      {!metalsLoading && !metalsError && metals.length === 0 && (
        <p className="muted">No metals snapshots saved yet.</p>
      )}

      {!metalsLoading && !metalsError && metals.length > 0 && (
        <>
          <div className="selector-row">
            <label htmlFor="symbol-selector" className="label">History symbol:</label>
            <select
              id="symbol-selector"
              value={selectedSymbol}
              onChange={(event) => setSelectedSymbol(event.target.value)}
              className="select"
            >
              {metals.map((metal) => (
                <option key={metal.symbol} value={metal.symbol}>
                  {metal.metalName} ({metal.symbol})
                </option>
              ))}
            </select>

            <label htmlFor="range-selector" className="label">Points:</label>
            <select
              id="range-selector"
              value={selectedHistoryLimit}
              onChange={(event) => setSelectedHistoryLimit(Number(event.target.value))}
              className="select"
            >
              {HISTORY_LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </div>

          {selectedMetal && (
            <div className="chart-box" style={{ marginTop: '0.8rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>
                {selectedMetal.metalName} ({selectedMetal.symbol}) - {selectedHistoryLimit} point history
              </h4>
              {renderSparkline(selectedMetal.history, 720, 140, '#c8a244')}
            </div>
          )}

          <div className="grid grid-2">
            {metals.map((metal) => (
              <div key={metal.symbol} className="surface-card panel">
                <h4 style={{ margin: '0 0 0.45rem 0' }}>{metal.metalName} ({metal.symbol})</h4>
                <p style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {Number.parseFloat(metal.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })} {metal.quoteCurrency}
                </p>
                <p className="muted" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Nominal: {metal.nominalRaw}</p>
                <p className="muted" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                  Last update: {new Date(metal.providerTimestampUtc).toLocaleString()}
                </p>
                {renderSparkline(metal.history)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MetalsTracker;