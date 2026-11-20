import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MapPin,
  ShieldCheck,
  Edit3,
  Save,
  X,
  RefreshCw,
  Phone,
  User,
  Wrench,
  Heart,
  Recycle,
  Power,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchPartners,
  savePartner,
  togglePartnerAvailability,
  type PartnerItem,
} from '../services/apiService';
import { categories, type Action } from '../store';

const serviceInfo = {
  repair: { title: 'Repair', icon: Wrench, color: '#3B82F6' },
  donate: { title: 'Donate', icon: Heart, color: '#10B981' },
  recycle: { title: 'Recycle', icon: Recycle, color: '#0D9488' },
};

interface PartnerManagerProps {
  isAdmin: boolean;
  toast: (msg: string) => void;
}

export function PartnerManager({ isAdmin, toast }: PartnerManagerProps) {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Edit / Create State
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await fetchPartners();
      setPartners(list);
    } catch (err: any) {
      toast(err.message || 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setIsNew(true);
    setEditingPartner({
      id: '',
      name: '',
      type: 'repair',
      categories: [...categories],
      locality: '',
      pincode: '',
      capacity: 10,
      active: 0,
      verified: true,
      specialization: '',
      available: true,
      isRealProvider: true,
      contactPerson: '',
      phone: '',
    });
  };

  const openEdit = (p: PartnerItem) => {
    setIsNew(false);
    setEditingPartner({ ...p });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    if (!editingPartner.name.trim() || !editingPartner.locality.trim() || !editingPartner.pincode.trim()) {
      toast('Please enter partner name, locality, and pincode');
      return;
    }

    setSaving(true);
    try {
      await savePartner(editingPartner);
      toast(isNew ? 'New partner registered!' : 'Partner details updated!');
      setEditingPartner(null);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await togglePartnerAvailability(id);
      setPartners((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast(`${updated.name} is now ${updated.available ? 'active' : 'inactive'}`);
    } catch (err: any) {
      toast(err.message || 'Failed to toggle availability');
    }
  };

  const filtered = partners.filter((p) => {
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const matchesSearch =
      `${p.name} ${p.locality} ${p.specialization} ${p.contactPerson || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#059669' }}>
            CIRCULAR LOGISTICS NETWORK
          </span>
          <h2 style={{ fontSize: '26px', margin: '4px 0 0', fontWeight: 700 }}>
            {isAdmin ? 'Partner Governance & Capacity' : 'Certified Service Providers'}
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
            Authorized recyclers, repair hubs, and community reuse organizations.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Service Partner
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="filterbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div className="searchbox" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} />
          <input
            placeholder="Search partners, localities, or specializations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Services</option>
          <option value="repair">Repair Hubs</option>
          <option value="donate">Donation / Reuse</option>
          <option value="recycle">Authorized Recyclers</option>
        </select>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#10b981' }}>
          <RefreshCw className="spin" size={28} style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Loading partner directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Users size={38} color="#9ca3af" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>No partners found</h4>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>Adjust search terms or service filters.</p>
        </div>
      ) : (
        <div className="partners-grid">
          {filtered.map((p) => {
            const Icon = serviceInfo[p.type]?.icon || Recycle;
            const remaining = Math.max(0, p.capacity - p.active);
            const utilization = Math.round((p.active / Math.max(1, p.capacity)) * 100);

            return (
              <div
                key={p.id}
                className="directory-card"
                style={{
                  border: p.available ? '1px solid #e5e7eb' : '1px dashed #d1d5db',
                  opacity: p.available ? 1 : 0.7,
                }}
              >
                <div className="directory-head">
                  <div className={`directory-icon ${p.type}`}>
                    <Icon size={24} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {p.isRealProvider ? (
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        ✓ VERIFIED SERVICE PROVIDER
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '4px',
                          padding: '3px 7px',
                        }}
                      >
                        DEMONSTRATION PARTNER
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '9px',
                        color: p.available ? '#059669' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span className={p.available ? 'green-dot' : 'grey-dot'} />
                      {p.available ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                </div>

                <h3>{p.name}</h3>
                <p>
                  <MapPin size={14} /> {p.locality}, {p.pincode}
                </p>

                {p.contactPerson && (
                  <div style={{ fontSize: '10px', color: '#4b5563', margin: '6px 0', display: 'flex', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> {p.contactPerson}
                    </span>
                    {p.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {p.phone}
                      </span>
                    )}
                  </div>
                )}

                <div className="directory-tags">
                  <span>{serviceInfo[p.type]?.title}</span>
                  {p.verified && (
                    <span>
                      <ShieldCheck size={13} /> Verified
                    </span>
                  )}
                </div>

                <div className="directory-spec" style={{ fontSize: '11px', color: '#4b5563' }}>
                  {p.specialization}
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ margin: '14px 0 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6b7280', marginBottom: '4px' }}>
                    <span>Capacity Load: {p.active} / {p.capacity}</span>
                    <span>{remaining} slots left</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, utilization)}%`,
                        height: '100%',
                        backgroundColor: utilization > 80 ? '#ef4444' : utilization > 50 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>

                <div className="directory-foot">
                  <span>{remaining} slots available</span>
                  {isAdmin ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleToggle(p.id)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: p.available ? '#dc2626' : '#059669',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Power size={13} /> {p.available ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={() => openEdit(p)}>
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#059669', fontWeight: 600 }}>Available for matching</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Partner Modal */}
      {editingPartner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleSave}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>
                {isNew ? 'Register New Service Partner' : `Edit ${editingPartner.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Partner Organization Name *</span>
                <input
                  required
                  value={editingPartner.name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span>Service Category *</span>
                <select
                  value={editingPartner.type}
                  onChange={(e) => setEditingPartner({ ...editingPartner, type: e.target.value as Action })}
                >
                  <option value="repair">Electronics Repair Hub</option>
                  <option value="donate">Community Donation / Reuse</option>
                  <option value="recycle">Authorized Recycler</option>
                </select>
              </label>

              <label className="form-field">
                <span>Locality / City *</span>
                <input
                  required
                  value={editingPartner.locality}
                  onChange={(e) => setEditingPartner({ ...editingPartner, locality: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span>Pincode *</span>
                <input
                  required
                  maxLength={6}
                  value={editingPartner.pincode}
                  onChange={(e) => setEditingPartner({ ...editingPartner, pincode: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span>Contact Person</span>
                <input
                  value={editingPartner.contactPerson || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, contactPerson: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span>Contact Phone</span>
                <input
                  value={editingPartner.phone || ''}
                  onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span>Simultaneous Job Capacity</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editingPartner.capacity}
                  onChange={(e) => setEditingPartner({ ...editingPartner, capacity: Number(e.target.value) })}
                />
              </label>

              <label className="form-field">
                <span>Partner Classification</span>
                <select
                  value={editingPartner.isRealProvider ? 'real' : 'demo'}
                  onChange={(e) =>
                    setEditingPartner({ ...editingPartner, isRealProvider: e.target.value === 'real' })
                  }
                >
                  <option value="real">Verified Service Provider (Real)</option>
                  <option value="demo">Demonstration Partner</option>
                </select>
              </label>
            </div>

            <label className="form-field">
              <span>Specialization & Credentials Summary</span>
              <textarea
                rows={2}
                value={editingPartner.specialization}
                onChange={(e) => setEditingPartner({ ...editingPartner, specialization: e.target.value })}
                placeholder="Diagnostic tools, ISO certification, e-waste authorization details..."
              />
            </label>

            <div style={{ margin: '14px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
                Supported Device Categories
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map((cat) => {
                  const checked = editingPartner.categories.includes(cat);
                  return (
                    <label
                      key={cat}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        border: checked ? '1.5px solid #10b981' : '1px solid #d1d5db',
                        backgroundColor: checked ? '#ecfdf5' : '#ffffff',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...editingPartner.categories, cat]
                            : editingPartner.categories.filter((c) => c !== cat);
                          setEditingPartner({ ...editingPartner, categories: updated });
                        }}
                        style={{ display: 'none' }}
                      />
                      {checked && <CheckCircle2 size={11} color="#059669" />} {cat}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingPartner(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Partner Details'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
