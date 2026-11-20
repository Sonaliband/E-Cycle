/**
 * E-CYCLE AI Assistant & Chatbot Engine (Module 4)
 * Uses curated E-Waste knowledge and live database lookups to answer questions
 * about recycling, repair, donation, safety, and request tracking.
 * Uses native fetch for zero external SDK dependencies.
 */

import { getDb } from './db.js';

const ECYCLE_KNOWLEDGE_BASE = `
# E-CYCLE KNOWLEDGE BASE & OFFICIAL POLICIES

## About E-Cycle
E-Cycle is an intelligent, scalable, and inclusive circular electronics management platform.
Sub-theme: Urban Systems.
Aligned with UN Sustainable Development Goals:
- SDG 11: Sustainable Cities and Communities
- SDG 12: Responsible Consumption and Production
- SDG 13: Climate Action

## Core Paths for Electronics
1. REPAIR: Always prioritized when devices are under 6 years old, power on, or have repairable issues (broken screens, degraded batteries, faulty charging ports). Extends lifespan and avoids up to 70% of manufacturing emissions.
2. DONATE / REUSE: For working and usable devices in Good or Like New condition. Devices are refurbished and channeled to digital literacy initiatives, schools, and non-profits.
3. RECYCLE: For devices that do not power on, have missing core components, or where repair costs exceed 60% of replacement value. Materials (gold, copper, aluminum, rare-earth elements) are reclaimed by authorized e-waste recyclers.

## Safety & Hazardous Handling Rules
- Swollen or Deformed Batteries: Lithium-ion batteries showing physical swelling, gas buildup, or puncture pose severe thermal runaway and fire risks. NEVER attempt to puncture, charge, or drop them in regular bins. Store in a cool, fire-safe container and schedule specialist e-waste collection.
- Broken CRTs or Old Monitors: Contain leaded glass and phosphors; handle with gloves.
- Fluorescent backlights: Contain trace mercury vapor; do not crush tubes.
- Data Privacy: Always perform a cryptographic factory wipe and log out of Apple iCloud, Google, or Microsoft accounts before donating or recycling.

## Request & Pickup Scheduling Workflow
1. User scans or enters device details in Smart Scan.
2. AI recommendation suggests Repair, Donate, or Recycle.
3. User confirms category and submits service request.
4. Request is saved with status 'Pending' or 'Assigned'.
5. Administrator or Smart Allocation matches an eligible partner based on PIN code, category, and capacity.
6. User schedules a Pickup (Date, 2-hour slot: 09:00–11:00, 10:00–12:00, 12:00–14:00, 14:00–16:00, 16:00–18:00) or selects Drop-off.
7. Handover verification uses a secure 6-digit one-time code generated in the dashboard.
8. Status moves: Pending → Assigned → Accepted → Pickup Scheduled → Collected → Under Assessment → Completed.

## Eco Rewards
- Repair Completed: +100 Eco Credits
- Donation Handover: +150 Eco Credits
- Certified Recycling: +80 Eco Credits
`;

export async function processChatMessage({ message, history = [], userEmail = null, userName = null }) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message cannot be empty.');
  }

  const trimmed = message.trim();
  const db = getDb();

  // Check if query is looking up a request ID (e.g., REQ-1001, REQ-1002, or "my requests")
  const reqMatch = trimmed.match(/REQ-[\w\d]+/i);
  let liveContext = '';

  if (reqMatch) {
    const targetId = reqMatch[0].toUpperCase();
    const found = db.requests.find((r) => r.id.toUpperCase() === targetId);
    if (found) {
      liveContext += `\n[LIVE DATABASE RECORD FOUND FOR ${targetId}]:
- Request ID: ${found.id}
- Device: ${found.deviceName} (${found.category})
- Service Requested: ${found.action.toUpperCase()}
- Current Status: ${found.status}
- Assigned Partner: ${found.partnerName || 'Pending Assignment'}
- Scheduled Pickup: ${found.pickupDate ? `${found.pickupDate} (${found.pickupSlot})` : 'Not yet scheduled'}
- Created: ${new Date(found.createdAt).toLocaleDateString('en-IN')}
- Latest History Note: ${found.history?.[found.history.length - 1]?.note || 'None'}\n`;
    } else {
      liveContext += `\n[DATABASE NOTE]: Request ID ${targetId} was not found in the current system records.\n`;
    }
  } else if (/my (requests?|devices?|status)/i.test(trimmed) && userEmail) {
    const userReqs = db.requests.filter(
      (r) =>
        (r.ownerEmail && r.ownerEmail.toLowerCase() === userEmail.toLowerCase()) ||
        (r.owner && r.owner === userName)
    );
    if (userReqs.length > 0) {
      liveContext +=
        `\n[LIVE DATABASE RECORDS FOR CURRENT USER (${userName || userEmail})]:\n` +
        userReqs
          .map(
            (r) =>
              `* ${r.id}: ${r.deviceName} (${r.action}) - Status: ${r.status}${
                r.partnerName ? ` with ${r.partnerName}` : ''
              }`
          )
          .join('\n') +
        '\n';
    }
  }

  // Check if AI API is available
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const systemInstructions = `
You are the official E-Cycle AI Assistant — an expert in electronics circularity, urban e-waste systems, and sustainable device management.
You provide accurate, encouraging, and environmentally grounded advice based strictly on E-Cycle policies and verified data.

Key guidelines:
1. Ground your answers in the provided E-Cycle Knowledge Base.
2. If live database information is provided below, reference it accurately. NEVER fabricate request statuses, partner names, or pickup availability.
3. For hazardous battery queries (swollen, punctured, hot), emphasize safety first: never charge, never compress, store safely, and use certified e-waste drop-off.
4. Keep answers crisp, formatted with clear markdown headings, bullet points, and actionable next steps.
5. If the user asks where to find something, guide them to the right dashboard page (/scan, /requests, /pickups, /allocation, /rewards).

${ECYCLE_KNOWLEDGE_BASE}

${liveContext ? `=== CURRENT LIVE CONTEXT ===\n${liveContext}` : ''}
`;

  // 1. Try Gemini REST API
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const contents = [
        { role: 'user', parts: [{ text: systemInstructions }] },
        { role: 'model', parts: [{ text: 'Understood. I am the E-Cycle Circular Assistant ready to assist based strictly on official policies and verified data.' }] },
        ...history.slice(-4).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: trimmed }] },
      ];

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return {
            reply,
            source: 'Google Gemini 1.5 Flash',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini chat fetch failed, falling back to local assistant:', err.message);
    }
  }

  // 2. Try OpenAI REST API
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      const messages = [
        { role: 'system', content: systemInstructions },
        ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: trimmed },
      ];

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return {
            reply,
            source: 'OpenAI GPT-4o-mini',
          };
        }
      }
    } catch (err) {
      console.warn('OpenAI chat fetch failed, falling back to local assistant:', err.message);
    }
  }

  // 3. Robust Offline Knowledge Engine Fallback
  return generateOfflineChatResponse(trimmed, liveContext);
}

function generateOfflineChatResponse(query, liveContext) {
  const q = query.toLowerCase();

  if (liveContext) {
    return {
      reply: `Here is the current status from our database:\n\n${liveContext}\n\nYou can track the full progress timeline and schedule pickups directly on the **[My Requests](/requests)** page.`,
      source: 'E-Cycle Database Assistant',
    };
  }

  if (
    q.includes('swollen') ||
    (q.includes('battery') &&
      (q.includes('bulge') || q.includes('leak') || q.includes('heat') || q.includes('danger')))
  ) {
    return {
      reply: `### ⚠️ Critical Battery Safety Protocol\n\nA **swollen, puffy, or deformed lithium battery** indicates severe internal gas buildup from chemical degradation. This poses immediate fire and thermal runaway risks.\n\n**Immediate Steps:**\n1. **Do NOT connect to a charger** or attempt to power the device on.\n2. **Do NOT press, puncture, or apply pressure** to the casing.\n3. **Store in a cool, fire-safe area** (e.g., in a metal container with sand or outside, away from flammable materials).\n4. **Schedule a specialist e-waste pickup** via E-Cycle Smart Scan and mark the item as a battery hazard. Our certified recyclers handle hazardous battery remediation.\n\nNever discard lithium batteries into general domestic trash.`,
      source: 'E-Cycle Safety Protocol Engine',
    };
  }

  if (
    q.includes('broken laptop') ||
    (q.includes('laptop') && (q.includes('recycle') || q.includes('repair')))
  ) {
    return {
      reply: `### Recycling or Repairing a Broken Laptop\n\nYes! A broken laptop has high circular value:\n\n1. **Repair First**: If the laptop is under 6 years old and powers on, replacing components like the display, battery, or SSD can restore it for years of further use.\n2. **Donation / Refurbishment**: If only minor repairs are needed, it can be passed to our partner schools and digital learning initiatives.\n3. **Certified Recycling**: If the motherboard is irreparably damaged or the chassis is cracked, our certified recycling partners will recover valuable materials including copper, gold, aluminum, and rare-earth magnets.\n\n👉 **Next step**: Upload a photo on the **[Smart Scan](/scan)** page to get an instant AI recommendation!`,
      source: 'E-Cycle Circularity Assistant',
    };
  }

  if (q.includes('schedule') || q.includes('pickup') || q.includes('appointment')) {
    return {
      reply: `### How to Schedule a Pickup on E-Cycle\n\n1. Once your device request is created, an eligible collection partner is assigned.\n2. Go to **[My Requests](/requests)** and select your request.\n3. In the **Service Scheduling** section, choose a date and a 2-hour collection time slot:\n   * \`09:00 – 11:00\`\n   * \`10:00 – 12:00\`\n   * \`12:00 – 14:00\`\n   * \`14:00 – 16:00\`\n   * \`16:00 – 18:00\`\n4. Confirm your pickup address and click **Schedule Collection**.\n5. During collection, verify handover using the generated 6-digit demo verification code.`,
      source: 'E-Cycle Platform Assistant',
    };
  }

  if (q.includes('status') || q.includes('track') || q.includes('where is')) {
    return {
      reply: `### Tracking Your Request\n\nYou can track the live status of all your electronics on the **[My Requests](/requests)** dashboard.\n\n**The 7-Stage Circular Workflow:**\n1. **Pending** – Request received and awaiting partner assignment.\n2. **Assigned** – Matched with an eligible collector or technician.\n3. **Accepted** – Partner confirmed capacity and accepted the job.\n4. **Pickup Scheduled** – Date and time slot confirmed.\n5. **Collected** – Device safely handed over.\n6. **Under Assessment** – Technical diagnostic or sorting underway.\n7. **Completed** – Successfully repaired, refurbished, or responsibly recycled!`,
      source: 'E-Cycle Platform Assistant',
    };
  }

  if (q.includes('eco credit') || q.includes('reward') || q.includes('points')) {
    return {
      reply: `### E-Cycle Eco Rewards\n\nEvery completed circular journey earns you Eco Credits:\n* 🔧 **Successful Repair**: **+100 credits**\n* 💚 **Verified Donation**: **+150 credits**\n* ♻️ **Certified Recycling**: **+80 credits**\n\nPoints unlock tiers from *Eco Starter* to *Circular Champion* and *Circular Legend*. View your balance and local ranking anytime on the **[Eco Rewards](/rewards)** page!`,
      source: 'E-Cycle Rewards Assistant',
    };
  }

  // General default
  return {
    reply: `### E-Cycle Circular Electronics Assistant\n\nI can help you with:\n* 🔍 **Smart Scan & Device Identification**: Finding the best route for laptops, phones, cables, and appliances.\n* 🔧 **Repair vs. Recycle Decisions**: Comparing refurbishment viability against material recovery.\n* ⚠️ **Hazardous Handling**: Safe protocols for swollen batteries, mercury lamps, and broken displays.\n* 📦 **Request Tracking & Pickups**: Checking status on requests like \`REQ-1001\` or scheduling collections.\n\nFeel free to ask a specific question or test by scanning an item on **[Smart Scan](/scan)**!`,
    source: 'E-Cycle Knowledge Base',
  };
}
