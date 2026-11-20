import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Tag,
  DollarSign,
  User,
  ShieldCheck,
  Check,
  X,
  FileText,
  Smartphone,
  Info,
  ChevronRight
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

export function TechnicianDashboard({ currentUser, toast }: Props) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [partner, setPartner] = useState<PartnerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'assess' | 'history' | 'profile'>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & form state
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [repairCostInput, setRepairCostInput] = useState('1500');
  const [partsRequired, setPartsRequired] = useState('');
  const [isUnrepairable, setIsUnrepairable] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const allPartners = await fetchPartners();
      const myPartner = allPartners.find((p) => p.id === currentUser.partnerId) || null;
      setPartner(myPartner);

      const data = await fetchRequests({
        partnerId: currentUser.partnerId || undefined,
        role: 'technician',
      });
      setRequests(data);
    } catch (err: any) {
      toast(err.message || 'Error loading technician data');
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
  const inAssessment = requests.filter((r) => r.status === 'Under Assessment');
  const inProgress = requests.filter((r) => r.status === 'In Progress' || r.status === 'Pickup Scheduled');
  const completed = requests.filter((r) => r.status === 'Completed' && !(r as any).isUnrepairable);
  const unrepairable = requests.filter((r) => (r as any).isUnrepairable || r.status === 'Reassignment Required');

  // Actions
  const handleAcceptJob = async (req: RequestItem) => {
    setUpdating(true);
    try {
      await updateStatus(
        req.id,
        'Accepted',
        currentUser.name,
        'Repair technician accepted job for bench assessment'
      );
      toast(`Job ${req.id} accepted`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to accept job');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectJob = async (req: RequestItem) => {
    const reason = prompt('Please enter reason for rejecting this repair job:');
    if (!reason) return;
    setUpdating(true);
    try {
      await updateStatus(
        req.id,
        'Rejected',
        currentUser.name,
        `Repair declined: ${reason}`
      );
      toast(`Job ${req.id} rejected`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to reject job');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartAssessment = async (req: RequestItem) => {
    setUpdating(true);
    try {
      await updateStatus(
        req.id,
        'Under Assessment',
        currentUser.name,
        'Bench diagnostics & hardware triage initiated'
      );
      toast(`Diagnosis started for ${req.id}`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to start assessment');
    } finally {
      setUpdating(false);
    }
  };

  const openDiagnosisModal = (req: RequestItem) => {
    setSelectedRequest(req);
    setDiagnosisNotes((req as any).diagnosis || '');
    setRepairCostInput(String((req as any).repairCost || (req as any).estimate || '1500'));
    setPartsRequired((req as any).partsRequired || '');
    setIsUnrepairable(Boolean((req as any).isUnrepairable));
    setIsDiagnosisModalOpen(true);
  };

  const handleSaveDiagnosis = async () => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      const cost = parseFloat(repairCostInput) || 0;
      const nextStatus = isUnrepairable ? 'Reassignment Required' : 'In Progress';
      const note = isUnrepairable
        ? `Declared unrepairable. Diagnosis: ${diagnosisNotes}. Recommended for specialist e-waste recycling.`
        : `Assessment complete. Estimated repair: ₹${cost}. Parts: ${partsRequired || 'None'}. Moving to repair.`;

      await updateStatus(
        selectedRequest.id,
        nextStatus,
        currentUser.name,
        note,
        {
          diagnosis: diagnosisNotes,
          repairCost: cost,
          partsRequired,
          isUnrepairable,
        }
      );

      toast(isUnrepairable ? 'Device recorded as unrepairable' : 'Diagnosis & repair estimate saved');
      setIsDiagnosisModalOpen(false);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to save diagnosis');
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
        'Hardware repair & operational testing completed successfully. Ready for customer return.'
      );
      toast(`Repair for ${req.id} marked as completed!`);
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to complete repair');
    } finally {
      setUpdating(false);
    }
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.deviceName.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'queue') {
      return ['Assigned', 'Accepted'].includes(r.status);
    }
    if (activeTab === 'assess') {
      return ['Under Assessment', 'In Progress'].includes(r.status);
    }
    if (activeTab === 'history') {
      return ['Completed', 'Reassignment Required', 'Cancelled', 'Rejected'].includes(r.status);
    }

    if (statusFilter !== 'All') {
      return r.status === statusFilter;
    }
    return true;
  });

  return (
    <div className="technician-dashboard-wrapper">
      {/* Header */}
      <div className="page-title">
        <div>
          <div className="eyebrow">REPAIR TECHNICIAN WORKSPACE</div>
          <h1>{currentUser.name} — {partner?.name || 'FixForward Studio'}</h1>
          <p>
            Hardware triage, component-level diagnostics, and circular restoration for {partner?.locality || 'Kandivali'}.
          </p>
        </div>
        <div className="page-title-actions">
          <button className="btn btn-primary" onClick={() => setActiveTab('queue')}>
            <ClipboardList size={17} /> View Repair Queue ({assigned.length + accepted.length})
          </button>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-head">
            <span>Assigned Repairs</span>
            <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Wrench size={20} />
            </div>
          </div>
          <strong>{assigned.length + accepted.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> {assigned.length} awaiting intake
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>In Assessment</span>
            <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
          </div>
          <strong>{inAssessment.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Bench triage active
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Active Repairs</span>
            <div className="metric-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <Sparkles size={20} />
            </div>
          </div>
          <strong>{inProgress.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Restoration in progress
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Repaired & Restored</span>
            <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{completed.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Successfully returned to use
          </div>
        </div>

        <div className="metric">
          <div className="metric-head">
            <span>Unrepairable / Recycled</span>
            <div className="metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <strong>{unrepairable.length}</strong>
          <div className="metric-sub">
            <span className="green-dot" /> Routed to safe recycling
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="panel" style={{ padding: '8px 16px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'All Jobs', icon: Wrench },
            { id: 'queue', label: `Repair Queue (${assigned.length + accepted.length})`, icon: ClipboardList },
            { id: 'assess', label: `Bench Assessment (${inAssessment.length + inProgress.length})`, icon: Sparkles },
            { id: 'history', label: `Repair History (${completed.length + unrepairable.length})`, icon: CheckCircle2 },
            { id: 'profile', label: 'Technician Profile', icon: User },
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

      {/* Technician Profile Tab */}
      {activeTab === 'profile' && (
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-heading">
            <div>
              <h3>Certified Technician Profile</h3>
              <p>Specialization, lab credentials, and affiliated repair facility.</p>
            </div>
            <span className="tiny-pill" style={{ background: '#dcfce7', color: '#166534' }}>
              ✓ Certified Technician
            </span>
          </div>

          <div className="detail-list" style={{ marginTop: '1rem' }}>
            <div>
              <span>Technician Name</span>
              <b>{currentUser.name}</b>
            </div>
            <div>
              <span>Work Email</span>
              <b>{currentUser.email}</b>
            </div>
            <div>
              <span>Affiliated Studio</span>
              <b>{partner?.name || 'FixForward Studio'}</b>
            </div>
            <div>
              <span>Location / Pincode</span>
              <b>{partner?.locality || 'Kandivali'}, {partner?.pincode || '400101'}</b>
            </div>
            <div>
              <span>Studio Specialization</span>
              <b>{partner?.specialization || 'Display, audio, and laptop board repair'}</b>
            </div>
            <div>
              <span>Authorized Categories</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {(partner?.categories || ['Laptop', 'Monitor', 'Television', 'Cables & Chargers']).map((c) => (
                  <span key={c} className="tiny-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repair Table Panel */}
      {activeTab !== 'profile' && (
        <div className="panel table-panel">
          <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3>
                {activeTab === 'queue'
                  ? 'Incoming Repair Queue'
                  : activeTab === 'assess'
                  ? 'Bench Diagnostics & Assessment Workbench'
                  : activeTab === 'history'
                  ? 'Completed Repairs & Historical Records'
                  : 'Assigned Repair Jobs'}
              </h3>
              <p>Review hardware symptoms, record diagnostics, and set repair cost estimates.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="searchbox" style={{ maxWidth: '240px' }}>
                <Search size={16} />
                <input
                  placeholder="Search devices or symptoms..."
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
                  <option value="Under Assessment">Under Assessment</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Reassignment Required">Unrepairable</option>
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#667d6f' }}>
              <RefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
              <div>Loading repair queue...</div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <Wrench size={36} color="#10b981" />
              <h3>No jobs in this view</h3>
              <p>
                {activeTab === 'queue'
                  ? 'No incoming jobs waiting for acceptance. New customer repair requests will appear here.'
                  : activeTab === 'assess'
                  ? 'No devices currently under bench assessment. Accept an assigned job to start diagnostics.'
                  : 'No repair records matching the filter.'}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>JOB ID</th>
                    <th>DEVICE & CATEGORY</th>
                    <th>REPORTED SYMPTOMS</th>
                    <th>DIAGNOSIS & ESTIMATE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const reqAny = r as any;
                    return (
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
                          <div style={{ maxWidth: '240px', fontSize: '13px' }}>
                            <b>Condition:</b> {r.condition}
                            <br />
                            <span style={{ color: '#4b5563' }}>
                              {r.internalNotes?.[0] || 'No specific fault details reported by intake.'}
                            </span>
                          </div>
                        </td>
                        <td>
                          {reqAny.diagnosis ? (
                            <div>
                              <b style={{ color: '#166534' }}>{reqAny.diagnosis}</b>
                              <div style={{ fontSize: '12px', color: '#4b5563' }}>
                                Est: <strong>₹{reqAny.repairCost || reqAny.estimate || 0}</strong>
                                {reqAny.partsRequired && ` • Parts: ${reqAny.partsRequired}`}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>
                              Pending bench diagnosis
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              r.status === 'Completed'
                                ? 'done'
                                : ['Cancelled', 'Rejected', 'Reassignment Required'].includes(r.status)
                                ? 'bad'
                                : 'pending'
                            }`}
                          >
                            <span />
                            {r.status === 'Reassignment Required' ? 'Unrepairable' : r.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {r.status === 'Assigned' && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => handleAcceptJob(r)}
                                  disabled={updating}
                                >
                                  <Check size={14} /> Accept Job
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '12px', color: '#dc2626' }}
                                  onClick={() => handleRejectJob(r)}
                                  disabled={updating}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {r.status === 'Accepted' && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => handleStartAssessment(r)}
                                disabled={updating}
                              >
                                <Sparkles size={14} /> Start Diagnosis
                              </button>
                            )}

                            {['Under Assessment', 'In Progress'].includes(r.status) && (
                              <>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => openDiagnosisModal(r)}
                                >
                                  <FileText size={14} /> Diagnose & Quote
                                </button>
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => handleMarkCompleted(r)}
                                  disabled={updating}
                                >
                                  <CheckCircle2 size={14} /> Complete Repair
                                </button>
                              </>
                            )}

                            {r.status === 'Completed' && (
                              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                                ✓ Repaired
                              </span>
                            )}

                            {r.status === 'Reassignment Required' && (
                              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                                ⚠ Routed for Recycling
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Diagnosis & Quote Modal */}
      {isDiagnosisModalOpen && selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-head">
              <h3>Device Diagnosis & Technical Assessment</h3>
              <button className="icon-close" onClick={() => setIsDiagnosisModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.2rem' }}>
              <div className="notice" style={{ marginBottom: '1rem' }}>
                <Info size={18} />
                <span>
                  Recording transparent diagnostics helps customers make informed decisions and verify fair repair pricing.
                </span>
              </div>

              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <span>Hardware Findings / Diagnostic Assessment *</span>
                <textarea
                  rows={3}
                  placeholder="e.g. Loose LVDS display cable, backlight inverter burnt, battery cell capacity at 88%..."
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <span>Estimated Repair Cost (₹) *</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={repairCostInput}
                    onChange={(e) => setRepairCostInput(e.target.value)}
                    disabled={isUnrepairable}
                  />
                </div>
                <div className="form-field">
                  <span>Replacement Parts Required</span>
                  <input
                    placeholder="e.g. 15.6 inch LED panel, ribbon"
                    value={partsRequired}
                    onChange={(e) => setPartsRequired(e.target.value)}
                    disabled={isUnrepairable}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.2rem',
                  padding: '12px',
                  background: isUnrepairable ? '#fef2f2' : '#f9fafb',
                  borderRadius: '10px',
                  border: isUnrepairable ? '1px solid #f87171' : '1px solid #e5e7eb',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isUnrepairable}
                    onChange={(e) => setIsUnrepairable(e.target.checked)}
                  />
                  <span>Declare device unrepairable (recommend specialist recycling)</span>
                </label>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 24px' }}>
                  Select if component failure is catastrophic, obsolete, or exceeds the economic replacement value.
                </p>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={() => setIsDiagnosisModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveDiagnosis} disabled={updating}>
                Save Diagnostic Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default TechnicianDashboard;
