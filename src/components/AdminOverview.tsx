import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Smartphone,
  ClipboardList,
  Clock,
  UserCheck,
  Calendar,
  PackageCheck,
  Recycle,
  Wrench,
  Truck,
  Weight,
  RefreshCw,
  AlertCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchAdminStats, type AdminStatsData } from '../services/apiService';

const PIE_COLORS = ['#3b82f6', '#10b981', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load live statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#10b981' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '13px', color: '#4b5563' }}>Loading real-time admin metrics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="warning" style={{ margin: '30px 0' }}>
        <AlertCircle size={20} />
        <div>
          <strong>Error loading live dashboard statistics:</strong>
          <p style={{ margin: '4px 0 0' }}>{error}</p>
          <button className="btn btn-secondary" onClick={loadData} style={{ marginTop: '10px' }}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const s = stats!;

  // 12 Required Metrics
  const metricsList = [
    { title: 'Total Registered Users', value: s.totalUsers, icon: Users, tint: '#e8efff', color: '#2563eb' },
    { title: 'Registered Devices', value: s.totalDevices, icon: Smartphone, tint: '#e6f7ec', color: '#16a34a' },
    { title: 'Total E-Waste Requests', value: s.totalRequests, icon: ClipboardList, tint: '#f3e8ff', color: '#9333ea' },
    { title: 'Pending Requests', value: s.pendingRequests, icon: Clock, tint: '#fef3c7', color: '#d97706' },
    { title: 'Assigned Requests', value: s.assignedRequests, icon: UserCheck, tint: '#e0f2fe', color: '#0284c7' },
    { title: 'Scheduled Pickups', value: s.scheduledPickups, icon: Calendar, tint: '#ffedd5', color: '#ea580c' },
    { title: 'Collected Devices', value: s.collectedDevices, icon: PackageCheck, tint: '#dcfce7', color: '#15803d' },
    { title: 'Completed Recycling', value: s.completedRecycling, icon: Recycle, tint: '#ccfbf1', color: '#0f766e' },
    { title: 'Completed Repairs', value: s.completedRepair, icon: Wrench, tint: '#e0e7ff', color: '#4338ca' },
    { title: 'Active Collectors', value: s.activeCollectors, icon: Truck, tint: '#fee2e2', color: '#dc2626' },
    { title: 'Active Repair Partners', value: s.activeRepairPartners, icon: Wrench, tint: '#fae8ff', color: '#c026d3' },
    { title: 'E-Waste Handled (kg)', value: `${s.estimatedWeightKg} kg`, icon: Weight, tint: '#f1f5f9', color: '#334155' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#059669' }}>
            OPERATIONS & GOVERNANCE
          </span>
          <h2 style={{ fontSize: '26px', margin: '4px 0 0', fontWeight: 700 }}>Administrator Control Center</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
            Real-time analytics aggregated directly from active database records.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={loadData}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw className={loading ? 'spin' : ''} size={15} /> Refresh Data
        </button>
      </div>

      {/* 12 Key Statistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '26px',
        }}
      >
        {metricsList.map((m, idx) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className="metric"
            style={{ padding: '16px 18px' }}
          >
            <div className="metric-head">
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{m.title}</span>
              <div className="metric-icon" style={{ backgroundColor: m.tint, color: m.color }}>
                <m.icon size={18} />
              </div>
            </div>
            <strong style={{ fontSize: '24px', margin: '8px 0 2px' }}>{m.value}</strong>
            <div className="metric-sub" style={{ fontSize: '9px' }}>
              <span className="green-dot" /> Live DB record
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Chart 1: Request Volume Trends */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#10b981" /> Request Intake Trend (Last 7 Days)
              </h3>
              <p>Daily incoming e-waste and service requests</p>
            </div>
            <span className="tiny-pill">Daily Activity</span>
          </div>
          <div style={{ height: '230px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.dailyTrends}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fill="url(#reqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Service Distribution (Repair vs Donate vs Recycle) */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Recycle size={18} color="#0d9488" /> Service Action Breakdown
              </h3>
              <p>Repair, reuse, and recycling distribution</p>
            </div>
            <span className="tiny-pill">Circular Pathways</span>
          </div>
          <div style={{ height: '230px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={s.actionData.some((x) => x.value > 0) ? s.actionData : [{ name: 'None', value: 1 }]}
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {s.actionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'Repair' ? '#3b82f6' : entry.name === 'Donation' ? '#10b981' : '#0d9488'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <strong style={{ fontSize: '26px', display: 'block', color: '#111827' }}>{s.totalRequests}</strong>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Total Jobs</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '6px' }}>
            {s.actionData.map((item) => (
              <span key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: item.name === 'Repair' ? '#3b82f6' : item.name === 'Donation' ? '#10b981' : '#0d9488',
                  }}
                />
                {item.name}: <b>{item.value}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Distribution & Partner Capacity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>
        {/* Device Categories */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Device Categories Handled</h3>
              <p>Top registered e-waste hardware types</p>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={s.categoryData} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {s.categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {s.categoryData.map((cat, i) => (
              <span
                key={cat.name}
                style={{
                  fontSize: '10px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  color: '#374151',
                }}
              >
                <i
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    marginRight: '6px',
                  }}
                />
                {cat.name}: <b>{cat.value}</b>
              </span>
            ))}
          </div>
        </div>

        {/* Partner Capacity & Performance */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#6366f1" /> Partner Performance & Capacity
              </h3>
              <p>Active workload vs. maximum allocated collection capacity</p>
            </div>
          </div>
          <div style={{ height: '240px', marginTop: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.partnerPerformance} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="active" name="Active Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Total Capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px', fontSize: '10px', color: '#6b7280' }}>
            <span><i style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#3b82f6', marginRight: '5px' }} /> Active Jobs</span>
            <span><i style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#cbd5e1', marginRight: '5px' }} /> Capacity Ceiling</span>
            <span><i style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', marginRight: '5px' }} /> Completed</span>
          </div>
        </div>
      </div>
    </>
  );
}
