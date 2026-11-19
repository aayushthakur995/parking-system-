import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AlgorithmLab } from './components/AlgorithmLab.tsx';
import { AuthGate } from './components/AuthGate.tsx';
import { Bookings } from './components/Bookings.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { FindParking } from './components/FindParking.tsx';
import { ParkingLayout } from './components/ParkingLayout.tsx';
import { apiFetch } from './lib/apiClient.ts';
import { auth } from './lib/firebase.ts';
import { Booking, NavSection, ParkingSlot } from './types.ts';

const NAV_ITEMS: { id: NavSection; label: string; title: string }[] = [
  { id: 'dashboard', label: 'Dashboard', title: 'Parking Overview Dashboard' },
  { id: 'find-parking', label: 'Find Parking', title: 'Find Parking — Slot Recommendation' },
  { id: 'parking-layout', label: 'Parking Layout', title: 'Top-Down Parking Lot Map' },
  { id: 'algorithm-lab', label: 'Algorithm Lab', title: 'DAA Algorithm Lab (C++17)' },
  { id: 'bookings', label: 'Bookings', title: 'Booking Management' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [section, setSection] = useState<NavSection>('dashboard');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  const [recommendedSlotId, setRecommendedSlotId] = useState<string | null>(null);
  const [layoutFocusSlotId, setLayoutFocusSlotId] = useState<string | null>(null);
  const [bookingPreselectSlotId, setBookingPreselectSlotId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoadingData(true);
    setDataError('');
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        apiFetch<{ slots: ParkingSlot[] }>('/api/slots'),
        apiFetch<{ bookings: Booking[] }>('/api/bookings'),
      ]);
      setSlots(slotsRes.slots);
      setBookings(bookingsRes.bookings);
    } catch (err: any) {
      setDataError(err?.message || 'Failed to load parking data.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkspaceData();
    } else {
      setSlots([]);
      setBookings([]);
    }
  }, [user, loadWorkspaceData]);

  if (!authReady) {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <p>Loading Park Smart...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  const currentNav = NAV_ITEMS.find((n) => n.id === section) || NAV_ITEMS[0];

  const handleInspectOnLayout = (slotId: string) => {
    setLayoutFocusSlotId(slotId);
    setSection('parking-layout');
  };

  const handleBookFromLayout = (slotId: string) => {
    setBookingPreselectSlotId(slotId);
    setSection('bookings');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Park Smart</h1>
          <span>DAA Smart Parking System</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${section === item.id ? 'active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">{user.email}</div>
          <button
            type="button"
            className="btn-signout"
            onClick={() => signOut(auth)}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <div className="topbar-title">{currentNav.title}</div>
            <div className="topbar-subtitle">
              Smart Parking Allocation &amp; Route Optimization
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={loadWorkspaceData}
            disabled={loadingData}
          >
            {loadingData ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        <main className="content-body">
          {dataError && <div className="alert alert-error">{dataError}</div>}

          {section === 'dashboard' && (
            <Dashboard
              slots={slots}
              bookings={bookings}
              onNavigate={setSection}
            />
          )}

          {section === 'find-parking' && (
            <FindParking
              recommendedSlotId={recommendedSlotId}
              onRecommendationReady={setRecommendedSlotId}
              onBookingCreated={loadWorkspaceData}
              onInspectSlotOnLayout={handleInspectOnLayout}
            />
          )}

          {section === 'parking-layout' && (
            <ParkingLayout
              slots={slots}
              recommendedSlotId={recommendedSlotId}
              initialSelectedSlotId={layoutFocusSlotId}
              onBookSlotClick={handleBookFromLayout}
            />
          )}

          {section === 'algorithm-lab' && <AlgorithmLab slots={slots} />}

          {section === 'bookings' && (
            <Bookings
              slots={slots}
              bookings={bookings}
              preselectedSlotId={bookingPreselectSlotId}
              onDataChanged={loadWorkspaceData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
