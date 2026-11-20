/**
 * E-CYCLE Client API Service
 * Handles authenticated communication with the local backend.
 */

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'technician' | 'partner' | 'admin';
  partnerId?: string | null;
  token?: string;
}

export interface AdminStatsData {
  totalUsers: number;
  totalDevices: number;
  totalRequests: number;
  pendingRequests: number;
  assignedRequests: number;
  scheduledPickups: number;
  collectedDevices: number;
  completedRecycling: number;
  completedRepair: number;
  completedDonation: number;
  activeCollectors: number;
  activeRepairPartners: number;
  estimatedWeightKg: number;
  dailyTrends: { day: string; count: number }[];
  categoryData: { name: string; value: number }[];
  actionData: { name: string; value: number }[];
  partnerPerformance: { name: string; active: number; capacity: number; completed: number }[];
}

export interface RequestItem {
  id: string;
  owner: string;
  ownerEmail?: string;
  deviceId: string;
  deviceName: string;
  category: string;
  condition: string;
  action: 'repair' | 'donate' | 'recycle';
  recommendedAction: 'repair' | 'donate' | 'recycle';
  partnerId: string | null;
  partnerName: string | null;
  status: string;
  createdAt: number;
  pickupDate?: string | null;
  pickupSlot?: string | null;
  address?: string;
  locality?: string;
  pincode?: string;
  weight?: number;
  internalNotes?: string[];
  history: { status: string; at: number; user: string; note?: string }[];
}

export interface PartnerItem {
  id: string;
  name: string;
  type: 'repair' | 'donate' | 'recycle';
  categories: string[];
  locality: string;
  pincode: string;
  capacity: number;
  active: number;
  verified: boolean;
  specialization: string;
  available: boolean;
  isRealProvider?: boolean;
  needs?: string;
  contactPerson?: string;
  phone?: string;
}

const AUTH_KEY = 'ecycle_auth_user';
const TOKEN_KEY = 'ecycle_auth_token';

export function getSavedToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSavedToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

// Session Helpers
export function getSavedSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: UserSession, token?: string) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// Auth API Calls
export async function loginUser(email: string, password: string): Promise<UserSession> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sign in');
  }

  saveSession(data.user, data.token);
  return data.user;
}

export async function registerCustomer(name: string, email: string, password: string): Promise<UserSession> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register account');
  }

  saveSession(data.user, data.token);
  return data.user;
}

export async function resetPassword(email: string, newPassword?: string): Promise<string> {
  const res = await authFetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password reset failed');
  return data.message;
}

// Device API Calls
export interface DeviceItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  age: number;
  condition: string;
  issue: string;
  pincode: string;
  locality: string;
  createdAt: number;
  working: boolean;
  powersOn: boolean;
  damage: boolean;
  battery: boolean;
  swollen: boolean;
  missing: boolean;
  usable: boolean;
  repairCost: number;
  replacementValue: number;
  photoId?: string;
  recommended?: 'repair' | 'donate' | 'recycle';
  reason?: string;
  owner?: string;
  ownerEmail?: string;
}

export async function fetchDevices(params: { ownerEmail?: string; role?: string } = {}): Promise<DeviceItem[]> {
  const query = new URLSearchParams();
  if (params.ownerEmail) query.set('ownerEmail', params.ownerEmail);
  if (params.role) query.set('role', params.role);

  const res = await authFetch(`/api/devices?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load devices');
  const data = await res.json();
  return data.devices;
}

export async function saveDevice(device: Partial<DeviceItem>): Promise<DeviceItem> {
  const res = await authFetch('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save device');
  return data.device;
}

export async function removeDevice(id: string): Promise<boolean> {
  const res = await authFetch(`/api/devices/${id}`, { method: 'DELETE' });
  return res.ok;
}

// Admin Stats
export async function fetchAdminStats(): Promise<AdminStatsData> {
  const res = await authFetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to load admin stats');
  const data = await res.json();
  return data.stats;
}

// Request API Calls
export async function createRequest(reqData: Partial<RequestItem>): Promise<RequestItem> {
  const res = await authFetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit request');
  return data.request;
}

export async function fetchRequests(params: {
  status?: string;
  action?: string;
  search?: string;
  partnerId?: string;
  userEmail?: string;
  role?: string;
} = {}): Promise<RequestItem[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.action) query.set('action', params.action);
  if (params.search) query.set('search', params.search);
  if (params.partnerId) query.set('partnerId', params.partnerId);
  if (params.userEmail) query.set('userEmail', params.userEmail);
  if (params.role) query.set('role', params.role);

  const res = await authFetch(`/api/requests?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch requests');
  const data = await res.json();
  return data.requests;
}

export async function assignRequestPartner(
  requestId: string,
  partnerId: string,
  adminUser: string,
  reason?: string
): Promise<RequestItem> {
  const res = await authFetch(`/api/requests/${requestId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partnerId, adminUser, reason }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to assign partner');
  return data.request;
}

export async function updateStatus(
  requestId: string,
  status: string,
  user: string,
  note?: string,
  optionalData?: {
    weight?: number;
    pickupDate?: string;
    pickupSlot?: string;
    internalNote?: string;
    diagnosis?: string;
    repairCost?: number;
    partsRequired?: string;
    isUnrepairable?: boolean;
    collectionNotes?: string;
    address?: string;
    handoverCode?: string;
    codeUsed?: boolean;
  }
): Promise<RequestItem> {
  const res = await authFetch(`/api/requests/${requestId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, user, note, ...optionalData }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update request status');
  return data.request;
}

export async function addInternalNote(requestId: string, note: string, user: string): Promise<string[]> {
  const res = await authFetch(`/api/requests/${requestId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, user }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add note');
  return data.internalNotes;
}

// Partner API Calls
export async function fetchPartners(): Promise<PartnerItem[]> {
  const res = await authFetch('/api/partners');
  if (!res.ok) throw new Error('Failed to load partners');
  const data = await res.json();
  return data.partners;
}

export async function savePartner(partner: Partial<PartnerItem>): Promise<PartnerItem> {
  const res = await authFetch('/api/partners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partner),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save partner');
  return data.partner;
}

export async function togglePartnerAvailability(id: string): Promise<PartnerItem> {
  const res = await authFetch(`/api/partners/${id}/toggle`, {
    method: 'POST',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle availability');
  return data.partner;
}

// ==========================================
// Module 3: AI Recommendation
// ==========================================
export interface RecommendationData {
  recommendedAction: 'repair' | 'donate' | 'recycle' | 'refurbish' | 'specialist_assessment';
  actionTitle?: string;
  isSafe: boolean;
  safetyConsiderations: string;
  explanation: string;
  alternativeAction: string;
  missingInformation: string;
  uncertainty: string;
  source: string;
}

export async function fetchRecommendation(deviceData: {
  category: string;
  age?: number;
  condition?: string;
  damage?: string;
  repairCost?: number;
  replacementValue?: number;
  swollen?: boolean;
  batteryIssues?: boolean;
  powersOn?: boolean;
  missingParts?: boolean;
  working?: boolean;
}): Promise<RecommendationData> {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceData),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to obtain recommendation');
  return data;
}

// ==========================================
// Module 4: AI Chatbot
// ==========================================
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
  userEmail?: string | null,
  userName?: string | null
): Promise<{ reply: string; source: string }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, userEmail, userName }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reach AI assistant');
  return data;
}

// ==========================================
// Module 6: AI Price Estimation
// ==========================================
export interface PriceEstimateData {
  sufficientData: boolean;
  message?: string;
  resaleRange: { min: number; max: number; currency: string } | null;
  repairRange: { min: number; max: number; currency: string } | null;
  scrapValueRange: { min: number; max: number; currency: string } | null;
  assumptions: string[];
  disclaimer: string;
  pricingDate: string;
  source?: string;
}

export async function fetchPriceEstimate(deviceData: {
  category: string;
  brand?: string;
  model?: string;
  age?: number;
  condition?: string;
  working?: boolean;
  powersOn?: boolean;
  damage?: string;
}): Promise<PriceEstimateData> {
  const res = await fetch('/api/estimate-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceData),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to estimate price');
  return data;
}

// ==========================================
// Module 5: Partner Matching
// ==========================================
export interface PartnerMatchItem {
  partner: PartnerItem;
  matchScore: number;
  reasons: string[];
  remainingSlots: number;
  isRealProvider: boolean;
  breakdown: {
    categoryCompatibility: number;
    locationProximity: number;
    capacityAvailability: number;
    specializationAlignment: number;
    verificationStatus: number;
  };
}

export interface PartnerMatchResponse {
  safetyBlocked: boolean;
  reason?: string;
  eligiblePartners: PartnerMatchItem[];
  ineligibleCount: number;
  totalMatches: number;
}

export async function fetchPartnerMatches(criteria: {
  category: string;
  action: 'repair' | 'donate' | 'recycle';
  locality?: string;
  pincode?: string;
  unsafe?: boolean;
}): Promise<PartnerMatchResponse> {
  const res = await fetch('/api/partners/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(criteria),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Partner matching failed');
  return data;
}

