import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowUpRight,
  Wrench,
  Heart,
  Recycle,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import {
  loginUser,
  registerCustomer,
  resetPassword,
  type UserSession,
} from '../services/apiService';

interface AccountAuthProps {
  onLoginSuccess: (user: UserSession) => void;
  toast: (msg: string) => void;
}

export function AccountAuth({ onLoginSuccess, toast }: AccountAuthProps) {
  const navigate = useNavigate();

  // Mode: 'customer-login' | 'customer-register' | 'staff-login' | 'forgot'
  const [mode, setMode] = useState<'customer-login' | 'customer-register' | 'staff-login' | 'forgot'>('customer-login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick Demo Fill Helper for evaluation convenience
  const fillCredentials = (type: 'admin' | 'tech' | 'partner' | 'customer') => {
    setError('');
    if (type === 'admin') {
      setMode('staff-login');
      setEmail('admin@ecycle.com');
      setPassword('admin123');
    } else if (type === 'tech') {
      setMode('staff-login');
      setEmail('tech@fixforward.com');
      setPassword('tech123');
    } else if (type === 'partner') {
      setMode('staff-login');
      setEmail('partner@ecoloop.com');
      setPassword('partner123');
    } else {
      setMode('customer-login');
      setEmail('user@example.com');
      setPassword('user123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'customer-register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        const user = await registerCustomer(name.trim(), email.trim(), password);
        toast(`Welcome to E-Cycle, ${user.name}!`);
        onLoginSuccess(user);
        navigate('/dashboard');
      } else if (mode === 'customer-login' || mode === 'staff-login') {
        const user = await loginUser(email.trim(), password);
        toast(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
        onLoginSuccess(user);
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        const msg = await resetPassword(email.trim(), newPassword.trim());
        toast(msg);
        setMode('customer-login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-nav">
        <Link to="/" className="logo">
          <span className="logo-icon">
            <Recycle size={22} strokeWidth={2.6} />
          </span>
          <span>
            E<span className="logo-hyphen">-</span>CYCLE
          </span>
        </Link>
        <Link to="/">
          Back to website <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="account-grid">
        {/* Left Side: Circular Value Proposition */}
        <div className="account-story">
          <div className="eyebrow light">ROLE-BASED ECO PLATFORM</div>
          <h1>
            Empowering cities.
            <br />
            Reviving electronics.
          </h1>
          <p>
            Connect across customer, repair technician, collector, and administrative roles to track
            every device from doorstep pickup to circular second life.
          </p>

          <div className="account-story-steps">
            <span>
              <Wrench size={21} /> Repair & Diagnostics
            </span>
            <span>
              <Heart size={21} /> Community Reuse
            </span>
            <span>
              <Recycle size={21} /> Certified Recycling
            </span>
          </div>

          {/* Quick Demo Credentials Panel */}
          <div
            style={{
              marginTop: '30px',
              padding: '14px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '8px' }}>
              <ShieldCheck size={16} /> Fast Role Testing:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                Admin (admin@ecycle.com)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('tech')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                Technician (tech@fixforward.com)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('partner')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                Collector (partner@ecoloop.com)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('customer')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                Customer (user@example.com)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <form onSubmit={handleSubmit} className="account-form" style={{ maxWidth: '440px' }}>
          {/* Navigation Tabs between Customer and Staff/Admin */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '18px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('customer-login');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: mode === 'customer-login' || mode === 'customer-register' ? 700 : 500,
                backgroundColor: mode === 'customer-login' || mode === 'customer-register' ? '#ffffff' : 'transparent',
                color: mode === 'customer-login' || mode === 'customer-register' ? '#047857' : '#6b7280',
                cursor: 'pointer',
                boxShadow: mode === 'customer-login' || mode === 'customer-register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Customer Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('staff-login');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: mode === 'staff-login' ? 700 : 500,
                backgroundColor: mode === 'staff-login' ? '#ffffff' : 'transparent',
                color: mode === 'staff-login' ? '#047857' : '#6b7280',
                cursor: 'pointer',
                boxShadow: mode === 'staff-login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Admin & Partner Login
            </button>
          </div>

          <h2>
            {mode === 'customer-register'
              ? 'Create Customer Account'
              : mode === 'staff-login'
              ? 'Authorized Staff Sign-In'
              : mode === 'forgot'
              ? 'Reset Password'
              : 'Sign In to E-Cycle'}
          </h2>

          <p style={{ margin: '4px 0 16px', fontSize: '11px', color: '#6b7280' }}>
            {mode === 'staff-login'
              ? 'Restricted to verified administrators, technicians, and collection partners.'
              : mode === 'customer-register'
              ? 'Register to scan devices, request pickups, and earn eco rewards.'
              : 'Enter your account credentials to access your workspace.'}
          </p>

          {mode === 'customer-register' && (
            <label>
              Your full name
              <input
                placeholder="e.g. Priya Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {mode !== 'forgot' && (
            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          )}

          {mode === 'forgot' && (
            <label>
              New Password
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
          )}

          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '10px 0',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary account-submit" disabled={loading}>
            {loading
              ? 'Authenticating...'
              : mode === 'customer-register'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Update Password'
              : 'Sign In'}{' '}
            <ArrowRight size={16} />
          </button>

          {/* Links for mode switching */}
          <div style={{ marginTop: '16px', fontSize: '11px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mode === 'customer-login' && (
              <>
                <div>
                  New to E-Cycle?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('customer-register');
                      setError('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Register here
                  </button>
                </div>
                <div>
                  Forgot password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer' }}
                  >
                    Reset password
                  </button>
                </div>
              </>
            )}

            {mode === 'customer-register' && (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('customer-login');
                    setError('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <div>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('customer-login');
                    setError('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 700, cursor: 'pointer' }}
                >
                  Return to sign in
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
