import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchLatestMetals } from '../services/metals';
import { fetchHoldings, upsertHolding } from '../services/holdings';

const GRAMS_PER_TROY_OUNCE = 31.1034768;

function formatNumber(value, decimals) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return (0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return numberValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatUsd(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 'N/A';
  }

  return numberValue.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toTwoDecimals(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return '0.00';
  }

  return numberValue.toFixed(2);
}

function sanitizeTwoDecimalInput(rawValue) {
  if (rawValue === '') {
    return '';
  }

  if (!/^\d*\.?\d*$/.test(rawValue)) {
    return null;
  }

  const [wholePart, decimalPart = ''] = rawValue.split('.');
  if (decimalPart.length === 0) {
    return wholePart;
  }

  return `${wholePart}.${decimalPart.slice(0, 2)}`;
}

function gramsToOunces(gramsValue) {
  const grams = Number(gramsValue);
  if (!Number.isFinite(grams)) {
    return '0.00';
  }

  return (grams / GRAMS_PER_TROY_OUNCE).toFixed(2);
}

function ouncesToGrams(ouncesValue) {
  const ounces = Number(ouncesValue);
  if (!Number.isFinite(ounces)) {
    return '0.00';
  }

  return (ounces * GRAMS_PER_TROY_OUNCE).toFixed(2);
}

function PrivateDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holdingsError, setHoldingsError] = useState('');

  const [goldGrams, setGoldGrams] = useState('');
  const [silverGrams, setSilverGrams] = useState('');
  const [goldOunces, setGoldOunces] = useState('');
  const [silverOunces, setSilverOunces] = useState('');

  const [holdingsBySymbol, setHoldingsBySymbol] = useState({});
  const [latestPricesBySymbol, setLatestPricesBySymbol] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [meResponse, holdingsResponse, latestMetalsResponse] = await Promise.all([
          api.get('/me'),
          fetchHoldings(),
          fetchLatestMetals(),
        ]);

        setUser(meResponse.data);

        const holdingsMap = (holdingsResponse.items ?? []).reduce((acc, item) => {
          acc[item.symbol] = item;
          return acc;
        }, {});
        setHoldingsBySymbol(holdingsMap);

        setGoldGrams(toTwoDecimals(holdingsMap.XAU?.grams ?? '0'));
        setSilverGrams(toTwoDecimals(holdingsMap.XAG?.grams ?? '0'));
        setGoldOunces(toTwoDecimals(holdingsMap.XAU?.ounces ?? '0'));
        setSilverOunces(toTwoDecimals(holdingsMap.XAG?.ounces ?? '0'));

        const pricesMap = (latestMetalsResponse.items ?? []).reduce((acc, item) => {
          acc[item.symbol] = item;
          return acc;
        }, {});
        setLatestPricesBySymbol(pricesMap);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleGramsBlur = async (symbol) => {
    setHoldingsError('');

    const gramsInput = symbol === 'XAU' ? goldGrams : silverGrams;
    const normalizedGrams = toTwoDecimals(gramsInput.trim() === '' ? '0' : gramsInput.trim());

    if (Number.isNaN(Number(normalizedGrams))) {
      setHoldingsError('Please enter a valid grams amount.');
      return;
    }

    if (symbol === 'XAU') {
      setGoldGrams(normalizedGrams);
      setGoldOunces(gramsToOunces(normalizedGrams));
    }
    if (symbol === 'XAG') {
      setSilverGrams(normalizedGrams);
      setSilverOunces(gramsToOunces(normalizedGrams));
    }

    const currentServerGrams = toTwoDecimals(holdingsBySymbol[symbol]?.grams ?? '0');
    if (normalizedGrams === currentServerGrams) {
      return;
    }

    try {
      const updated = await upsertHolding(symbol, { grams: normalizedGrams });
      setHoldingsBySymbol((prev) => ({
        ...prev,
        [symbol]: updated,
      }));

      if (symbol === 'XAU') {
        setGoldGrams(toTwoDecimals(updated.grams));
        setGoldOunces(toTwoDecimals(updated.ounces));
      }
      if (symbol === 'XAG') {
        setSilverGrams(toTwoDecimals(updated.grams));
        setSilverOunces(toTwoDecimals(updated.ounces));
      }
    } catch {
      setHoldingsError('Failed to save holdings. Please try again.');
    }
  };

  const handleOuncesBlur = async (symbol) => {
    setHoldingsError('');

    const ouncesInput = symbol === 'XAU' ? goldOunces : silverOunces;
    const normalizedOunces = toTwoDecimals(ouncesInput.trim() === '' ? '0' : ouncesInput.trim());

    if (Number.isNaN(Number(normalizedOunces))) {
      setHoldingsError('Please enter a valid ounces amount.');
      return;
    }

    if (symbol === 'XAU') {
      setGoldOunces(normalizedOunces);
      setGoldGrams(ouncesToGrams(normalizedOunces));
    }
    if (symbol === 'XAG') {
      setSilverOunces(normalizedOunces);
      setSilverGrams(ouncesToGrams(normalizedOunces));
    }

    const currentServerOunces = toTwoDecimals(holdingsBySymbol[symbol]?.ounces ?? '0');
    if (normalizedOunces === currentServerOunces) {
      return;
    }

    try {
      const updated = await upsertHolding(symbol, { ounces: normalizedOunces });
      setHoldingsBySymbol((prev) => ({
        ...prev,
        [symbol]: updated,
      }));

      if (symbol === 'XAU') {
        setGoldGrams(toTwoDecimals(updated.grams));
        setGoldOunces(toTwoDecimals(updated.ounces));
      }
      if (symbol === 'XAG') {
        setSilverGrams(toTwoDecimals(updated.grams));
        setSilverOunces(toTwoDecimals(updated.ounces));
      }
    } catch {
      setHoldingsError('Failed to save holdings. Please try again.');
    }
  };

  const goldHolding = holdingsBySymbol.XAU ?? { grams: '0.00000000', ounces: '0.00000000' };
  const silverHolding = holdingsBySymbol.XAG ?? { grams: '0.00000000', ounces: '0.00000000' };

  const goldGramsNumber = Number(goldHolding.grams);
  const silverGramsNumber = Number(silverHolding.grams);
  const goldOuncesNumber = Number(goldHolding.ounces);
  const silverOuncesNumber = Number(silverHolding.ounces);

  const totalGramsNumber = goldGramsNumber + silverGramsNumber;
  const totalOuncesNumber = goldOuncesNumber + silverOuncesNumber;

  const goldPriceUsdPerOunce = Number(latestPricesBySymbol.XAU?.price);
  const silverPriceUsdPerOunce = Number(latestPricesBySymbol.XAG?.price);

  const goldValueUsd = Number.isFinite(goldPriceUsdPerOunce)
    ? goldOuncesNumber * goldPriceUsdPerOunce
    : Number.NaN;
  const silverValueUsd = Number.isFinite(silverPriceUsdPerOunce)
    ? silverOuncesNumber * silverPriceUsdPerOunce
    : Number.NaN;
  const totalValueUsd = Number.isFinite(goldValueUsd) && Number.isFinite(silverValueUsd)
    ? goldValueUsd + silverValueUsd
    : Number.NaN;

  if (loading) {
    return <section className="page-shell"><p className="muted">Loading...</p></section>;
  }

  if (error) {
    return <section className="page-shell"><p className="error-text">{error}</p></section>;
  }

  return (
    <section className="page-shell auth-shell" style={{ maxWidth: '760px' }}>
      <div className="surface-card panel-lg">
        <h1 className="page-title">Gold Rush Dashboard</h1>
        <p className="page-subtitle">Private account overview and quick actions.</p>

        {user && (
          <div className="surface-card panel" style={{ background: 'var(--surface-soft)' }}>
            <h2>Welcome!</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        <div className="surface-card panel" style={{ marginTop: '1rem' }}>
          <h2>Holdings</h2>
          <p className="muted">Enter how much gold and silver you have in grams or troy ounces. Values auto-save when you leave a field.</p>

          <div className="form-stack" style={{ marginTop: '1rem' }}>
            <div className="grid grid-2" style={{ marginTop: 0 }}>
              <label>
                <div className="label">Gold (XAU) grams</div>
                <input
                  className="field"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={goldGrams}
                  onChange={(e) => {
                    const sanitized = sanitizeTwoDecimalInput(e.target.value);
                    if (sanitized !== null) {
                      setGoldGrams(sanitized);
                    }
                  }}
                  onBlur={() => handleGramsBlur('XAU')}
                />
              </label>

              <label>
                <div className="label">Gold (XAU) oz t</div>
                <input
                  className="field"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={goldOunces}
                  onChange={(e) => {
                    const sanitized = sanitizeTwoDecimalInput(e.target.value);
                    if (sanitized !== null) {
                      setGoldOunces(sanitized);
                    }
                  }}
                  onBlur={() => handleOuncesBlur('XAU')}
                />
              </label>
            </div>

            <div className="grid grid-2" style={{ marginTop: 0 }}>
              <label>
                <div className="label">Silver (XAG) grams</div>
                <input
                  className="field"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={silverGrams}
                  onChange={(e) => {
                    const sanitized = sanitizeTwoDecimalInput(e.target.value);
                    if (sanitized !== null) {
                      setSilverGrams(sanitized);
                    }
                  }}
                  onBlur={() => handleGramsBlur('XAG')}
                />
              </label>

              <label>
                <div className="label">Silver (XAG) oz t</div>
                <input
                  className="field"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={silverOunces}
                  onChange={(e) => {
                    const sanitized = sanitizeTwoDecimalInput(e.target.value);
                    if (sanitized !== null) {
                      setSilverOunces(sanitized);
                    }
                  }}
                  onBlur={() => handleOuncesBlur('XAG')}
                />
              </label>
            </div>
          </div>

          {holdingsError && (
            <p className="error-text" style={{ marginTop: '0.9rem' }}>{holdingsError}</p>
          )}

          <div style={{ marginTop: '1.1rem' }}>
            <h3 style={{ marginBottom: '0.4rem' }}>Totals</h3>
            <p><strong>Gold:</strong> {formatNumber(goldGramsNumber, 2)} g ({formatNumber(goldOuncesNumber, 2)} oz t)</p>
            <p><strong>Silver:</strong> {formatNumber(silverGramsNumber, 2)} g ({formatNumber(silverOuncesNumber, 2)} oz t)</p>
            <p><strong>Combined:</strong> {formatNumber(totalGramsNumber, 2)} g ({formatNumber(totalOuncesNumber, 2)} oz t)</p>
          </div>

          <div style={{ marginTop: '1.1rem' }}>
            <h3 style={{ marginBottom: '0.4rem' }}>Value (USD)</h3>
            <p><strong>Gold:</strong> {formatUsd(goldValueUsd)}</p>
            <p><strong>Silver:</strong> {formatUsd(silverValueUsd)}</p>
            <p><strong>Combined:</strong> {formatUsd(totalValueUsd)}</p>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn btn-secondary">Go to Public Home</Link>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </div>
    </section>
  );
}

export default PrivateDashboard;