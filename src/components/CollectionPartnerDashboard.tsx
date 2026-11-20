import React, { useState, useEffect } from 'react';
import {
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Scale,
  XCircle,
  FileText,
  AlertCircle,
  User,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Phone,
  Eye,
  Check
} from 'lucide-react';
import {
  fetchRequests,
  updateStatus,
  fetchPartners,
  type RequestItem,
  type PartnerItem,
  type UserSession,
} from '../services/apiService';

interface Props {
  currentUser: UserSession;
  toast: (msg: string) => void;
}

export function CollectionPartnerDashboard({ currentUser, toast }: Props) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [partner, setPartner] = useState<PartnerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'assigned' | 'schedule' | 'history' | 'profile'>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('1.5');
  const [collectionNote, setCollectionNote] = useState('');
  const [handoverCodeInput, setHandoverCodeInput] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().slice(0, 10));
  const [pickupSlot, setPickupSlot] = useState('10:00–12:00');
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load partners to get current partner profile
      const allPartners = await fetchPartners();
      const myPartner = allPartners.find((p) => p.id === currentUser.partnerId) || null;
      setPartner(myPartner);

      // Load partner requests
      const data = await fetchRequests({
        partnerId: currentUser.partnerId || undefined,
        role: 'partner',
      });
      setRequests(data);
    } catch (err: any) {
      toast(err.message || 'Error loading partner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Derived counts
  const assigned = requests.filter((r) => r.status === 'Assigned');
  const accepted = requests.filter((r) => r.status === 'Accepted');
  const scheduled = requests.filter((r) => r.status === 'Pickup Scheduled');
  const collected = requests.filter((r) => r.status === 'Collected' || r.status === 'Under Assessment');
  const completed = requests.filter((r) => r.status === 'Completed');
  const activeJobs = requests.filter((r) => !['Completed', 'Cancelled', 'Rejected'].includes(r.status));

  const totalWeightKg = requests.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);

  // Actions
  const handleAccept = async (req: RequestItem) => {
    setUpdating(true);
    try {
      await updateStatus(req.id, 'Accepted', currentUser.name, 'Collection partner accepted assignment');
      toast(`Request ${req.id} accepted`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to accept');
    } finally {
      setUpdating(false);
    }
  };

  const handleDecline = async (req: RequestItem) => {
    const reason = prompt('Please specify a reason for declining this collection:');
    if (!reason) return;
    setUpdating(true);
    try {
      await updateStatus(req.id, 'Rejected', currentUser.name, `Declined by partner: ${reason}`);
      toast(`Request ${req.id} declined`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to decline');
    } finally {
      setUpdating(false);
    }
  };

  const handleSchedulePickup = async () => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      await updateStatus(
        selectedRequest.id,
        'Pickup Scheduled',
        currentUser.name,
        `Pickup scheduled for ${pickupDate} during ${pickupSlot}`,
        { pickupDate, pickupSlot }
      );
      toast(`Pickup scheduled for ${selectedRequest.id}`);
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to schedule');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!selectedRequest) return;
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) {
      toast('Please enter a valid weight in kg');
      return;
    }
    setUpdating(true);
    try {
      await updateStatus(
        selectedRequest.id,
        'Collected',
        currentUser.name,
        `Device securely collected. Weight: ${w} kg. Note: ${collectionNote || 'Standard collection verification'}`,
        {
          weight: w,
          collectionNotes: collectionNote,
          handoverCode: handoverCodeInput || undefined,
        }
      );
      toast(`Device marked as Collected (${w} kg recorded)`);
      setIsCollectModalOpen(false);
      setCollectionNote('');
      setHandoverCodeInput('');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to record collection');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkCompleted = async (req: RequestItem) => {
    setUpdating(true);
    try {
      await updateStatus(
        req.id,
        'Completed',
        currentUser.name,
        'Collection processing & transfer to recycling facility completed.'
      );
      toast(`Request ${req.id} completed!`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to complete');
    } finally {
      setUpdating(false);
    }
  };

  // Filtered requests for table
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.deviceName.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase()) ||
      (r.locality && r.locality.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'assigned') {
      return ['Assigned', 'Accepted'].includes(r.status);
    }
    if (activeTab === 'schedule') {
      return r.status === 'Pickup Scheduled';
    }
    if (activeTab === 'history') {
      return ['Collected', 'Completed', 'Cancelled', 'Rejected'].includes(r.status);
    }

    if (statusFilter !== 'All') {
      return r.status === statusFilter;
    }
    return true;
  });

  return (
    <div className="partner-dashboard-wrapper">
      {/* Header with Role Title & Action Button */}
      <div className="page-title">
        <div>
          <div className="eyebrow">COLLECTION PARTNER CONTROL CENTER</div>
          <h1>{partner?.name || 'EcoLoop Operations'}</h1>
          <p>
            Authorized e-waste collection, logistics tracking, and verified material recovery for{' '}
            {partner?.locality || 'Mumbai North'}.
          </p>
        </div>
        <div className="page-title-actions">
          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('assigned')}
          >
            <Truck size={17} /> View Assigned Collections ({assigned.length})
          </button>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-head">
            <span>Assigned Collections</span>
            <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Truck size={20} />
            </div>
          </div>
          <strong>{assigned.length + accepted.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> {assigned.length} awaiting acceptance
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Pending Pickups</span>
            <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Calendar size={20} />
            </div>
          </div>
          <strong>{scheduled.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Pickups on schedule
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Collected in Transit</span>
            <div className="metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Clock size={20} />
            </div>
          </div>
          <strong>{collected.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Under sorting/transit
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Completed Recycling</span>
            <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{completed.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Delivered to smelters
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Total Weight Handled</span>
            <div className="metric-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
              <Scale size={20} />
            </div>
          </div>
          <strong>{totalWeightKg.toFixed(1)} <small>kg</small></strong>
          <div className="metric-sub">
            <span className="green-dot" /> Diverted from landfills
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Capacity Slots</span>
            <div className="metric-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <strong>
            {partner?.capacity ? `${activeJobs.length} / ${partner.capacity}` : 'Active'}
          </strong>
          <div className="metric-sub">
            <span className="green-dot" /> Verified collection partner
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="panel" style={{ padding: '8px 16px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview & Queue', icon: Truck },
            { id: 'assigned', label: `Assigned Collections (${assigned.length + accepted.length})`, icon: Clock },
            { id: 'schedule', label: `Pickup Schedule (${scheduled.length})`, icon: Calendar },
            { id: 'history', label: `Collection History (${completed.length + collected.length})`, icon: CheckCircle2 },
            { id: 'profile', label: 'Partner Profile & Area', icon: User },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={activeTab === t.id ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && partner && (
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-heading">
            <div>
              <h3>Authorized Partner Profile</h3>
              <p>Registered partner details, operational boundaries, and licensing.</p>
            </div>
            <span className="tiny-pill" style={{ background: '#dcfce7', color: '#166534' }}>
              ✓ Government Verified
            </span>
          </div>

          <div className="detail-list" style={{ marginTop: '1rem' }}>
            <div>
              <span>Entity Name</span>
              <b>{partner.name}</b>
            </div>
            <div>
              <span>Service Type</span>
              <b style={{ textTransform: 'capitalize' }}>E-Waste Recycling & Collection ({partner.type})</b>
            </div>
            <div>
              <span>Locality & Hub</span>
              <b>{partner.locality}, PIN {partner.pincode}</b>
            </div>
            <div>
              <span>Daily Handling Capacity</span>
              <b>{partner.capacity} active job units ({partner.capacity - activeJobs.length} currently available)</b>
            </div>
            <div>
              <span>Primary Contact</span>
              <b>{partner.contactPerson || 'Logistics Coordinator'} ({partner.phone || '+91 98205 56789'})</b>
            </div>
            <div>
              <span>Specialization</span>
              <b>{partner.specialization}</b>
            </div>
            <div>
              <span>Accepted Categories</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {partner.categories.map((c) => (
                  <span key={c} className="tiny-pill" style={{ background: '#f0fdf4', color: '#166534' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Panel */}
      {activeTab !== 'profile' && (
        <div className="panel table-panel">
          <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3>
                {activeTab === 'assigned'
                  ? 'Assigned Collections Queue'
                  : activeTab === 'schedule'
                  ? 'Scheduled Pickup Appointments'
                  : activeTab === 'history'
                  ? 'Completed Collections & Transfer History'
                  : 'Live Collection Requests'}
              </h3>
              <p>Review customer details, schedule logistics, and record collected weights.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="searchbox" style={{ maxWidth: '240px' }}>
                <Search size={16} />
                <input
                  placeholder="Search collections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {activeTab === 'overview' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cfded4',
                    background: '#fbfdfb',
                    fontSize: '13px',
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Pickup Scheduled">Pickup Scheduled</option>
                  <option value="Collected">Collected</option>
                  <option value="Completed">Completed</option>
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#667d6f' }}>
              <RefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
              <div>Loading collection assignments...</div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <Truck size={36} color="#10b981" />
              <h3>No requests found in this queue</h3>
              <p>
                {activeTab === 'assigned'
                  ? 'No new collections pending acceptance. New assignments from customers and admin will appear here.'
                  : activeTab === 'schedule'
                  ? 'No pickups currently scheduled. Open an accepted collection to schedule a date.'
                  : 'No records matching the filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>REQUEST</th>
                    <th>DEVICE</th>
                    <th>CUSTOMER & ADDRESS</th>
                    <th>SCHEDULE / SLOT</th>
                    <th>WEIGHT</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.id}</b>
                        <br />
                        <small style={{ color: '#6b7280' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </small>
                      </td>
                      <td>
                        <strong>{r.deviceName}</strong>
                        <br />
                        <span className="tiny-pill" style={{ background: '#f3f4f6', color: '#374151' }}>
                          {r.category}
                        </span>
                      </td>
                      <td>
                        <b>{r.owner}</b>
                        <div style={{ fontSize: '12px', color: '#4b5563', maxWidth: '220px' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          {r.address || `${r.locality || 'Locality not specified'}, PIN ${r.pincode}`}
                        </div>
                      </td>
                      <td>
                        {r.pickupDate ? (
                          <div>
                            <b>{r.pickupDate}</b>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.pickupSlot}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>
                            Not scheduled
                          </span>
                        )}
                      </td>
                      <td>
                        <b>{r.weight ? `${r.weight} kg` : '—'}</b>
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
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {r.status === 'Assigned' && (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => handleAccept(r)}
                                disabled={updating}
                              >
                                <Check size={14} /> Accept
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px', color: '#dc2626' }}
                                onClick={() => handleDecline(r)}
                                disabled={updating}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {r.status === 'Accepted' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => {
                                setSelectedRequest(r);
                                setIsScheduleModalOpen(true);
                              }}
                            >
                              <Calendar size={14} /> Schedule Pickup
                            </button>
                          )}

                          {r.status === 'Pickup Scheduled' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => {
                                setSelectedRequest(r);
                                setWeightInput(r.weight ? String(r.weight) : '2.0');
                                setIsCollectModalOpen(true);
                              }}
                            >
                              <Scale size={14} /> Mark Collected
                            </button>
                          )}

                          {r.status === 'Collected' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => handleMarkCompleted(r)}
                              disabled={updating}
                            >
                              <CheckCircle2 size={14} /> Mark Completed
                            </button>
                          )}

                          {r.status === 'Completed' && (
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                              ✓ Processed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {isScheduleModalOpen && selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-head">
              <h3>Schedule Pickup Collection</h3>
              <button
                className="icon-close"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.2rem' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '1rem' }}>
                Set a designated date and collection window for <strong>{selectedRequest.id}</strong> (
                {selectedRequest.deviceName}).
              </p>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <span>Customer Address</span>
                <input
                  disabled
                  value={
                    selectedRequest.address ||
                    `${selectedRequest.locality || 'Borivali'}, PIN ${selectedRequest.pincode}`
                  }
                  style={{ background: '#f3f4f6' }}
                />
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <span>Pickup Date</span>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <span>Time Slot</span>
                  <select
                    value={pickupSlot}
                    onChange={(e) => setPickupSlot(e.target.value)}
                  >
                    <option>09:00–11:00</option>
                    <option>10:00–12:00</option>
                    <option>12:00–14:00</option>
                    <option>14:00–16:00</option>
                    <option>16:00–18:00</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn btn-secondary"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSchedulePickup}
                disabled={updating}
              >
                Confirm Pickup Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Collected Modal */}
      {isCollectModalOpen && selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-head">
              <h3>Record Device Collection & Weight</h3>
              <button
                className="icon-close"
                onClick={() => setIsCollectModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.2rem' }}>
              <div className="notice" style={{ marginBottom: '1rem' }}>
                <Scale size={18} />
                <span>
                  Please enter the verified physical weight in kilograms. Accurate weights help track actual e-waste diversion.
                </span>
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <span>Measured Weight in kg *</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <span>Customer 6-Digit Handover Code (Optional)</span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 582914"
                  value={handoverCodeInput}
                  onChange={(e) => setHandoverCodeInput(e.target.value)}
                />
                <small style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>
                  Verify code provided by customer upon on-site handover.
                </small>
              </div>

              <div className="form-field">
                <span>Field Collection Notes</span>
                <textarea
                  rows={3}
                  placeholder="Notes on packaging, condition upon collection, sealed box label..."
                  value={collectionNote}
                  onChange={(e) => setCollectionNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn btn-secondary"
                onClick={() => setIsCollectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmCollection}
                disabled={updating}
              >
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CollectionPartnerDashboard;
