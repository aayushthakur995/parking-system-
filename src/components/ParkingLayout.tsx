import { useEffect, useState } from 'react';
import { ParkingSlot } from '../types.ts';

interface ParkingLayoutProps {
  slots: ParkingSlot[];
  recommendedSlotId: string | null;
  initialSelectedSlotId: string | null;
  onBookSlotClick: (slotId: string) => void;
}

export function ParkingLayout({
  slots,
  recommendedSlotId,
  initialSelectedSlotId,
  onBookSlotClick,
}: ParkingLayoutProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSelectedSlotId || recommendedSlotId || 'P01'
  );

  useEffect(() => {
    if (initialSelectedSlotId) {
      setSelectedSlotId(initialSelectedSlotId);
    }
  }, [initialSelectedSlotId]);

  const rows: ParkingSlot[][] = [0, 1, 2, 3, 4].map((r) =>
    slots.filter((s) => s.rowIndex === r).sort((a, b) => a.colIndex - b.colIndex)
  );

  const selectedSlot = slots.find((s) => s.slotId === selectedSlotId) || slots[0] || null;

  const getTileClass = (slot: ParkingSlot) => {
    const classes = ['slot-tile'];
    if (recommendedSlotId && slot.slotId === recommendedSlotId && slot.status === 'Available') {
      classes.push('status-recommended');
    } else if (slot.status === 'Available') {
      classes.push('status-available');
    } else if (slot.status === 'Occupied') {
      classes.push('status-occupied');
    } else {
      classes.push('status-reserved');
    }

    if (selectedSlot?.slotId === slot.slotId) {
      classes.push('selected');
    }
    return classes.join(' ');
  };

  const getTagClass = (slot: ParkingSlot) => {
    if (recommendedSlotId && slot.slotId === recommendedSlotId && slot.status === 'Available') {
      return 'tag tag-recommended';
    }
    if (slot.status === 'Available') return 'tag tag-available';
    if (slot.status === 'Occupied') return 'tag tag-occupied';
    return 'tag tag-reserved';
  };

  return (
    <div className="grid-sidebar-right">
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Top-Down Parking Lot Map (25 Slots)</h2>
          <span className="panel-note">Click any slot to inspect route and details</span>
        </div>

        <div className="legend-bar">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--green-bg)', borderColor: 'var(--green-border)' }} />
            Available
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--red-bg)', borderColor: 'var(--red-border)' }} />
            Occupied
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--yellow-bg)', borderColor: 'var(--yellow-border)' }} />
            Reserved
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--blue-bg)', borderColor: '#2563eb' }} />
            Recommended {recommendedSlotId ? `(${recommendedSlotId})` : ''}
          </span>
        </div>

        <div className="lot-container">
          <div className="entrance-bar">
            <span className="entrance-gate">ENTRANCE GATE (Graph Node: ENTRANCE)</span>
            <span className="panel-note">5 Rows &times; 5 Columns</span>
          </div>

          {/* Row 1 */}
          <div className="parking-row">
            {rows[0].map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                className={getTileClass(slot)}
                onClick={() => setSelectedSlotId(slot.slotId)}
              >
                <span className="slot-id">{slot.slotId}</span>
                <span className="slot-meta">{slot.slotType}</span>
                <span className="slot-meta">Rs.{slot.price} | {slot.distanceFromEntrance}m</span>
              </button>
            ))}
          </div>

          <div className="aisle-strip">
            <span>NORTH DRIVING AISLE (A1 &harr; A2 &harr; A3 &harr; A4 &harr; A5)</span>
            <span>6m / segment</span>
          </div>

          {/* Row 2 */}
          <div className="parking-row">
            {rows[1].map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                className={getTileClass(slot)}
                onClick={() => setSelectedSlotId(slot.slotId)}
              >
                <span className="slot-id">{slot.slotId}</span>
                <span className="slot-meta">{slot.slotType}</span>
                <span className="slot-meta">Rs.{slot.price} | {slot.distanceFromEntrance}m</span>
              </button>
            ))}
          </div>

          <div className="aisle-strip">
            <span>CROSS CONNECTOR &amp; MIDDLE AISLE (B1 &harr; B2 &harr; B3 &harr; B4 &harr; B5)</span>
            <span>Vertical lanes at Col 1, 2, 3, 5</span>
          </div>

          {/* Row 3 */}
          <div className="parking-row">
            {rows[2].map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                className={getTileClass(slot)}
                onClick={() => setSelectedSlotId(slot.slotId)}
              >
                <span className="slot-id">{slot.slotId}</span>
                <span className="slot-meta">{slot.slotType}</span>
                <span className="slot-meta">Rs.{slot.price} | {slot.distanceFromEntrance}m</span>
              </button>
            ))}
          </div>

          <div style={{ height: '8px' }} />

          {/* Row 4 */}
          <div className="parking-row">
            {rows[3].map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                className={getTileClass(slot)}
                onClick={() => setSelectedSlotId(slot.slotId)}
              >
                <span className="slot-id">{slot.slotId}</span>
                <span className="slot-meta">{slot.slotType}</span>
                <span className="slot-meta">Rs.{slot.price} | {slot.distanceFromEntrance}m</span>
              </button>
            ))}
          </div>

          <div className="aisle-strip">
            <span>SOUTH DRIVING AISLE (C1 &harr; C2 &harr; C3 &harr; C4 &harr; C5)</span>
            <span>6m / segment</span>
          </div>

          {/* Row 5 */}
          <div className="parking-row">
            {rows[4].map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                className={getTileClass(slot)}
                onClick={() => setSelectedSlotId(slot.slotId)}
              >
                <span className="slot-id">{slot.slotId}</span>
                <span className="slot-meta">{slot.slotType}</span>
                <span className="slot-meta">Rs.{slot.price} | {slot.distanceFromEntrance}m</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Slot Inspector</h2>
          {selectedSlot && <span className="mono">{selectedSlot.slotId}</span>}
        </div>

        {selectedSlot ? (
          <div>
            <div className="kv-list" style={{ marginBottom: '16px' }}>
              <div className="kv-label">Slot ID:</div>
              <div className="mono"><strong>{selectedSlot.slotId}</strong></div>

              <div className="kv-label">Status:</div>
              <div>
                <span className={getTagClass(selectedSlot)}>
                  {recommendedSlotId === selectedSlot.slotId && selectedSlot.status === 'Available'
                    ? 'Recommended (Available)'
                    : selectedSlot.status}
                </span>
              </div>

              <div className="kv-label">Slot Type:</div>
              <div>{selectedSlot.slotType}</div>

              <div className="kv-label">Compatible Vehicles:</div>
              <div>{selectedSlot.vehicleCompatibility.split(',').join(', ')}</div>

              <div className="kv-label">Hourly Price:</div>
              <div className="mono">Rs. {selectedSlot.price}/hr</div>

              <div className="kv-label">Distance from Gate:</div>
              <div className="mono">{selectedSlot.distanceFromEntrance} meters</div>

              <div className="kv-label">Graph Node ID:</div>
              <div className="mono">{selectedSlot.graphNodeId}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div className="form-label" style={{ marginBottom: '6px' }}>
                Shortest Path from ENTRANCE (Dijkstra)
              </div>
              <div className="route-box">{selectedSlot.routeFromEntrance.join(' -> ')}</div>
            </div>

            {selectedSlot.status === 'Available' ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => onBookSlotClick(selectedSlot.slotId)}
              >
                Book Slot {selectedSlot.slotId}
              </button>
            ) : (
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                This slot is currently {selectedSlot.status.toLowerCase()}.
              </div>
            )}
          </div>
        ) : (
          <p>Select a parking slot from the grid.</p>
        )}
      </div>
    </div>
  );
}
