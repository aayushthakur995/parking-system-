import { FormEvent, useState } from 'react';
import { apiFetch } from '../lib/apiClient.ts';
import { RecommendResponse, VehicleType } from '../types.ts';

interface FindParkingProps {
  recommendedSlotId: string | null;
  onRecommendationReady: (slotId: string | null) => void;
  onBookingCreated: () => Promise<void>;
  onInspectSlotOnLayout: (slotId: string) => void;
}

const VEHICLE_TYPES: VehicleType[] = ['Two-Wheeler', 'Hatchback', 'Sedan', 'SUV', 'EV'];

export function FindParking({
  recommendedSlotId,
  onRecommendationReady,
  onBookingCreated,
  onInspectSlotOnLayout,
}: FindParkingProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>('Hatchback');
  const [distanceWeight, setDistanceWeight] = useState<number>(0.6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecommendResponse | null>(null);

  const [bookingSlotId, setBookingSlotId] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');

  const priceWeight = Number((1 - distanceWeight).toFixed(2));

  const runRecommendation = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setBookingMessage('');
    try {
      const data = await apiFetch<RecommendResponse>('/api/recommend', {
        method: 'POST',
        body: JSON.stringify({ vehicleType, distanceWeight }),
      });
      setResult(data);
      const topId = data.recommended?.slotId ?? null;
      onRecommendationReady(topId);
      setBookingSlotId(topId || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to run parking recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (dw: number) => {
    setDistanceWeight(dw);
  };

  const handleBookSlot = async (slotIdToBook: string) => {
    if (!vehicleNumber.trim()) {
      setError('Enter a vehicle registration number before booking.');
      return;
    }
    setBookingLoading(true);
    setError('');
    setBookingMessage('');
    try {
      const res = await apiFetch<{ booking: { bookingCode: string; slotId: string } }>(
        '/api/bookings',
        {
          method: 'POST',
          body: JSON.stringify({
            vehicleNumber: vehicleNumber.trim(),
            vehicleType,
            slotId: slotIdToBook,
          }),
        }
      );
      setBookingMessage(
        `Booking confirmed (${res.booking.bookingCode}) for slot ${res.booking.slotId}.`
      );
      setVehicleNumber('');
      await onBookingCreated();
      // Refresh recommendation so newly reserved slot is removed from available pool
      await runRecommendation();
    } catch (err: any) {
      setError(err?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Find Suitable Parking Slot</h2>
          <span className="panel-note">
            Uses C++17 Dijkstra Shortest Path + Greedy Weighted Ranking
          </span>
        </div>

        <form onSubmit={runRecommendation}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="fp-vehicle">
                Vehicle Type
              </label>
              <select
                id="fp-vehicle"
                className="select"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              >
                {VEHICLE_TYPES.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group grow">
              <label className="form-label" htmlFor="fp-weight">
                Distance vs. Price Preference — Distance: {distanceWeight.toFixed(2)} | Price:{' '}
                {priceWeight.toFixed(2)}
              </label>
              <input
                id="fp-weight"
                className="range-input"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={distanceWeight}
                onChange={(e) => setDistanceWeight(parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <span className="form-label">Quick Preset</span>
              <div className="preset-group">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => applyPreset(1.0)}
                >
                  Shortest Distance
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => applyPreset(0.5)}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => applyPreset(0.0)}
                >
                  Lowest Price
                </button>
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Calculating...' : 'Find Parking'}
              </button>
            </div>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}
        {bookingMessage && <div className="alert alert-success">{bookingMessage}</div>}
      </div>

      {result && (
        <>
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Recommendation Summary</h2>
              <span className="panel-note">
                {result.totalSlots} total &rarr; {result.availableCount} available &rarr;{' '}
                {result.compatibleCount} compatible with {vehicleType}
              </span>
            </div>

            {!result.recommended ? (
              <div className="alert alert-error">
                No available parking slots are compatible with {vehicleType}.
              </div>
            ) : (
              <div className="grid-2">
                <div>
                  <div className="kv-list">
                    <div className="kv-label">Recommended Slot:</div>
                    <div className="mono">
                      <strong>{result.recommended.slotId}</strong> ({result.recommended.slotType})
                    </div>

                    <div className="kv-label">Shortest Distance:</div>
                    <div className="mono">{result.recommended.distance} m from ENTRANCE</div>

                    <div className="kv-label">Hourly Price:</div>
                    <div className="mono">Rs. {result.recommended.price}/hr</div>

                    <div className="kv-label">Algorithm Score:</div>
                    <div className="mono">
                      {result.recommended.score.toFixed(4)} (lower is better)
                    </div>

                    <div className="kv-label">Driving Route:</div>
                    <div className="route-box">{result.recommended.route.join(' -> ')}</div>
                  </div>
                </div>

                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '12px 14px',
                    background: 'var(--bg-subtle)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--navy)' }}>
                    Book Slot {bookingSlotId || result.recommended.slotId}
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" htmlFor="fp-reg">
                      Vehicle Registration Number
                    </label>
                    <input
                      id="fp-reg"
                      className="input mono"
                      type="text"
                      placeholder="e.g. MH12AB1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                    />
                  </div>

                  <div className="preset-group">
                    <button
                      type="button"
                      className="btn btn-blue"
                      disabled={bookingLoading}
                      onClick={() => handleBookSlot(bookingSlotId || result.recommended!.slotId)}
                    >
                      {bookingLoading
                        ? 'Booking...'
                        : `Book Recommended (${bookingSlotId || result.recommended.slotId})`}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onInspectSlotOnLayout(result.recommended!.slotId)}
                    >
                      Show on Parking Layout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Ranked Feasible Slots</h2>
              <span className="panel-note">
                Score = ({result.distanceWeight.toFixed(2)} &times; NormDist) + (
                {result.priceWeight.toFixed(2)} &times; NormPrice)
              </span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Slot</th>
                    <th>Type</th>
                    <th>Distance</th>
                    <th>Price</th>
                    <th>Norm. Dist</th>
                    <th>Norm. Price</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rankedSlots.map((item, idx) => {
                    const isBest = idx === 0 || item.slotId === recommendedSlotId;
                    return (
                      <tr key={item.slotId} className={idx === 0 ? 'row-recommended' : ''}>
                        <td>#{idx + 1}</td>
                        <td className="mono">
                          <strong>{item.slotId}</strong>{' '}
                          {idx === 0 && <span className="tag tag-recommended">Recommended</span>}
                        </td>
                        <td>{item.slotType}</td>
                        <td className="mono">{item.distance} m</td>
                        <td className="mono">Rs. {item.price}</td>
                        <td className="mono">{item.normDistance.toFixed(3)}</td>
                        <td className="mono">{item.normPrice.toFixed(3)}</td>
                        <td className="mono">
                          <strong>{item.score.toFixed(4)}</strong>
                        </td>
                        <td>
                          <span className={isBest && idx === 0 ? 'tag tag-recommended' : 'tag tag-available'}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setBookingSlotId(item.slotId)}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
