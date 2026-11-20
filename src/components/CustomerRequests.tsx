import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ClipboardList,
  Check,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  X,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  Smartphone,
  Info,
  PhoneCall,
  ChevronRight,
  Truck,
  Wrench,
  Heart,
  Recycle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { updateStatus, fetchRequests, type RequestItem } from '../services/apiService';
import { db, type Request, type Device, type Partner } from '../store';

const LIFECYCLE_STEPS = [
  'Pending',
  'Assigned',
  'Accepted',
  'Pickup Scheduled',
  'Collected',
  'Under Assessment',
  'Completed',
] as const;

const STATUS_EXPLANATIONS: Record<string, string> = {
  Pending: 'Your request has been submitted and is waiting for administrator review.',
  Assigned: 'A service partner has been assigned to your request.',
  Accepted: 'Your assigned partner has accepted the request.',
  'Pickup Scheduled': 'Your device pickup has been scheduled.',
  Collected: 'Your device has been collected successfully.',
  'Under Assessment': 'Your device is currently being assessed for repair, reuse, or recycling.',
  Completed: 'Your service request has been completed.',
  Cancelled: 'This request has been cancelled.',
  Rejected: 'This request was rejected. Please contact support for more information.',
  'Failed Pickup': 'The pickup could not be completed. Please wait for rescheduling.',
  'Reassignment Required': 'A new service partner needs to be assigned.',
};

const EXCEPTION_STATUSES = ['Cancelled', 'Rejected', 'Failed Pickup', 'Reassignment Required'];

interface CustomerRequestsProps {
  currentUser: { name: string; email?: string; role: string };
  devices: Device[];
  partners: Partner[];
  requests: Request[];
  initialSelectedId?: string;
  onUpdateRequest?: (updatedReq: Partial<Request> & { id: string }) => void;
  toast: (msg: string) => void;
}

function PhotoThumb({ id }: { id?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!id) return;
    let old = '';
    db.photos.get(id).then((p) => {
      if (p) {
        old = URL.createObjectURL(p.data);
        setUrl(old);
      }
    });
    return () => {
      if (old) URL.revokeObjectURL(old);
    };
  }, [id]);

  return url ? (
    <img
      src={url}
      alt="Device"
      style={{
        width: '56px',
        height: '56px',
        objectFit: 'cover',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    />
  ) : (
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
      }}
    >
      <Smartphone size={24} />
    </div>
  );
}

export function CustomerRequests({
  currentUser,
  devices,
  partners,
  requests,
  initialSelectedId,
  onUpdateRequest,
  toast,
}: CustomerRequestsProps) {
  const navigate = useNavigate();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected Request Drawer
  const [selectedReq, setSelectedReq] = useState<Request | null>(null);

  // Cancellation Modal State
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Auto-open initialSelectedId if provided via route /requests/:id
  useEffect(() => {
    if (initialSelectedId && requests.length > 0) {
      const found = requests.find((r) => r.id === initialSelectedId);
      if (found) {
        setSelectedReq(found);
      }
    }
  }, [initialSelectedId, requests]);

  // Keep selectedReq updated if parent requests change
  useEffect(() => {
    if (selectedReq) {
      const refreshed = requests.find((r) => r.id === selectedReq.id);
      if (refreshed) {
        setSelectedReq(refreshed);
      }
    }
  }, [requests]);

  // 1. FILTER ONLY THIS CUSTOMER'S REQUESTS (Strict Data Privacy)
  const myRequests = useMemo(() => {
    return requests.filter((r) => {
      if (currentUser.email && r.ownerEmail) {
        return r.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
      }
      if (currentUser.name && r.owner) {
        return r.owner.toLowerCase() === currentUser.name.toLowerCase();
      }
      return !r.ownerEmail;
    });
  }, [requests, currentUser]);

  // 2. APPLY SEARCH & FILTER
  const filteredRequests = useMemo(() => {
    return myRequests.filter((r) => {
      const device = devices.find((d) => d.id === r.deviceId);
      const partner = partners.find((p) => p.id === r.partnerId);

      const dName = r.deviceName || device?.name || '';
      const cat = r.category || device?.category || '';
      const pName = partner?.name || '';

      const matchesSearch =
        search.trim() === '' ||
        `${r.id} ${dName} ${cat} ${pName} ${r.status} ${r.action}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesAction = actionFilter === 'All' || r.action === actionFilter;

      return matchesSearch && matchesStatus && matchesAction;
    });
  }, [myRequests, devices, partners, search, statusFilter, actionFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const serverReqs = await fetchRequests({
        role: 'resident',
        userEmail: currentUser.email,
      });
      if (serverReqs && Array.isArray(serverReqs)) {
        serverReqs.forEach((sr) => {
          if (onUpdateRequest) {
            onUpdateRequest(sr as any);
          }
        });
      }
      toast('Requests refreshed');
    } catch {
      toast('Using local records');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 3. EXECUTE CUSTOMER CANCELLATION
  const handleConfirmCancel = async () => {
    if (!selectedReq) return;
    setCancelling(true);
    try {
      // Backend status update
      await updateStatus(selectedReq.id, 'Cancelled', currentUser.name, 'Cancelled by customer');

      const updatedHistory = [
        ...(selectedReq.history || []),
        {
          status: 'Cancelled',
          at: Date.now(),
          user: currentUser.name,
          note: 'Cancelled by customer',
        },
      ];

      const updatedReq: Request = {
        ...selectedReq,
        status: 'Cancelled',
        history: updatedHistory,
      };

      if (onUpdateRequest) {
        onUpdateRequest(updatedReq);
      }
      setSelectedReq(updatedReq);
      setConfirmCancelOpen(false);
      toast('Request cancelled successfully');
    } catch (err: any) {
      toast(err.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  // Determine if cancellation is allowed for current request
  const canCancel =
    selectedReq &&
    ['Pending', 'Assigned'].includes(selectedReq.status) &&
    selectedReq.status !== 'Cancelled';

  const associatedDevice = selectedReq
    ? devices.find((d) => d.id === selectedReq.deviceId)
    : null;
  const associatedPartner = selectedReq
    ? partners.find((p) => p.id === selectedReq.partnerId)
    : null;

  return (
    <div className="customer-requests-container" style={{ paddingBottom: '50px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#059669',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}
          >
            YOUR SERVICE REQUESTS
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            My E-Waste Requests
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, maxWidth: '650px' }}>
            Track your electronic waste collection, repair, reuse, and recycling requests in one place.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} /> Refresh
          </button>
          <Link
            to="/scan"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> New Request
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="filterbar"
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        <div className="searchbox" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} />
          <input
            placeholder="Search request ID, device, category, or partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '150px' }}
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
          style={{ minWidth: '130px' }}
        >
          <option value="All">All Services</option>
          <option value="repair">Repair</option>
          <option value="donate">Donate</option>
          <option value="recycle">Recycle</option>
        </select>

        <span className="tiny-pill" style={{ marginLeft: 'auto' }}>
          {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Customer Requests Table */}
      <div className="panel table-panel">
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '54px 20px' }}>
            <ClipboardList size={44} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#111827' }}>
              {search || statusFilter !== 'All' || actionFilter !== 'All'
                ? 'No matching requests found'
                : 'No requests submitted yet'}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 18px' }}>
              {search || statusFilter !== 'All' || actionFilter !== 'All'
                ? 'Try adjusting or clearing your filters to see your requests.'
                : 'Start by scanning an electronic item or registering a device from your home.'}
            </p>
            <Link to="/scan" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              <Plus size={16} /> Start Smart Scan
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>DEVICE NAME</th>
                  <th>DEVICE CATEGORY</th>
                  <th>REQUESTED SERVICE</th>
                  <th>ASSIGNED PARTNER</th>
                  <th>PICKUP DATE</th>
                  <th>CURRENT STATUS</th>
                  <th>SUBMITTED DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => {
                  const dev = devices.find((d) => d.id === r.deviceId);
                  const partner = partners.find((p) => p.id === r.partnerId);
                  const devName = r.deviceName || dev?.name || 'Electronic Item';
                  const devCat = r.category || dev?.category || 'Electronics';

                  return (
                    <tr key={r.id}>
                      <td>
                        <b style={{ color: '#065f46', fontFamily: 'monospace', fontSize: '12px' }}>
                          {r.id}
                        </b>
                      </td>
                      <td>
                        <strong>{devName}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>{devCat}</span>
                      </td>
                      <td>
                        <span className={`action-chip ${r.action}`} style={{ textTransform: 'capitalize' }}>
                          {r.action}
                        </span>
                      </td>
                      <td>
                        {partner ? (
                          <div>
                            <b style={{ fontSize: '12px', color: '#1f2937' }}>{partner.name}</b>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {partner.locality}
                            </div>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#9ca3af',
                              fontStyle: 'italic',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={12} /> Waiting for assignment
                          </span>
                        )}
                      </td>
                      <td>
                        {r.pickupDate ? (
                          <div style={{ fontSize: '12px' }}>
                            <b>{r.pickupDate}</b>
                            {r.pickupSlot && (
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                {r.pickupSlot}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            Pending scheduling
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
                      <td>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedReq(r)}
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
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* READ-ONLY CUSTOMER REQUEST DETAILS DRAWER */}
      {selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 900,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSelectedReq(null)}
        >
          <div
            style={{
              width: '580px',
              maxWidth: '96vw',
              height: '100vh',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 30px rgba(0,0,0,0.18)',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #f3f4f6',
                paddingBottom: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    fontWeight: 800,
                    color: '#059669',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  REQUEST DETAILS
                </span>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#111827',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedReq.id}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className={`status-badge ${
                      selectedReq.status === 'Completed'
                        ? 'done'
                        : ['Cancelled', 'Rejected', 'Failed Pickup'].includes(selectedReq.status)
                        ? 'bad'
                        : 'pending'
                    }`}
                  >
                    <span /> {selectedReq.status}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    Submitted {new Date(selectedReq.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  color: '#6b7280',
                }}
                title="Close details"
              >
                <X size={22} />
              </button>
            </div>

            {/* SECTION A: REQUEST INFORMATION */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Smartphone size={15} color="#059669" /> SECTION A: REQUEST INFORMATION
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <PhotoThumb id={associatedDevice?.photoId} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#111827' }}>
                    {selectedReq.deviceName || associatedDevice?.name || 'Electronic Item'}
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                        Device Category:
                      </span>
                      <b>{selectedReq.category || associatedDevice?.category || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                        Condition:
                      </span>
                      <b>{selectedReq.condition || associatedDevice?.condition || 'Fair'}</b>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                        Requested Service:
                      </span>
                      <span
                        className={`action-chip ${selectedReq.action}`}
                        style={{ display: 'inline-block', marginTop: '2px', textTransform: 'capitalize' }}
                      >
                        {selectedReq.action}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                        Submission Date:
                      </span>
                      <b>
                        {new Date(selectedReq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: COLLECTION INFORMATION */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Truck size={15} color="#059669" /> SECTION B: COLLECTION INFORMATION
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                    Assigned Partner:
                  </span>
                  {associatedPartner ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <div>
                        <b style={{ color: '#166534', fontSize: '13px' }}>{associatedPartner.name}</b>
                        <div style={{ fontSize: '11px', color: '#4b5563' }}>
                          <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                          {associatedPartner.locality} ({associatedPartner.pincode})
                        </div>
                      </div>
                      <span className="tiny-pill" style={{ background: '#dcfce7', color: '#15803d' }}>
                        ✓ Assigned
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        color: '#92400e',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        marginTop: '4px',
                      }}
                    >
                      Waiting for administrator assignment.
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                    Pickup Address:
                  </span>
                  <b>{selectedReq.address || 'Address provided during pickup scheduling'}</b>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                      Scheduled Pickup Date:
                    </span>
                    {selectedReq.pickupDate ? (
                      <b style={{ color: '#065f46' }}>
                        {selectedReq.pickupDate} {selectedReq.pickupSlot && `(${selectedReq.pickupSlot})`}
                      </b>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        Pickup not scheduled yet.
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: '#6b7280', display: 'block', fontSize: '11px' }}>
                      Current Status:
                    </span>
                    <b>{selectedReq.status}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION C: COLLECTION PROGRESS TRACKER (READ-ONLY) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '18px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={15} color="#059669" /> SECTION C: COLLECTION PROGRESS TRACKER
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#e5e7eb',
                    color: '#4b5563',
                    fontWeight: 600,
                  }}
                >
                  READ-ONLY
                </span>
              </div>

              {/* Exception State Banner if Cancelled or Rejected */}
              {EXCEPTION_STATUSES.includes(selectedReq.status) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    backgroundColor: selectedReq.status === 'Cancelled' ? '#fef2f2' : '#fff7ed',
                    border: `1px solid ${selectedReq.status === 'Cancelled' ? '#fecaca' : '#fed7aa'}`,
                    borderRadius: '8px',
                    color: selectedReq.status === 'Cancelled' ? '#991b1b' : '#9a3412',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Status Exception: {selectedReq.status}</strong>
                    <div style={{ fontSize: '11px' }}>{STATUS_EXPLANATIONS[selectedReq.status]}</div>
                  </div>
                </div>
              )}

              {/* 7-Step Vertical/Horizontal Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = LIFECYCLE_STEPS.indexOf(selectedReq.status as any);
                  const isException = EXCEPTION_STATUSES.includes(selectedReq.status);

                  const isDone = !isException && currentIdx > idx;
                  const isCurrent = !isException && currentIdx === idx;
                  const isFuture = isException || currentIdx < idx;

                  // Find timestamp from history if available
                  const historyEvent = selectedReq.history?.find((h) => h.status === step);

                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'flex-start', minHeight: '48px' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          marginRight: '12px',
                        }}
                      >
                        {/* Circle */}
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isCurrent ? '#059669' : isDone ? '#10b981' : '#f3f4f6',
                            color: isCurrent || isDone ? '#ffffff' : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            boxShadow: isCurrent ? '0 0 0 3px #a7f3d0' : 'none',
                            zIndex: 2,
                          }}
                        >
                          {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                        </div>
                        {/* Connecting Line */}
                        {idx < LIFECYCLE_STEPS.length - 1 && (
                          <div
                            style={{
                              width: '2px',
                              height: '28px',
                              backgroundColor: isDone ? '#10b981' : '#e5e7eb',
                              marginTop: '2px',
                            }}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, paddingBottom: idx < LIFECYCLE_STEPS.length - 1 ? '10px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                              color: isCurrent ? '#065f46' : isDone ? '#1f2937' : '#9ca3af',
                            }}
                          >
                            {step}
                          </span>
                          {historyEvent && (
                            <span style={{ fontSize: '10px', color: '#6b7280' }}>
                              {new Date(historyEvent.at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              {new Date(historyEvent.at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        {isCurrent && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#059669',
                              fontWeight: 600,
                              marginTop: '2px',
                            }}
                          >
                            ● Current Stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION D: STATUS MESSAGE */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <Info size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#065f46',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  SECTION D: STATUS ADVISORY
                </span>
                <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.45 }}>
                  {STATUS_EXPLANATIONS[selectedReq.status] ||
                    'Your request is being processed through the E-Cycle circular network.'}
                </p>
              </div>
            </div>

            {/* SECTION E: CUSTOMER REQUEST CANCELLATION */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#374151',
                  marginBottom: '10px',
                }}
              >
                REQUEST ACTIONS
              </div>

              {canCancel ? (
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
                    Need to cancel this request? You can cancel while it is awaiting administrator
                    review or initial partner acceptance.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmCancelOpen(true)}
                    style={{
                      borderColor: '#fca5a5',
                      color: '#b91c1c',
                      backgroundColor: '#fff1f2',
                      fontSize: '12px',
                      padding: '8px 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <X size={15} /> Cancel Request
                  </button>
                </div>
              ) : selectedReq.status === 'Cancelled' ? (
                <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                  This request has been cancelled.
                </div>
              ) : selectedReq.status === 'Completed' ? (
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                  ✓ This service request has been successfully completed and archived.
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '12px', color: '#4b5563', margin: '0 0 8px' }}>
                    This request has been accepted and is actively coordinated with your assigned partner.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#059669',
                      fontWeight: 600,
                    }}
                  >
                    <PhoneCall size={15} /> For cancellation or rescheduling, please contact E-Cycle
                    Support or your partner.
                  </div>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedReq(null)}
                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR CUSTOMER CANCELLATION */}
      {confirmCancelOpen && selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
          onClick={() => !cancelling && setConfirmCancelOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#b91c1c',
                marginBottom: '12px',
              }}
            >
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
                Cancel E-Waste Request
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', lineHeight: 1.5 }}>
              Are you sure you want to cancel this e-waste request?
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.4 }}>
              Request ID: <strong>{selectedReq.id}</strong> ({selectedReq.deviceName || 'Device'}). Any
              assigned collection slots or partner coordination will be released.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmCancelOpen(false)}
                disabled={cancelling}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Keep Request
              </button>
              <button
                className="btn"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
