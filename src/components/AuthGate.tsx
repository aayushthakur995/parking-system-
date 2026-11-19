import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

export function AuthGate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <h1 className="auth-title">Park Smart</h1>
        <p className="auth-subtitle">
          DAA-Based Smart Parking Allocation and Route Optimization System
        </p>

        <div className="auth-meta-list">
          <div>
            <strong>Algorithm Engine:</strong> C++17 (Dijkstra, Greedy Ranking, TSP, Branch &amp; Bound)
          </div>
          <div>
            <strong>Modules:</strong> Dashboard, Find Parking, Layout Map, Algorithm Lab, Bookings
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
