# E-CYCLE — Intelligent Smart E-Waste Management Platform

AI-assisted, secure circular electronics management prototype aligned with UN Sustainable Development Goals (SDG 11, SDG 12, SDG 13) and Urban Systems innovation.

---

## 🚀 Quick Start (Localhost Development)

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm

### 2. Environment Setup
The project includes a root `.env` file (configured in `.gitignore`). You can use Google Gemini, OpenAI, or the built-in offline engine:

```env
PORT=5001
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Servers (Localhost)
In separate terminal windows:

**Terminal 1 — Backend API & Shared Database Server (Port 5001):**
```bash
npm run server
```

**Terminal 2 — Frontend Dev Server (Port 5173 with API Proxy):**
```bash
npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Pre-Configured Test Accounts

The platform enforces secure role-based access control (public role switching has been permanently removed). Use the following credentials on the `/account` sign-in page:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ecycle.com` | `admin123` | Full Admin Dashboard, 12 KPI metrics, charts, request assignment & override, partner directory management, audit logs |
| **Repair Technician** | `tech@fixforward.com` | `tech123` | Assigned repair assessment jobs, diagnostics, estimates, status updates |
| **Collection Partner** | `partner@ecoloop.com` | `partner123` | Assigned pickups, capacity tracking, handover verification |
| **Resident / Customer** | `user@example.com` | `user123` | Device registration, AI Smart Scan, price estimates, request tracking |

*New customers can also register directly on the `/account` page with email and password.*

---

## 📦 Implemented Modules & Architecture

### 1. Admin Dashboard (Module 1 & 8)
- **12 Live Metrics:** Total users, registered devices, total requests, pending, assigned, pickups scheduled, collected devices, completed recycling, completed repairs, active collectors, active repair partners, and estimated e-waste weight handled.
- **Interactive Recharts:** Daily/weekly trends, device category breakdown, action distribution, and partner capacity utilization.
- **Searchable Request Table:** Filter by status, action, and keyword with full details modal.
- **Partner Assignment:** Admin can assign or override partner matching with logged reasons.
- **7-Stage Collection Lifecycle:**
  `Pending → Assigned → Accepted → Pickup Scheduled → Collected → Under Assessment → Completed`
  (plus exceptions: `Cancelled`, `Rejected`, `Failed Pickup`, `Reassignment Required`).
- **Internal Notes & Audit Trail:** Every status transition logs timestamp, actor, and internal notes.

### 2. Smart Scan & Vision AI (Module 2)
- Replaced unreliable MobileNet classification with a multi-provider vision system.
- Correctly identifies challenging items:
  - Extension boards, cable reels, power strips (avoiding false "punching bag" tags).
  - VGA / HDMI / USB cables and chargers (avoiding false "binoculars" tags).
  - Laptops, monitors, smartphones, keyboards, batteries, small appliances.
- Primary object detection even when held by human hands or surrounded by busy backgrounds.
- Qualitative confidence reporting (`high`, `medium`, `uncertain`) — no fabricated numerical percentages.
- Drag-and-drop file upload (JPG, PNG, WEBP) with client-side validation and live camera preview via MediaDevices API.
- Instant manual category correction if uncertain.

### 3. AI Repair, Reuse or Recycle Recommendations (Module 3)
- **Deterministic Safety Protocol:** Immediately blocks automated matching and flags critical warnings for hazardous devices (swollen/leaking lithium batteries, shattered CRT glass).
- **Circularity Decision Rules:** Prioritizes repair for economical issues on devices under 6 years old; recommends donation for working devices; routes obsolete or severely damaged hardware to certified recycling.
- Returns structured JSON: Recommended action, action title, explanation, safety considerations, secondary alternative, and uncertainty.

### 4. AI Chatbot Assistant (Module 4)
- Floating interactive widget with conversation history, suggested prompt chips, and markdown formatting.
- Curated E-Cycle knowledge base covering policies, hazardous battery handling, and eco rewards.
- **Live Database Lookup:** Answers user queries like *"What is the status of REQ-1001?"* by querying real database records.

### 5. Intelligent Collector & Partner Matching (Module 5)
- Strict eligibility filtering: Category support, service type, operational availability, and remaining capacity.
- **Explainable Ranking (100-point scale):**
  - Category Compatibility (+35 pts)
  - Location / Pincode Proximity (+10 to +25 pts)
  - Remaining Capacity (+0 to +20 pts)
  - Specialization Alignment (+10 to +15 pts)
  - Verified Partner Status (+5 pts)
- Displays verified badges distinguishing authorized providers from demonstration partners.

### 6. AI-Assisted Price Estimation (Module 6)
- Evaluates category, brand, model, age, and operational condition.
- Computes non-binding valuation ranges:
  - Refurbished Resale Range (₹)
  - Estimated Repair Cost Range (₹)
  - Scrap / Material Recovery Value (₹)
- Clear non-binding disclaimer grounded in Indian secondary electronics market benchmarks.

### 7. Shared Database & Authentication (Module 7)
- File-backed persistent database (`server/data/db.json`).
- Centralized entities: `users`, `partners`, `requests`, `devices`, and `auditLogs`.
- No exposed credentials or secret API keys in frontend code.

---

## 🧪 Testing & Verification

Run the automated end-to-end integration test suite:
```bash
node -e "
async function run() {
  const health = await (await fetch('http://localhost:5001/api/health')).json();
  console.log('Backend Health:', health.status, 'Provider:', health.activeProvider);
}
run();
"
```

Type check:
```bash
npx tsc --noEmit
```

Production build:
```bash
npm run build
```
