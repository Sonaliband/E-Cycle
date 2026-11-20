import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const SEED_FILE = path.resolve(__dirname, 'data/db.json');
const DB_FILE = process.env.VERCEL ? path.resolve('/tmp', 'db.json') : SEED_FILE;

// Ensure database file exists in /tmp when running in Vercel serverless environment
if (process.env.VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(SEED_FILE)) {
  try {
    fs.copyFileSync(SEED_FILE, DB_FILE);
  } catch (err) {
    console.warn('Could not copy seed to /tmp:', err);
  }
}
const INITIAL_PARTNERS = [
  {
    id: 'P-01',
    name: 'GreenTech Repair Hub',
    type: 'repair',
    categories: ['Laptop', 'Smartphone', 'Tablet', 'Keyboard', 'Printer', 'Cables & Chargers', 'Extension Boards & Power Strips'],
    locality: 'Borivali',
    pincode: '400066',
    capacity: 10,
    active: 2,
    verified: true,
    specialization: 'Electronics diagnostics & board-level repair',
    available: true,
    isRealProvider: true,
    contactPerson: 'Amit Verma',
    phone: '+91 98201 12345',
  },
  {
    id: 'P-02',
    name: 'FixForward Studio',
    type: 'repair',
    categories: ['Laptop', 'Monitor', 'Television', 'Headphones', 'Camera', 'Cables & Chargers'],
    locality: 'Kandivali',
    pincode: '400101',
    capacity: 8,
    active: 1,
    verified: true,
    specialization: 'Display, audio and computer hardware repair',
    available: true,
    isRealProvider: true,
    contactPerson: 'Rajesh Sharma',
    phone: '+91 98202 23456',
  },
  {
    id: 'P-03',
    name: 'Digital Bridges Foundation',
    type: 'donate',
    categories: ['Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Keyboard', 'Cables & Chargers'],
    locality: 'Mira Road',
    pincode: '401107',
    capacity: 15,
    active: 3,
    verified: true,
    specialization: 'Digital empowerment & education refurbishing',
    needs: 'Working computers & learning devices for students',
    available: true,
    isRealProvider: true,
    contactPerson: 'Meera Deshmukh',
    phone: '+91 98203 34567',
  },
  {
    id: 'P-04',
    name: 'Second Life Community Reuse',
    type: 'donate',
    categories: ['Smartphone', 'Laptop', 'Television', 'Camera', 'Headphones', 'Extension Boards & Power Strips'],
    locality: 'Dahisar',
    pincode: '400068',
    capacity: 12,
    active: 2,
    verified: true,
    specialization: 'Community reuse & underprivileged distribution',
    needs: 'Usable consumer electronics & accessories',
    available: true,
    isRealProvider: false, // Clearly distinguished as demonstration partner
    contactPerson: 'Sanjay Rao',
    phone: '+91 98204 45678',
  },
  {
    id: 'P-05',
    name: 'EcoLoop Collection Point',
    type: 'recycle',
    categories: [
      'Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Television', 'Keyboard', 'Mouse',
      'Printer', 'Headphones', 'Camera', 'Cables & Chargers', 'Extension Boards & Power Strips',
      'Batteries', 'Small Appliance', 'Other electronic devices'
    ],
    locality: 'Borivali',
    pincode: '400066',
    capacity: 25,
    active: 5,
    verified: true,
    specialization: 'Government-authorized hazardous & separated e-waste collection',
    available: true,
    isRealProvider: true,
    contactPerson: 'Vikram Joshi',
    phone: '+91 98205 56789',
  },
  {
    id: 'P-06',
    name: 'CircularCity Recyclers',
    type: 'recycle',
    categories: [
      'Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Television', 'Keyboard', 'Mouse',
      'Printer', 'Headphones', 'Camera', 'Cables & Chargers', 'Extension Boards & Power Strips',
      'Batteries', 'Small Appliance', 'Other electronic devices'
    ],
    locality: 'Mira Road',
    pincode: '401107',
    capacity: 20,
    active: 3,
    verified: true,
    specialization: 'Material extraction, heavy metal isolation and PCB recycling',
    available: true,
    isRealProvider: true,
    contactPerson: 'Anita Kulkarni',
    phone: '+91 98206 67890',
  },
];

// Initial seed accounts
const INITIAL_USERS = [
  {
    id: 'USR-ADMIN',
    email: 'admin@ecycle.com',
    passwordHash: 'admin123', // In real prod: bcrypt hash
    name: 'E-Cycle Administrator',
    role: 'admin',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'USR-TECH',
    email: 'tech@fixforward.com',
    passwordHash: 'tech123',
    name: 'Rajesh Sharma',
    role: 'technician',
    partnerId: 'P-02',
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    id: 'USR-PARTNER',
    email: 'partner@ecoloop.com',
    passwordHash: 'partner123',
    name: 'EcoLoop Operations',
    role: 'partner',
    partnerId: 'P-05',
    createdAt: Date.now() - 15 * 86400000,
  },
  {
    id: 'USR-CUSTOMER',
    email: 'user@example.com',
    passwordHash: 'user123',
    name: 'Priya Patel',
    role: 'resident',
    createdAt: Date.now() - 10 * 86400000,
  },
];

// Sample Seed Devices
const INITIAL_DEVICES = [
  {
    id: 'DEV-101',
    name: 'Dell Inspiron 15',
    category: 'Laptop',
    brand: 'Dell',
    model: 'Inspiron 15 3501',
    age: 3,
    condition: 'Fair',
    issue: 'Screen has minor lines, powers on cleanly',
    pincode: '400066',
    locality: 'Borivali',
    createdAt: Date.now() - 7 * 86400000,
    working: true,
    powersOn: true,
    damage: true,
    battery: false,
    swollen: false,
    missing: false,
    usable: true,
    repairCost: 2500,
    replacementValue: 18000,
  },
  {
    id: 'DEV-102',
    name: 'Heavy Duty Extension Board',
    category: 'Extension Boards & Power Strips',
    brand: 'Anchor',
    model: '4-Socket Reel',
    age: 4,
    condition: 'Poor',
    issue: 'Switch sparking, cable reel worn out',
    pincode: '400101',
    locality: 'Kandivali',
    createdAt: Date.now() - 5 * 86400000,
    working: false,
    powersOn: false,
    damage: true,
    battery: false,
    swollen: false,
    missing: false,
    usable: false,
    repairCost: 400,
    replacementValue: 950,
  },
  {
    id: 'DEV-103',
    name: 'VGA Display Cable (3m)',
    category: 'Cables & Chargers',
    brand: 'Belkin',
    model: 'VGA Male to Male',
    age: 5,
    condition: 'Good',
    issue: 'Replaced with HDMI, no longer needed',
    pincode: '401107',
    locality: 'Mira Road',
    createdAt: Date.now() - 4 * 86400000,
    working: true,
    powersOn: true,
    damage: false,
    battery: false,
    swollen: false,
    missing: false,
    usable: true,
    repairCost: 0,
    replacementValue: 300,
  },
  {
    id: 'DEV-104',
    name: 'Old CRT Monitor 17"',
    category: 'Monitor',
    brand: 'Samsung',
    model: 'SyncMaster 793s',
    age: 14,
    condition: 'Non-working',
    issue: 'Flyback transformer failure, obsolete',
    pincode: '400068',
    locality: 'Dahisar',
    createdAt: Date.now() - 2 * 86400000,
    working: false,
    powersOn: false,
    damage: false,
    battery: false,
    swollen: false,
    missing: false,
    usable: false,
    repairCost: 3000,
    replacementValue: 500,
  },
];

// Sample Seed Requests reflecting real lifecycle states
const INITIAL_REQUESTS = [
  {
    id: 'REQ-1001',
    owner: 'Priya Patel',
    ownerEmail: 'user@example.com',
    deviceId: 'DEV-101',
    deviceName: 'Dell Inspiron 15',
    category: 'Laptop',
    condition: 'Fair',
    action: 'repair',
    recommendedAction: 'repair',
    partnerId: 'P-01',
    partnerName: 'GreenTech Repair Hub',
    status: 'Accepted',
    createdAt: Date.now() - 6 * 86400000,
    pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    pickupSlot: '10:00–12:00',
    address: 'Flat 402, Sunshine Heights, Borivali West',
    locality: 'Borivali',
    pincode: '400066',
    weight: 2.1,
    internalNotes: ['Customer confirmed battery health is normal. Display issue only.'],
    history: [
      { status: 'Pending', at: Date.now() - 6 * 86400000, user: 'Priya Patel', note: 'Request submitted online' },
      { status: 'Assigned', at: Date.now() - 5 * 86400000, user: 'Admin', note: 'Assigned to GreenTech Repair Hub' },
      { status: 'Accepted', at: Date.now() - 4 * 86400000, user: 'GreenTech Support', note: 'Partner accepted repair job' },
    ],
  },
  {
    id: 'REQ-1002',
    owner: 'Arun Mehta',
    ownerEmail: 'arun@example.com',
    deviceId: 'DEV-102',
    deviceName: 'Heavy Duty Extension Board',
    category: 'Extension Boards & Power Strips',
    condition: 'Poor',
    action: 'repair',
    recommendedAction: 'repair',
    partnerId: null,
    partnerName: null,
    status: 'Pending',
    createdAt: Date.now() - 2 * 86400000,
    pickupDate: null,
    pickupSlot: null,
    address: 'Shop 12, Link Road, Kandivali West',
    locality: 'Kandivali',
    pincode: '400101',
    weight: 1.4,
    internalNotes: [],
    history: [
      { status: 'Pending', at: Date.now() - 2 * 86400000, user: 'Arun Mehta', note: 'Request submitted for inspection' },
    ],
  },
  {
    id: 'REQ-1003',
    owner: 'Sneha Kapoor',
    ownerEmail: 'sneha@example.com',
    deviceId: 'DEV-103',
    deviceName: 'VGA Display Cable (3m)',
    category: 'Cables & Chargers',
    condition: 'Good',
    action: 'donate',
    recommendedAction: 'donate',
    partnerId: 'P-03',
    partnerName: 'Digital Bridges Foundation',
    status: 'Pickup Scheduled',
    createdAt: Date.now() - 3 * 86400000,
    pickupDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    pickupSlot: '14:00–16:00',
    address: 'B-103, Gokul Park, Mira Road',
    locality: 'Mira Road',
    pincode: '401107',
    weight: 0.35,
    internalNotes: ['Suitable for school computer lab setup.'],
    history: [
      { status: 'Pending', at: Date.now() - 3 * 86400000, user: 'Sneha Kapoor', note: 'Donation request initiated' },
      { status: 'Assigned', at: Date.now() - 2 * 86400000, user: 'Admin', note: 'Allocated to Digital Bridges Foundation' },
      { status: 'Accepted', at: Date.now() - 2 * 86400000, user: 'Digital Bridges', note: 'Accepted for educational reuse' },
      { status: 'Pickup Scheduled', at: Date.now() - 1 * 86400000, user: 'Volunteer Team', note: 'Scheduled pickup for Friday' },
    ],
  },
  {
    id: 'REQ-1004',
    owner: 'Vikrant Roy',
    ownerEmail: 'vikrant@example.com',
    deviceId: 'DEV-104',
    deviceName: 'Old CRT Monitor 17"',
    category: 'Monitor',
    condition: 'Non-working',
    action: 'recycle',
    recommendedAction: 'recycle',
    partnerId: 'P-05',
    partnerName: 'EcoLoop Collection Point',
    status: 'Completed',
    createdAt: Date.now() - 14 * 86400000,
    pickupDate: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
    pickupSlot: '10:00–12:00',
    address: 'Rowhouse 4, Dahisar East',
    locality: 'Dahisar',
    pincode: '400068',
    weight: 16.5,
    internalNotes: ['Contains leaded glass. Transferred safely to smelter partner.'],
    history: [
      { status: 'Pending', at: Date.now() - 14 * 86400000, user: 'Vikrant Roy', note: 'Recycle request created' },
      { status: 'Assigned', at: Date.now() - 13 * 86400000, user: 'Admin', note: 'Assigned to EcoLoop' },
      { status: 'Accepted', at: Date.now() - 12 * 86400000, user: 'EcoLoop Ops', note: 'Accepted by partner' },
      { status: 'Pickup Scheduled', at: Date.now() - 11 * 86400000, user: 'EcoLoop Logistics', note: 'Pickup confirmed' },
      { status: 'Collected', at: Date.now() - 10 * 86400000, user: 'Field Collector #4', note: 'Heavy CRT safely loaded into transport' },
      { status: 'Under Assessment', at: Date.now() - 9 * 86400000, user: 'Safety Officer', note: 'Lead glass verification complete' },
      { status: 'Completed', at: Date.now() - 8 * 86400000, user: 'EcoLoop Facility', note: 'Certified recycling certificate generated' },
    ],
  },
];

// Initialize and read database
export function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: INITIAL_USERS,
      partners: INITIAL_PARTNERS,
      devices: INITIAL_DEVICES,
      requests: INITIAL_REQUESTS,
      auditLogs: [
        { id: 'LOG-01', action: 'DATABASE_INITIALIZED', user: 'System', at: Date.now(), details: 'Initial schema and seed data created.' },
      ],
    };
    saveDb(initialData);
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read db.json, returning empty fallback:', err);
    return { users: [], partners: [], devices: [], requests: [], auditLogs: [] };
  }
}

// Save database
export function saveDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// User Helpers
export function findUserByEmail(email) {
  const db = getDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser({ email, password, name, role = 'resident' }) {
  const db = getDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('A user with this email already exists.');
  }

  // Enforce role constraints: public registration can only create resident role
  const safeRole = role === 'admin' ? 'resident' : role;

  const newUser = {
    id: `USR-${Date.now().toString().slice(-6)}`,
    email: email.trim().toLowerCase(),
    passwordHash: password, // In production: bcrypt hash
    name: name.trim(),
    role: safeRole,
    createdAt: Date.now(),
  };

  db.users.push(newUser);
  db.auditLogs.unshift({
    id: `LOG-${Date.now()}`,
    action: 'USER_REGISTERED',
    user: newUser.email,
    at: Date.now(),
    details: `Registered new account with role ${newUser.role}`,
  });

  saveDb(db);
  return newUser;
}

// Statistics Aggregator for Admin Dashboard
export function getAdminStats() {
  const db = getDb();
  const reqs = db.requests;

  const totalUsers = db.users.length;
  const totalDevices = db.devices.length;
  const totalRequests = reqs.length;

  const pendingRequests = reqs.filter((r) => r.status === 'Pending').length;
  const assignedRequests = reqs.filter((r) => ['Assigned', 'Accepted', 'Pickup Scheduled'].includes(r.status)).length;
  const scheduledPickups = reqs.filter((r) => r.status === 'Pickup Scheduled').length;
  const collectedDevices = reqs.filter((r) => ['Collected', 'Under Assessment', 'Completed'].includes(r.status)).length;
  const completedRecycling = reqs.filter((r) => r.action === 'recycle' && r.status === 'Completed').length;
  const completedRepair = reqs.filter((r) => r.action === 'repair' && r.status === 'Completed').length;
  const completedDonation = reqs.filter((r) => r.action === 'donate' && r.status === 'Completed').length;

  const activeCollectors = db.partners.filter((p) => p.type === 'recycle' && p.available && p.active > 0).length;
  const activeRepairPartners = db.partners.filter((p) => p.type === 'repair' && p.available && p.active > 0).length;

  const totalWeight = reqs.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);

  // Time-series counts for past 7 days
  const dailyTrends = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const count = reqs.filter((r) => new Date(r.createdAt).toISOString().slice(0, 10) === dayStr).length;
    return { day: dayLabel, count };
  });

  // Device category distribution
  const categoryCounts = {};
  for (const r of reqs) {
    const cat = r.category || 'Other electronic devices';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Service action distribution
  const actionCounts = {
    Repair: reqs.filter((r) => r.action === 'repair').length,
    Donation: reqs.filter((r) => r.action === 'donate').length,
    Recycling: reqs.filter((r) => r.action === 'recycle').length,
  };
  const actionData = Object.entries(actionCounts).map(([name, value]) => ({ name, value }));

  // Partner performance data
  const partnerPerformance = db.partners.map((p) => {
    const partnerReqs = reqs.filter((r) => r.partnerId === p.id);
    const completed = partnerReqs.filter((r) => r.status === 'Completed').length;
    return {
      name: p.name.length > 18 ? p.name.slice(0, 16) + '...' : p.name,
      active: p.active,
      capacity: p.capacity,
      completed,
    };
  });

  return {
    totalUsers,
    totalDevices,
    totalRequests,
    pendingRequests,
    assignedRequests,
    scheduledPickups,
    collectedDevices,
    completedRecycling,
    completedRepair,
    completedDonation,
    activeCollectors,
    activeRepairPartners,
    estimatedWeightKg: Math.round(totalWeight * 10) / 10,
    dailyTrends,
    categoryData,
    actionData,
    partnerPerformance,
  };
}

// Request Assignment & Status Transitions
export function assignPartnerToRequest(requestId, partnerId, adminUser, reason = '') {
  const db = getDb();
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Request not found');

  const partner = db.partners.find((p) => p.id === partnerId);
  if (!partner) throw new Error('Selected partner not found');

  if (!partner.available) {
    throw new Error('This partner is currently marked unavailable.');
  }

  if (partner.active >= partner.capacity) {
    throw new Error('This partner is already at maximum capacity.');
  }

  // Update previous partner's active count if reassigning
  if (req.partnerId && req.partnerId !== partnerId) {
    const prevPartner = db.partners.find((p) => p.id === req.partnerId);
    if (prevPartner) {
      prevPartner.active = Math.max(0, prevPartner.active - 1);
    }
  }

  // Increment new partner active count
  if (req.partnerId !== partnerId) {
    partner.active += 1;
  }

  req.partnerId = partner.id;
  req.partnerName = partner.name;
  req.status = 'Assigned';

  const note = reason
    ? `Assigned to ${partner.name} by ${adminUser}. Note: ${reason}`
    : `Assigned to ${partner.name} by ${adminUser}`;

  req.history.push({
    status: 'Assigned',
    at: Date.now(),
    user: adminUser,
    note,
  });

  db.auditLogs.unshift({
    id: `LOG-${Date.now()}`,
    action: 'PARTNER_ASSIGNED',
    user: adminUser,
    at: Date.now(),
    details: `Assigned request ${req.id} (${req.category}) to ${partner.name}`,
  });

  saveDb(db);
  return req;
}

export function updateRequestStatus(requestId, newStatus, user, note = '', optionalData = {}) {
  const db = getDb();
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Request not found');

  const prevStatus = req.status;
  req.status = newStatus;

  if (optionalData.weight !== undefined) {
    req.weight = Number(optionalData.weight);
  }
  if (optionalData.pickupDate) {
    req.pickupDate = optionalData.pickupDate;
  }
  if (optionalData.pickupSlot) {
    req.pickupSlot = optionalData.pickupSlot;
  }
  if (optionalData.internalNote) {
    req.internalNotes = req.internalNotes || [];
    req.internalNotes.push(`[${new Date().toLocaleDateString('en-IN')}] ${optionalData.internalNote}`);
  }

  if (optionalData.diagnosis) {
    req.diagnosis = optionalData.diagnosis;
  }
  if (optionalData.repairCost !== undefined) {
    req.repairCost = Number(optionalData.repairCost);
    req.estimate = Number(optionalData.repairCost);
  }
  if (optionalData.partsRequired) {
    req.partsRequired = optionalData.partsRequired;
  }
  if (optionalData.isUnrepairable !== undefined) {
    req.isUnrepairable = Boolean(optionalData.isUnrepairable);
  }
  if (optionalData.collectionNotes) {
    req.collectionNotes = optionalData.collectionNotes;
  }
  if (optionalData.address) {
    req.address = optionalData.address;
  }
  if (optionalData.handoverCode) {
    req.handoverCode = optionalData.handoverCode;
  }
  if (optionalData.codeUsed !== undefined) {
    req.codeUsed = Boolean(optionalData.codeUsed);
  }

  // Adjust partner capacity if job terminal
  const terminalStatuses = ['Completed', 'Cancelled', 'Rejected'];
  if (terminalStatuses.includes(newStatus) && !terminalStatuses.includes(prevStatus) && req.partnerId) {
    const partner = db.partners.find((p) => p.id === req.partnerId);
    if (partner) {
      partner.active = Math.max(0, partner.active - 1);
    }
  }

  req.history.push({
    status: newStatus,
    at: Date.now(),
    user,
    note: note || `Status changed from ${prevStatus} to ${newStatus}`,
  });

  db.auditLogs.unshift({
    id: `LOG-${Date.now()}`,
    action: 'STATUS_UPDATED',
    user,
    at: Date.now(),
    details: `Request ${req.id} status changed to ${newStatus}`,
  });

  saveDb(db);
  return req;
}

export function addDevice(deviceData) {
  const db = getDb();
  const newDevice = {
    id: deviceData.id || `DEV-${Date.now().toString().slice(-6)}`,
    name: deviceData.name || 'Unnamed Device',
    category: deviceData.category || 'Other electronic devices',
    brand: deviceData.brand || '',
    model: deviceData.model || '',
    age: Number(deviceData.age) || 1,
    condition: deviceData.condition || 'Fair',
    issue: deviceData.issue || '',
    pincode: deviceData.pincode || '400066',
    locality: deviceData.locality || 'Borivali',
    createdAt: deviceData.createdAt || Date.now(),
    working: deviceData.working ?? true,
    powersOn: deviceData.powersOn ?? true,
    damage: deviceData.damage ?? false,
    battery: deviceData.battery ?? false,
    swollen: deviceData.swollen ?? false,
    missing: deviceData.missing ?? false,
    usable: deviceData.usable ?? true,
    repairCost: Number(deviceData.repairCost) || 0,
    replacementValue: Number(deviceData.replacementValue) || 0,
    photoId: deviceData.photoId,
    recommended: deviceData.recommended,
    reason: deviceData.reason,
    owner: deviceData.owner,
    ownerEmail: deviceData.ownerEmail,
  };

  db.devices.unshift(newDevice);
  saveDb(db);
  return newDevice;
}

export function deleteDevice(deviceId) {
  const db = getDb();
  db.devices = db.devices.filter((d) => d.id !== deviceId);
  saveDb(db);
  return true;
}
