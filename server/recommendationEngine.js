/**
 * E-CYCLE AI Recommendation Engine (Module 3)
 * Provides deterministic safety checks and AI-powered recommendations
 * for Repair, Reuse/Refurbish, Donation, or Certified Recycling.
 * Uses native fetch (Node 18+) for zero external SDK dependencies.
 */

export const ACTIONS = {
  REPAIR: 'repair',
  DONATE: 'donate',
  RECYCLE: 'recycle',
  REFURBISH: 'refurbish',
  SPECIALIST: 'specialist_assessment',
};

/**
 * Evaluates the device condition and returns structured recommendations.
 */
export async function generateDeviceRecommendation({
  category = 'Other electronic devices',
  age = 2,
  condition = 'Fair',
  damage = '',
  repairCost = 0,
  replacementValue = 0,
  swollen = false,
  batteryIssues = false,
  powersOn = true,
  missingParts = false,
  working = true,
}) {
  const numericAge = Number(age) || 0;
  const numRepairCost = Number(repairCost) || 0;
  const numReplacementVal = Number(replacementValue) || 0;
  const hasBatteryHazards = Boolean(swollen || batteryIssues);

  // 1. DETERMINISTIC SAFETY CHECKS (Must run before any recommendation)
  if (hasBatteryHazards) {
    return {
      recommendedAction: 'recycle',
      actionTitle: 'Specialist Hazardous Recycling',
      isSafe: false,
      safetyConsiderations:
        'CRITICAL SAFETY ALERT: Swollen, deformed, leaking or punctured lithium batteries present severe thermal runaway, fire, and toxic emission risks. DO NOT connect to a charger, squeeze, open, or dispose of in standard waste. Store in a non-combustible container away from heat.',
      explanation:
        'Safety override triggered: Battery swelling or damage precludes automated reuse or standard repair. The device must be handled exclusively by certified hazardous e-waste professionals.',
      alternativeAction: 'Specialist Assessment Required',
      missingInformation: 'Battery chemistry and structural integrity can only be verified with physical technician inspection.',
      uncertainty: 'Do not transport without protective insulation.',
      source: 'Deterministic Safety Protocol',
    };
  }

  if (powersOn === false && missingParts) {
    return {
      recommendedAction: 'recycle',
      actionTitle: 'Responsible Recycling & Material Recovery',
      isSafe: true,
      safetyConsiderations:
        'Ensure all broken edges or protruding internal wires are covered before pickup.',
      explanation:
        'The device fails to power on and is missing essential internal or external components. Restoration is uneconomical; recovery of precious metals and circuit board materials via certified recycling is the optimal environmental path.',
      alternativeAction: 'Component Harvesting / Scrap',
      missingInformation: 'Internal circuit board continuity is unverified.',
      uncertainty: 'None: Device is non-functional with missing hardware.',
      source: 'Circularity Decision Rules',
    };
  }

  // Check if Gemini or OpenAI can provide rich insights
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const promptText = `
You are an expert E-Waste Circularity & Electronics Lifecycle Specialist for E-Cycle.
Evaluate the following device for circular handling:
- Category: ${category}
- Approx Age: ${numericAge} years
- Cosmetic / Operational Condition: ${condition}
- Damage Details: ${damage || 'None specified'}
- Powers On: ${powersOn ? 'Yes' : 'No'}
- Currently Working: ${working ? 'Yes' : 'No'}
- Reported Repair Cost: ₹${numRepairCost || 'Unknown'}
- Estimated Replacement Value: ₹${numReplacementVal || 'Unknown'}

Rules:
1. Always prioritize Repair if economical and device is <= 5-7 years old.
2. If fully functional and undamaged, prioritize Donation / Community Reuse.
3. If repair cost > 60% of replacement value or device is severely damaged / obsolete (>8-10 yrs), recommend Recycling.
4. Never claim the device is 100% safe or guaranteed repairable from user report alone.
5. Return ONLY a valid JSON object matching this schema:
{
  "recommendedAction": "repair" | "donate" | "recycle" | "refurbish",
  "actionTitle": string,
  "explanation": string,
  "safetyConsiderations": string,
  "alternativeAction": string,
  "missingInformation": string,
  "uncertainty": string
}
`;

  // Try Gemini via REST API
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            ...parsed,
            isSafe: true,
            source: 'Google Gemini Circularity Model',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini recommendation fetch failed, using rule engine:', err.message);
    }
  }

  // Try OpenAI via REST API
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: promptText }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            ...parsed,
            isSafe: true,
            source: 'OpenAI GPT-4o-mini Model',
          };
        }
      }
    } catch (err) {
      console.warn('OpenAI recommendation fetch failed, using rule engine:', err.message);
    }
  }

  // Deterministic Expert System Fallback
  return fallbackRecommendation({
    category,
    age: numericAge,
    condition,
    damage,
    repairCost: numRepairCost,
    replacementValue: numReplacementVal,
    powersOn,
    working,
  });
}

function fallbackRecommendation({
  category,
  age,
  condition,
  damage,
  repairCost,
  replacementValue,
  powersOn,
  working,
}) {
  const isWorking = working && powersOn && ['Like New', 'Good'].includes(condition) && !damage;

  if (isWorking) {
    return {
      recommendedAction: 'donate',
      actionTitle: 'Donate for Digital Empowerment',
      isSafe: true,
      safetyConsiderations:
        'Perform a complete cryptographic factory reset and sign out of personal cloud accounts (Google, Apple, Microsoft) before handover.',
      explanation: `This ${category} is functional and in ${condition} condition. Donating it to digital literacy programs or students will provide direct social utility and prevent early e-waste.`,
      alternativeAction: 'Refurbish for Resale',
      missingInformation: 'Battery health cycle count and physical screen inspection required.',
      uncertainty: 'Donor must verify data wipe status.',
      source: 'E-Cycle Rule-Based Decision Engine',
    };
  }

  const isEconomicalToRepair =
    powersOn &&
    age <= 6 &&
    (repairCost === 0 || replacementValue === 0 || repairCost <= replacementValue * 0.55);

  if (isEconomicalToRepair) {
    return {
      recommendedAction: 'repair',
      actionTitle: 'Professional Repair & Refurbishment',
      isSafe: true,
      safetyConsiderations:
        'Unplug from wall outlet. Do not probe damaged ports with metallic tools.',
      explanation: `The ${category} still powers on and is approx ${age} years old. Repairing components (e.g., screen, port, or power supply) extends hardware life and eliminates up to 70% of lifecycle carbon emissions compared to manufacturing a new unit.`,
      alternativeAction: 'Refurbish & Sell',
      missingInformation: 'Component-level diagnostics required by a verified technician.',
      uncertainty: 'Exact repair estimate subject to technician bench assessment.',
      source: 'E-Cycle Rule-Based Decision Engine',
    };
  }

  return {
    recommendedAction: 'recycle',
    actionTitle: 'Certified Responsible E-Waste Recycling',
    isSafe: true,
    safetyConsiderations:
      'Handle with care. Avoid breaking circuit boards or fluorescent backlights containing hazardous trace elements.',
    explanation: `Due to device age (${age} years), ${condition.toLowerCase()} condition, or high relative repair costs, certified material recycling is the most sustainable choice to reclaim critical minerals (copper, gold, aluminum) safely.`,
    alternativeAction: 'Parts Harvesting',
    missingInformation: 'Weight and hazardous component content breakdown.',
    uncertainty: 'Partner will sort recyclables by material grade.',
    source: 'E-Cycle Rule-Based Decision Engine',
  };
}
