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

  const renderSparkline = (history, width = 240, height = 64, stroke = '#c59d00') => {
    if (!history || history.length < 2) {
      return <p style={styles.emptyHistory}>Not enough history for chart</p>;
    }

    const prices = history
      .map((point) => Number.parseFloat(point.price))
      .filter((value) => Number.isFinite(value));

    if (prices.length < 2) {
      return <p style={styles.emptyHistory}>Not enough history for chart</p>;
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
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.sparkline}>
        <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
      </svg>
    );
  };

  return (
    <div style={styles.section}>
      <h3>Precious Metals Tracker</h3>
      <div style={styles.metalsHeaderRow}>
        <p style={styles.autoRefreshText}>Auto-refresh: every 60 seconds</p>
        <button onClick={fetchMetalsData} style={styles.refreshButton}>
          Refresh now
        </button>
      </div>
      {lastMetalsRefreshAt && (
        <p style={styles.lastRefreshText}>
          Last refresh: {lastMetalsRefreshAt.toLocaleTimeString()}
        </p>
      )}

      {metalsLoading && <p style={styles.mutedText}>Loading metals data...</p>}
      {!metalsLoading && metalsError && <p style={styles.error}>{metalsError}</p>}
      {!metalsLoading && !metalsError && metals.length === 0 && (
        <p style={styles.mutedText}>No metals snapshots saved yet.</p>
      )}

      {!metalsLoading && !metalsError && metals.length > 0 && (
        <>
          <div style={styles.selectorRow}>
            <label htmlFor="symbol-selector" style={styles.selectorLabel}>History symbol:</label>
            <select
              id="symbol-selector"
              value={selectedSymbol}
              onChange={(event) => setSelectedSymbol(event.target.value)}
              style={styles.selectorInput}
            >
              {metals.map((metal) => (
                <option key={metal.symbol} value={metal.symbol}>
                  {metal.metalName} ({metal.symbol})
                </option>
              ))}
            </select>

            <label htmlFor="range-selector" style={styles.selectorLabel}>Points:</label>
            <select
              id="range-selector"
              value={selectedHistoryLimit}
              onChange={(event) => setSelectedHistoryLimit(Number(event.target.value))}
              style={styles.selectorInput}
            >
              {HISTORY_LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </div>

          {selectedMetal && (
            <div style={styles.selectedHistoryCard}>
              <h4 style={styles.selectedHistoryTitle}>
                {selectedMetal.metalName} ({selectedMetal.symbol}) - {selectedHistoryLimit} point history
              </h4>
              {renderSparkline(selectedMetal.history, 520, 120, '#a37d00')}
            </div>
          )}

          <div style={styles.metalsGrid}>
            {metals.map((metal) => (
              <div key={metal.symbol} style={styles.metalCard}>
                <h4 style={styles.metalTitle}>{metal.metalName} ({metal.symbol})</h4>
                <p style={styles.priceText}>
                  {Number.parseFloat(metal.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })} {metal.quoteCurrency}
                </p>
                <p style={styles.metaText}>Nominal: {metal.nominalRaw}</p>
                <p style={styles.metaText}>
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

const styles = {
  section: {
    marginBottom: '1.5rem',
  },
  metalsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  autoRefreshText: {
    margin: 0,
    color: '#666',
    fontSize: '0.9rem',
  },
  refreshButton: {
    padding: '0.35rem 0.7rem',
    fontSize: '0.85rem',
    backgroundColor: '#f1f1f1',
    border: '1px solid #d7d7d7',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  lastRefreshText: {
    marginTop: '0.5rem',
    marginBottom: '0.4rem',
    color: '#777',
    fontSize: '0.85rem',
  },
  selectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginTop: '0.65rem',
  },
  selectorLabel: {
    color: '#444',
    fontSize: '0.9rem',
  },
  selectorInput: {
    padding: '0.35rem 0.45rem',
    borderRadius: '4px',
    border: '1px solid #d4d4d4',
    fontSize: '0.9rem',
  },
  selectedHistoryCard: {
    marginTop: '0.75rem',
    marginBottom: '0.85rem',
    border: '1px solid #ececec',
    borderRadius: '6px',
    padding: '0.7rem',
    backgroundColor: '#fffef8',
  },
  selectedHistoryTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
  },
  mutedText: {
    color: '#666',
  },
  metalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
    marginTop: '0.75rem',
  },
  metalCard: {
    border: '1px solid #e8e8e8',
    borderRadius: '6px',
    padding: '0.85rem',
    backgroundColor: '#fffdf6',
  },
  metalTitle: {
    margin: '0 0 0.45rem 0',
    color: '#333',
  },
  priceText: {
    margin: '0 0 0.35rem 0',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#7a5f00',
  },
  metaText: {
    margin: '0 0 0.25rem 0',
    color: '#555',
    fontSize: '0.9rem',
  },
  sparkline: {
    marginTop: '0.4rem',
    display: 'block',
    backgroundColor: '#fff',
    borderRadius: '4px',
  },
  emptyHistory: {
    margin: '0.5rem 0 0 0',
    color: '#777',
    fontSize: '0.85rem',
  },
  error: {
    color: 'red',
  },
};

export default MetalsTracker;