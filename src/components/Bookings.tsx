import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient.ts';
import { Booking, ParkingSlot, VehicleType } from '../types.ts';

interface BookingsProps {
  slots: ParkingSlot[];
  bookings: Booking[];
  preselectedSlotId: string | null;
  onDataChanged: () => Promise<void>;
}

const VEHICLE_TYPES: VehicleType[] = ['Two-Wheeler', 'Hatchback', 'Sedan', 'SUV', 'EV'];

export function Bookings({
  slots,
  bookings,
  preselectedSlotId,
  onDataChanged,
}: BookingsProps) {
  const availableSlots = slots.filter((s) => s.status === 'Available');

  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Hatchback');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<Booking | null>(null);

  useEffect(() => {
    if (preselectedSlotId && availableSlots.some((s) => s.slotId === preselectedSlotId)) {
      setSelectedSlotId(preselectedSlotId);
    } else if (!selectedSlotId && availableSlots.length > 0) {
      setSelectedSlotId(availableSlots[0].slotId);
    }
  }, [preselectedSlotId, slots]);

  const currentSlot = slots.find((s) => s.slotId === selectedSlotId) || null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmation(null);

    if (!selectedSlotId) {
      setError('Please select an available slot.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setError('Please enter the vehicle registration number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          slotId: selectedSlotId,
          vehicleNumber: vehicleNumber.trim(),
          vehicleType,
        }),
      });
      setConfirmation(res.booking);
      setVehicleNumber('');
      setSelectedSlotId('');
      await onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    setError('');
    setConfirmation(null);
    setCancellingId(bookingId);
    try {
      await apiFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      await onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const statusTagClass = (status: string) => {
    if (status === 'Active') return 'tag tag-occupied';
    if (status === 'Reserved') return 'tag tag-reserved';
    if (status === 'Cancelled') return 'tag tag-neutral';
    return 'tag tag-available';
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Create Manual Slot Booking</h2>
          <span className="panel-note">{availableSlots.length} available slots ready to book</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="bk-slot">
                Available Parking Slot
              </label>
              <select
                id="bk-slot"
                className="select"
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
              >
                {availableSlots.length === 0 ? (
                  <option value="">No slots available</option>
                ) : (
                  availableSlots.map((s) => (
                    <option key={s.slotId} value={s.slotId}>
                      {s.slotId} — {s.slotType} (Rs.{s.price}/hr, {s.distanceFromEntrance}m)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bk-veh-type">
                Vehicle Type
              </label>
              <select
                id="bk-veh-type"
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
              <label className="form-label" htmlFor="bk-veh-num">
                Vehicle Registration Number
              </label>
              <input
                id="bk-veh-num"
                className="input mono"
                type="text"
                placeholder="e.g. MH12PQ4821"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || availableSlots.length === 0}
              >
                {submitting ? 'Booking...' : 'Book Slot'}
              </button>
            </div>
          </div>
        </form>

        {currentSlot && (
          <div className="panel-note" style={{ marginBottom: '8px' }}>
            Selected slot <strong>{currentSlot.slotId}</strong> supports:{' '}
            {currentSlot.vehicleCompatibility.split(',').join(', ')}
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {confirmation && (
          <div className="alert alert-success">
            <strong>Booking Confirmed:</strong> Code{' '}
            <span className="mono">{confirmation.bookingCode}</span> | Slot{' '}
            <span className="mono">{confirmation.slotId}</span> | Vehicle{' '}
            <span className="mono">{confirmation.vehicleNumber}</span> ({confirmation.vehicleType})
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">All Parking Bookings</h2>
          <span className="panel-note">Cancelling restores slot status to Available</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Vehicle Number</th>
                <th>Vehicle Type</th>
                <th>Slot ID</th>
                <th>Date / Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7}>No bookings found.</td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="mono"><strong>{b.bookingCode}</strong></td>
                    <td className="mono">{b.vehicleNumber}</td>
                    <td>{b.vehicleType}</td>
                    <td className="mono"><strong>{b.slotId}</strong></td>
                    <td>{new Date(b.bookingTime).toLocaleString()}</td>
                    <td>
                      <span className={statusTagClass(b.status)}>{b.status}</span>
                    </td>
                    <td>
                      {b.status === 'Reserved' || b.status === 'Active' ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={cancellingId === b.id}
                          onClick={() => handleCancel(b.id)}
                        >
                          {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      ) : (
                        <span className="panel-note">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
