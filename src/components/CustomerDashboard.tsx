import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  ClipboardList,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Plus,
  ScanLine,
  Package,
  Users,
  ChevronRight,
  Recycle,
  Truck,
  Leaf
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import type { State, Request, Device } from '../store';

interface Props {
  state: State;
  toast: (msg: string) => void;
}

export function CustomerDashboard({ state, toast }: Props) {
  const navigate = useNavigate();

  // Filter ONLY this customer's data
  const myDevices = state.devices.filter(
    (d) =>
      !d.ownerEmail ||
      (state.email && d.ownerEmail.toLowerCase() === state.email.toLowerCase()) ||
      (state.profile && d.owner && d.owner.toLowerCase() === state.profile.toLowerCase())
  );

  const myRequests = state.requests.filter(
    (r) =>
      !r.ownerEmail ||
      (state.email && r.ownerEmail.toLowerCase() === state.email.toLowerCase()) ||
      (state.profile && r.owner && r.owner.toLowerCase() === state.profile.toLowerCase())
  );

  const activeRequests = myRequests.filter(
    (r) => !['Completed', 'Cancelled', 'Rejected'].includes(r.status)
  );

  const completedRequests = myRequests.filter((r) => r.status === 'Completed');

  const upcomingPickups = myRequests.filter((r) => r.status === 'Pickup Scheduled');

  // Weekly activity
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: myRequests.filter(
        (r) => new Date(r.createdAt).toDateString() === date.toDateString()
      ).length,
    };
  });

  const firstName = state.profile ? state.profile.split(' ')[0] : 'Resident';

  return (
    <div className="customer-dashboard">
      {/* Page Title */}
      <div className="page-title">
        <div>
          <div className="eyebrow">YOUR CIRCULAR WORKSPACE</div>
          <h1>Good to see you, {firstName} 👋</h1>
          <p>Manage your electronics responsibly, one meaningful action at a time.</p>
        </div>
        <div className="page-title-actions">
          <Link to="/scan" className="btn btn-primary">
            <Plus size={17} /> New Smart Scan
          </Link>
          <Link to="/add" className="btn btn-secondary">
            <Package size={17} /> Add Device
          </Link>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div>
          <span>
            <Sparkles size={14} /> YOUR CIRCULAR JOURNEY
          </span>
          <h2>A better future starts with conscious choices.</h2>
          <p>
            Track every repaired, donated, or safely recycled device in real-time. Connect with verified local partners with zero guesswork.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <Link to="/scan" className="btn btn-primary" style={{ background: '#c7f36b', color: '#073b30' }}>
              Scan a device <ArrowUpRight size={17} />
            </Link>
            <Link to="/requests" className="btn btn-secondary" style={{ color: '#fff', borderColor: '#ffffff30' }}>
              View My Requests <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="welcome-graphic">
          <Recycle size={112} strokeWidth={0.7} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-head">
            <span>My Registered Devices</span>
            <div className="metric-icon" style={{ background: '#e5f7ec' }}>
              <Smartphone size={20} />
            </div>
          </div>
          <strong>{myDevices.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> In your private inventory
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Active Requests</span>
            <div className="metric-icon" style={{ background: '#e8efff' }}>
              <ClipboardList size={20} />
            </div>
          </div>
          <strong>{activeRequests.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> In progress & processing
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Upcoming Pickups</span>
            <div className="metric-icon" style={{ background: '#fff2da' }}>
              <Truck size={20} />
            </div>
          </div>
          <strong>{upcomingPickups.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Scheduled collection visits
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Completed Journeys</span>
            <div className="metric-icon" style={{ background: '#e4f7ec' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{completedRequests.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Given a second life
          </div>
        </div>
      </div>

      {/* 2-Column Section: Chart + Quick Actions */}
      <div className="dashboard-two">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Activity Overview</h3>
              <p>Your request submissions in the past 7 days</p>
            </div>
            <span className="tiny-pill">This week</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="act-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.27} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eff2ef" strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#91a29a', fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#91a29a', fontSize: 11 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#act-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel quick-actions">
          <div className="panel-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Everything you need, one click away</p>
            </div>
          </div>
          {[
            {
              icon: ScanLine,
              title: 'Smart Scan',
              desc: 'AI device recognition & pricing',
              to: '/scan',
            },
            {
              icon: Package,
              title: 'Add Device Manually',
              desc: 'Catalog your electronics inventory',
              to: '/add',
            },
            {
              icon: Sparkles,
              title: 'Smart Allocation',
              desc: 'Rule-based matching to partners',
              to: '/allocation',
            },
            {
              icon: Users,
              title: 'Explore Partners',
              desc: 'Find local collectors & repair hubs',
              to: '/partners',
            },
          ].map((a) => (
            <button
              onClick={() => navigate(a.to)}
              className="quick-action"
              key={a.title}
            >
              <span className="quick-icon">
                <a.icon size={20} />
              </span>
              <span>
                <strong>{a.title}</strong>
                <small>{a.desc}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>My Recent Requests</h3>
            <p>Real-time status of your repairs, donations, and collections</p>
          </div>
          <Link to="/requests" className="text-link">
            View all ({myRequests.length}) <ArrowRight size={15} />
          </Link>
        </div>

        {myRequests.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={32} color="#10b981" />
            <h3>No requests submitted yet</h3>
            <p>Scan a device or add one manually to initiate your first circular journey.</p>
            <Link to="/scan" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <ScanLine size={16} /> Start Smart Scan
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>REQUEST</th>
                  <th>DEVICE</th>
                  <th>SERVICE TYPE</th>
                  <th>ASSIGNED PARTNER</th>
                  <th>PICKUP / SCHEDULE</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {myRequests.slice(0, 5).map((r) => {
                  const partner = state.partners.find((p) => p.id === r.partnerId);
                  return (
                    <tr key={r.id}>
                      <td>
                        <b>{r.id}</b>
                      </td>
                      <td>
                        <strong>{r.deviceName}</strong>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.category}</div>
                      </td>
                      <td>
                        <span className={`action-chip ${r.action}`}>{r.action}</span>
                      </td>
                      <td>
                        {partner ? (
                          <div>
                            <b>{partner.name}</b>
                            <div style={{ fontSize: '11px', color: '#4b5563' }}>
                              {partner.locality} ({partner.type})
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        {r.pickupDate ? (
                          <div style={{ fontSize: '12px' }}>
                            <b>{r.pickupDate}</b>
                            <div style={{ color: '#6b7280' }}>{r.pickupSlot}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '12px' }}>Pending scheduling</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            r.status === 'Completed'
                              ? 'done'
                              : ['Cancelled', 'Rejected'].includes(r.status)
                              ? 'bad'
                              : 'pending'
                          }`}
                        >
                          <span />
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="btn btn-secondary"
                          to={`/requests/${r.id}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          View Details <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default CustomerDashboard;
