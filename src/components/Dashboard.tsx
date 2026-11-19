import { Booking, NavSection, ParkingSlot } from '../types.ts';

interface DashboardProps {
  slots: ParkingSlot[];
  bookings: Booking[];
  onNavigate: (section: NavSection) => void;
}

export function Dashboard({ slots, bookings, onNavigate }: DashboardProps) {
  const totalSlots = slots.length;
  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const occupiedCount = slots.filter((s) => s.status === 'Occupied').length;
  const reservedCount = slots.filter((s) => s.status === 'Reserved').length;
  const occupancyPct =
    totalSlots > 0 ? Math.round(((occupiedCount + reservedCount) / totalSlots) * 100) : 0;

  const slotTypes = ['Compact', 'Standard', 'Large', 'EV'];
  const zoneSummary = slotTypes.map((type) => {
    const group = slots.filter((s) => s.slotType === type);
    const prices = group.map((s) => s.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return {
      type,
      total: group.length,
      available: group.filter((s) => s.status === 'Available').length,
      occupied: group.filter((s) => s.status === 'Occupied').length,
      reserved: group.filter((s) => s.status === 'Reserved').length,
      priceRange: prices.length ? `Rs. ${minPrice} - ${maxPrice}/hr` : '-',
    };
  });

  const recentBookings = bookings.slice(0, 6);

  const statusTagClass = (status: string) => {
    if (status === 'Available') return 'tag tag-available';
    if (status === 'Occupied' || status === 'Active') return 'tag tag-occupied';
    if (status === 'Reserved') return 'tag tag-reserved';
    return 'tag tag-neutral';
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Parking Spaces</div>
          <div className="stat-value navy">{totalSlots}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Slots</div>
          <div className="stat-value green">{availableCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Occupied Slots</div>
          <div className="stat-value red">{occupiedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reserved Slots</div>
          <div className="stat-value yellow">{reservedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Occupancy Rate</div>
          <div className="stat-value">{occupancyPct}%</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Parking Availability Overview</h2>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onNavigate('parking-layout')}
            >
              View Layout
            </button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Slot Type</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Occupied</th>
                  <th>Reserved</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {zoneSummary.map((z) => (
                  <tr key={z.type}>
                    <td><strong>{z.type}</strong></td>
                    <td>{z.total}</td>
                    <td>{z.available}</td>
                    <td>{z.occupied}</td>
                    <td>{z.reserved}</td>
                    <td className="mono">{z.priceRange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Recent Bookings</h2>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onNavigate('bookings')}
            >
              Manage All
            </button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Vehicle No.</th>
                  <th>Slot</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No bookings recorded yet.</td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="mono">{b.bookingCode}</td>
                      <td className="mono">{b.vehicleNumber}</td>
                      <td className="mono"><strong>{b.slotId}</strong></td>
                      <td>{new Date(b.bookingTime).toLocaleString()}</td>
                      <td>
                        <span className={statusTagClass(b.status)}>{b.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Quick Actions</h2>
          <span className="panel-note">Algorithms executed by C++17 engine</span>
        </div>
        <div className="preset-group">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('find-parking')}
          >
            Find Optimal Parking Slot
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onNavigate('algorithm-lab')}
          >
            Open Algorithm Lab
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onNavigate('bookings')}
          >
            New Slot Booking
          </button>
        </div>
      </div>
    </div>
  );
}
