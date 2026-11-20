import React, { useEffect, useState } from 'react';
import {
  Search,
  Check,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
  X,
  Clock,
  ArrowRight,
  FileText,
  UserCheck,
  ShieldCheck,
  Smartphone,
  ClipboardList,
} from 'lucide-react';
import {
  fetchRequests,
  fetchPartners,
  assignRequestPartner,
  updateStatus,
  addInternalNote,
  type RequestItem,
  type PartnerItem,
} from '../services/apiService';

const LIFECYCLE_STEPS = [
  'Pending',
  'Assigned',
  'Accepted',
  'Pickup Scheduled',
  'Collected',
  'Under Assessment',
  'Completed',
];

const EXCEPTION_STATUSES = ['Cancelled', 'Rejected', 'Failed Pickup', 'Reassignment Required'];

interface RequestManagerProps {
  currentUser: { name: string; role: string; partnerId?: string | null; email?: string };
  toast: (msg: string) => void;
}

export function RequestManager({ currentUser, toast }: RequestManagerProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  // Selected Request Modal / Drawer
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('10:00–12:00');
  const [weightInput, setWeightInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reqList, partnerList] = await Promise.all([
        fetchRequests({
          search,
          status: statusFilter,
          action: actionFilter,
          partnerId: currentUser.role === 'partner' || currentUser.role === 'technician' ? currentUser.partnerId || undefined : undefined,
        }),
        fetchPartners(),
      ]);
      setRequests(reqList);
      setPartners(partnerList);
    } catch (err: any) {
      toast(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [search, statusFilter, actionFilter]);

  const openDetails = (req: RequestItem) => {
    setSelectedReq(req);
    setSelectedPartnerId(req.partnerId || '');
    setOverrideReason('');
    setNoteInput('');
    setPickupDate(req.pickupDate || '');
    setPickupSlot(req.pickupSlot || '10:00–12:00');
    setWeightInput(req.weight ? String(req.weight) : '');
  };

  const handleAssign = async () => {
    if (!selectedReq || !selectedPartnerId) {
      toast('Please select an eligible partner');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await assignRequestPartner(
        selectedReq.id,
        selectedPartnerId,
        currentUser.name,
        overrideReason
      );
      toast(`Assigned ${selectedReq.id} to ${updated.partnerName}`);
      setSelectedReq(updated);
      await loadAll();
    } catch (err: any) {
      toast(err.message || 'Failed to assign partner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReq) return;

    setActionLoading(true);
    try {
      const updated = await updateStatus(
        selectedReq.id,
        newStatus,
        currentUser.name,
        `Status updated to ${newStatus}`,
        {
          pickupDate: pickupDate || undefined,
          pickupSlot: pickupSlot || undefined,
          weight: weightInput ? Number(weightInput) : undefined,
        }
      );
      toast(`Status updated to ${newStatus}`);
      setSelectedReq(updated);
      await loadAll();
    } catch (err: any) {
      toast(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedReq || !noteInput.trim()) return;
    try {
      const updatedNotes = await addInternalNote(selectedReq.id, noteInput.trim(), currentUser.name);
      setSelectedReq({ ...selectedReq, internalNotes: updatedNotes });
      setNoteInput('');
      toast('Internal note recorded.');
      await loadAll();
    } catch (err: any) {
      toast(err.message || 'Failed to add note');
    }
  };

  // Filter eligible partners for current request
  const eligiblePartners = selectedReq
    ? partners.filter(
        (p) =>
          p.type === selectedReq.action &&
          p.available &&
          p.categories.includes(selectedReq.category) &&
          (p.active < p.capacity || p.id === selectedReq.partnerId)
      )
    : [];

  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#059669' }}>
            LIFECYCLE MANAGEMENT
          </span>
          <h2 style={{ fontSize: '26px', margin: '4px 0 0', fontWeight: 700 }}>
            {isAdmin ? 'E-Waste Request Ledger' : 'All Requests'}
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
            Follow every device through the 7-stage collection and assessment lifecycle.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} size={15} /> Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filterbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div className="searchbox" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} />
          <input
            placeholder="Search request ID, customer, item, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {LIFECYCLE_STEPS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {EXCEPTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="All">All Actions</option>
          <option value="repair">Repair</option>
          <option value="donate">Donate</option>
          <option value="recycle">Recycle</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="panel table-panel">
        {loading && requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>
            <RefreshCw className="spin" size={26} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <ClipboardList size={38} color="#9ca3af" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>No requests match your filters</h4>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>CUSTOMER</th>
                  <th>DEVICE & CATEGORY</th>
                  <th>CONDITION</th>
                  <th>LOCATION</th>
                  <th>ACTION</th>
                  <th>ASSIGNED PARTNER</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b style={{ color: '#047857' }}>{r.id}</b>
                    </td>
                    <td>
                      <div>
                        <b>{r.owner}</b>
                        <small style={{ display: 'block', color: '#9ca3af', fontSize: '9px' }}>
                          {r.ownerEmail || 'Resident'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{r.deviceName}</strong>
                        <span style={{ display: 'block', fontSize: '9px', color: '#6b7280' }}>{r.category}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor:
                            r.condition === 'Like New' || r.condition === 'Good'
                              ? '#dcfce7'
                              : r.condition === 'Fair'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            r.condition === 'Like New' || r.condition === 'Good'
                              ? '#166534'
                              : r.condition === 'Fair'
                              ? '#92400e'
                              : '#991b1b',
                        }}
                      >
                        {r.condition}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} color="#059669" /> {r.locality} ({r.pincode})
                      </span>
                    </td>
                    <td>
                      <span className={`action-chip ${r.action}`}>{r.action}</span>
                    </td>
                    <td>
                      {r.partnerName ? (
                        <span style={{ fontSize: '11px', color: '#1f2937' }}>
                          {r.partnerName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600 }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          r.status === 'Completed'
                            ? 'done'
                            : ['Cancelled', 'Rejected', 'Failed Pickup'].includes(r.status)
                            ? 'bad'
                            : 'pending'
                        }`}
                      >
                        <span /> {r.status}
                      </span>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => openDetails(r)}
                        style={{ padding: '6px 10px', fontSize: '10px' }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Management Drawer / Modal */}
      {selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '580px',
              maxWidth: '95vw',
              height: '100vh',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 25px rgba(0,0,0,0.15)',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#059669' }}>
                  REQUEST DETAILS
                </span>
                <h3 style={{ margin: '4px 0 2px', fontSize: '20px' }}>{selectedReq.id}</h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                  Submitted by {selectedReq.owner} on {new Date(selectedReq.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Device Info Summary */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: '#6b7280', display: 'block' }}>Device:</span>
                <b>{selectedReq.deviceName}</b>
              </div>
              <div>
                <span style={{ color: '#6b7280', display: 'block' }}>Category:</span>
                <b>{selectedReq.category}</b>
              </div>
              <div>
                <span style={{ color: '#6b7280', display: 'block' }}>Reported Condition:</span>
                <b>{selectedReq.condition}</b>
              </div>
              <div>
                <span style={{ color: '#6b7280', display: 'block' }}>Requested Action:</span>
                <span className={`action-chip ${selectedReq.action}`}>{selectedReq.action}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#6b7280', display: 'block' }}>Pickup Address:</span>
                <b>
                  {selectedReq.address || 'Street address not given'} ({selectedReq.locality}, {selectedReq.pincode})
                </b>
              </div>
            </div>

            {/* Partner Allocation Section (Module 1.4) */}
            {isAdmin && (
              <div
                style={{
                  border: '1.5px solid #d1fae5',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={16} color="#059669" /> Collector & Repair Partner Allocation
                </h4>

                <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Select Eligible Partner:
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #a7f3d0',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    marginBottom: '10px',
                  }}
                >
                  <option value="">-- Choose Partner --</option>
                  {eligiblePartners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.locality}) — {p.capacity - p.active} slots left {p.isRealProvider ? '✓ Verified' : '(Demo)'}
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: '11px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Assignment / AI Override Note:
                </label>
                <input
                  placeholder="Optional justification or scheduling note..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #a7f3d0',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    marginBottom: '12px',
                  }}
                />

                <button
                  className="btn btn-primary"
                  onClick={handleAssign}
                  disabled={actionLoading || !selectedPartnerId}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '11px' }}
                >
                  {selectedReq.partnerId ? 'Reassign Partner' : 'Confirm Assignment'} <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Lifecycle Status Progression (Module 1.6) */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#3b82f6" /> Collection Status Progression
              </h4>

              {/* Visual 7-step tracker */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = LIFECYCLE_STEPS.indexOf(selectedReq.status);
                  const isDone = currentIdx >= idx && currentIdx !== -1;
                  const isCurrent = selectedReq.status === step;

                  return (
                    <span
                      key={step}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '9px',
                        fontWeight: isCurrent ? 700 : 500,
                        backgroundColor: isCurrent ? '#059669' : isDone ? '#d1fae5' : '#f3f4f6',
                        color: isCurrent ? '#ffffff' : isDone ? '#065f46' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isDone && <Check size={10} />} {step}
                    </span>
                  );
                })}
              </div>

              {/* Status Update Actions (Admin Only) */}
              {isAdmin && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    {LIFECYCLE_STEPS.map((st) => (
                      <button
                        key={st}
                        className="btn btn-secondary"
                        onClick={() => handleStatusChange(st)}
                        disabled={actionLoading || selectedReq.status === st}
                        style={{
                          fontSize: '10px',
                          padding: '7px',
                          borderColor: selectedReq.status === st ? '#10b981' : undefined,
                        }}
                      >
                        Mark {st}
                      </button>
                    ))}
                  </div>

                  {/* Exception statuses */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {EXCEPTION_STATUSES.map((exc) => (
                      <button
                        key={exc}
                        onClick={() => handleStatusChange(exc)}
                        disabled={actionLoading || selectedReq.status === exc}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #fca5a5',
                          backgroundColor: '#fff1f2',
                          color: '#be123c',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        {exc}
                      </button>
                    ))}
                  </div>

                  {/* Additional Fields: Weight & Scheduling */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#6b7280', display: 'block' }}>Pickup Date</label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#6b7280', display: 'block' }}>Handled Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 2.5"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Internal Notes Section (Admin Only) */}
            {isAdmin && (
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#4b5563" /> Internal Administrative Notes
                </h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    placeholder="Record an inspection or coordination note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '11px',
                    }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={handleAddNote}
                    style={{ fontSize: '10px', padding: '7px 12px' }}
                  >
                    Add Note
                  </button>
                </div>

                {selectedReq.internalNotes && selectedReq.internalNotes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedReq.internalNotes.map((note, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: '#374151',
                        }}
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chronological Audit Timeline */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#059669" /> Complete Status History
              </h4>
              <div className="timeline" style={{ padding: '4px 0' }}>
                {selectedReq.history.map((h, i) => (
                  <div className="timeline-event" key={i}>
                    <span className="timeline-dot">
                      <Check size={12} />
                    </span>
                    <div>
                      <b>{h.status}</b>
                      <span>
                        {new Date(h.at).toLocaleString('en-IN')} by <strong>{h.user}</strong>
                      </span>
                      {h.note && <p>{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
