import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client with proper telemetry header
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System prompt enforcing strict FinTech marketing & compliance guidelines
const FINTECH_MARKETING_SYSTEM_INSTRUCTION = `
You are the AI Marketing Agent and Compliance Assistant for "VeloFin Capital & Treasury", a modern FinTech startup.
VeloFin provides hypothetical financial technology services for businesses:
- VeloYield Treasury: Automated business cash management (illustrative 4.85% variable APY via FDIC-insured partner banks up to $5M).
- VeloCard Corporate: Smart corporate credit cards with 1.5% cashback on software/ads, real-time expense management, zero personal liability.
- VeloGrowth Credit Line: Non-dilutive revenue-based financing ($50k-$2M) for scaling SaaS and e-commerce companies.
- VeloPay Global FX: Multi-currency accounts across 35+ currencies with mid-market FX rates.

STRICT FINTECH SAFEGUARDS & COMPLIANCE RULES:
1. NEVER invent or claim guaranteed financial returns, fixed high interest rates, or zero-risk investments.
2. ALWAYS disclaim that all products, rates, and entities are illustrative prototype samples.
3. NEVER provide personalized financial advice, investment advice, or tax advice. Always advise consulting qualified advisors.
4. For sensitive customer inquiries (fraud, unauthorized charges, account freeze, compliance verification, disputes, regulatory issues):
   - Never speculate or dismiss the issue.
   - Draft a reassuring, safe, de-escalating response.
   - Direct them immediately to official support or the dedicated FinTech Compliance/Security Desk (e.g. security@velofin.sample or in-app emergency ticket).
5. If the user's request for campaign creation is missing essential details (e.g., target audience, channel, key value proposition, or goal), explicitly point out what is missing and present clarifying options or reasonable labeled assumptions.
6. NEVER ask for or output sensitive PII (SSN, complete bank account numbers, passwords, CVV).
`;

const FINTECH_ANALYTICS_SYSTEM_INSTRUCTION = `
You are the FinTech AI Analytics Advisor for "VeloFin Capital & Treasury".
Your role is to explain marketing performance metrics in plain, practical business language and recommend high-impact campaign improvements.

COMPLIANCE & ANALYTICAL RULES:
1. Explain metrics simply (CAC, LTV/CLV, ROAS, CTR, Conversion Rate).
2. Clearly identify which specific sample metrics support each recommendation.
3. NEVER claim or imply that a metric guarantees a future result or that a suggestion is proven to work. State recommendations as hypotheses to A/B test with an estimated impact and risk level.
4. Remind the user that all data presented is illustrative demo data.
`;

export interface MarketingAgentRequest {
  type: 'campaign' | 'support_faq' | 'recommendation' | 'refine' | 'chat';
  prompt: string;
  parameters?: {
    channel?: string;
    targetAudience?: string;
    goal?: string;
    tone?: string;
    product?: string;
    writingMode?: string;
  };
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

export interface SafeguardAuditResult {
  passed: boolean;
  score: number; // 0-100, higher means lower detected risk
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  checks: Array<{
    name: string;
    passed: boolean;
    explanation: string;
  }>;
  disclaimer: string;
  flaggedIssues?: Array<{
    id: string;
    category: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    title: string;
    explanation: string;
    flaggedPhrase?: string;
    recommendation: string;
  }>;
  hasCredentialRisk?: boolean;
  requiresHumanEscalation?: boolean;
  credentialWarning?: string;
  maskedPrompt?: string;
  maskedExcerpt?: string;
}

export async function generateMarketingContent(req: MarketingAgentRequest) {
  const ai = getGeminiClient();

  // Run local safeguard pre-check for blatant sensitive/harmful inputs
  const localAudit = auditSafeguards(req.prompt);

  if (!ai) {
    // Return high-quality realistic simulated FinTech response labeled as simulated
    const sim = generateSimulatedMarketingResponse(req, localAudit);
    return {
      ...sim,
      isSimulated: true,
      modelUsed: 'simulated-fintech-engine (GEMINI_API_KEY unconfigured)',
    };
  }

  try {
    const mode = req.parameters?.writingMode || 'marketing draft';
    const channel = req.parameters?.channel || 'Unspecified';
    const audience = req.parameters?.targetAudience || 'Unspecified';
    const goal = req.parameters?.goal || 'Unspecified';
    const tone = req.parameters?.tone || 'Professional & Modern FinTech';
    const product = req.parameters?.product || 'General VeloFin Platform';

    const userPromptWithContext = `
Task Type: ${req.type}
Writing Mode: ${mode}
Marketing Channel: ${channel}
Target Audience: ${audience}
Campaign Goal: ${goal}
Tone & Style: ${tone}
Product Focus: ${product}

User's Specific Prompt & Creative Directive:
"""
${req.prompt}
"""

Instructions:
1. Generate an original, highly tailored marketing piece specifically answering the user's prompt above.
2. Structure the content appropriately for the ${mode} writing mode:
   - If Blog: Include a catchy title, executive summary, 2-3 detailed sections with informative subheadings, and a concrete CTA.
   - If Email: Include Subject Line, Preview Text, personalized body copy, value proposition bullets, CTA button copy, and professional sign-off.
   - If Advertisement: Provide 2 distinct ad variations (e.g. search copy and social/LinkedIn ad) with headlines, descriptions, and CTA buttons.
   - If Social Media: Provide 2 distinct social copy formats (e.g. LinkedIn long-form and X/Twitter thread).
   - If Customer Support: Provide an empathetic, compliance-safe customer response with clear action steps and human specialist contact points.
   - If Product Recommendation: Provide tailored product recommendations with segmented fit analysis.
3. Incorporate the specified tone (${tone}), audience (${audience}), and product (${product}).
4. Conclude with appropriate FinTech compliance disclosures noting all rates and figures are illustrative prototypes.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPromptWithContext,
      config: {
        systemInstruction: FINTECH_MARKETING_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const text = response.text || 'Unable to generate response. Please try again.';
    const postAudit = auditSafeguards(text);

    return {
      content: text,
      safeguardAudit: postAudit,
      isSimulated: false,
      modelUsed: 'gemini-3.8-flash',
    };
  } catch (error: any) {
    console.warn('Gemini API call failed, falling back to simulated engine:', error?.message);
    const sim = generateSimulatedMarketingResponse(req, localAudit);
    const isQuota = error?.message?.toLowerCase().includes('quota') || error?.message?.toLowerCase().includes('resource_exhausted');
    return {
      ...sim,
      isSimulated: true,
      modelUsed: isQuota 
        ? 'simulated-fintech-engine (Gemini Quota Exceeded)' 
        : 'simulated-fintech-engine (Offline Fallback)',
    };
  }
}

export async function generateAnalyticsInsights(metricsData: any, userQuery?: string) {
  const ai = getGeminiClient();

  if (!ai) {
    return generateSimulatedAnalyticsResponse(metricsData, userQuery);
  }

  try {
    const isSample = metricsData.isSampleData === true || (!metricsData.isUserData && !metricsData.userEntered);
    const dataSourceLabel = isSample ? 'Illustrative Benchmark Sample Data' : 'User-Entered Campaign Figures';

    const trafficVal = metricsData.traffic?.value ?? metricsData.traffic ?? '—';
    const ctrVal = metricsData.ctr?.value ?? metricsData.ctr ?? '—';
    const convVal = metricsData.conversionRate?.value ?? metricsData.conversionRate ?? '—';
    const cacVal = metricsData.cac?.value ?? metricsData.cac ?? '—';
    const roasVal = metricsData.roas?.value ?? metricsData.roas ?? '—';
    const emailVal = metricsData.emailOpenRate?.value ?? metricsData.emailOpenRate ?? '—';
    const clvVal = metricsData.clv?.value ?? metricsData.clv ?? '—';
    const ltvCacVal = metricsData.ltvCacRatio?.value ?? metricsData.ltvCacRatio ?? '—';

    const prompt = `
Current Reporting Period: ${metricsData.periodLabel || metricsData.period || 'Current Period'}
Data Source Context: ${dataSourceLabel} (${isSample ? 'Mock illustrative figures for testing' : 'Actual figures manually entered by the user'})

Aggregated Performance Figures:
- Website Traffic: ${trafficVal} visits
- Click-Through Rate (CTR): ${ctrVal}%
- Conversion Rate: ${convVal}%
- Customer Acquisition Cost (CAC): $${cacVal}
- Return on Ad Spend (ROAS): ${roasVal}x
- Email Open Rate: ${emailVal}%
- Estimated Customer Lifetime Value (CLV): $${clvVal}
- LTV:CAC Ratio: ${ltvCacVal}x

Channel Breakdown:
${JSON.stringify(metricsData.channels || [], null, 2)}

User Question or Directive:
${userQuery || 'Provide an executive summary explaining key performance trends and 3 prioritized practical campaign improvements with supporting metrics.'}

Important note: If Data Source is "User-Entered Campaign Figures", explicitly evaluate the user's entered campaign numbers and do not describe them as sample benchmarks. If Data Source is "Illustrative Benchmark Sample Data", note that the figures are illustrative demo samples.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FINTECH_ANALYTICS_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    return {
      insights: response.text,
      isSimulated: false,
      modelUsed: 'gemini-3.8-flash',
    };
  } catch (err: any) {
    console.warn('Gemini analytics call failed, falling back to simulated insights:', err?.message);
    return generateSimulatedAnalyticsResponse(metricsData, userQuery);
  }
}

// Local Safeguard Auditor that verifies FinTech content safety rules
export function auditSafeguards(text: string, promptText?: string): SafeguardAuditResult {
  const combined = `${promptText || ''} \n ${text}`;
  const lower = combined.toLowerCase();
  const checks = [];
  const flaggedIssues: NonNullable<SafeguardAuditResult['flaggedIssues']> = [];
  let score = 100;

  // Check 1: Sensitive Credential & OTP Shield
  const hasSSNPattern = /\b\d{3}[- ]\d{2}[- ]\d{4}\b/.test(combined);
  const hasCardPattern = /\b(?:\d{4}[ -]?){3}\d{4}\b/.test(combined);
  const mentionsOTP = /\b(otp|one-time\s+passcode|verification\s+code|auth\s+code|security\s+token)\b/i.test(lower);
  const requestsSecret = /(enter|provide|send|repeat|verify|share|type|confirm)\s+(your\s+)?(otp|password|pin|cvv|passcode|secret|card\s+number)/i.test(lower);
  const hasPII = hasSSNPattern || hasCardPattern || mentionsOTP || requestsSecret;

  let hasCredentialRisk = false;
  let credentialWarning: string | undefined = undefined;

  if (hasPII) {
    hasCredentialRisk = true;
    score -= 65;
    credentialWarning = '⚠️ Never share verification codes or account credentials. VeloFin representatives will never request your one-time code or password.';
    flaggedIssues.push({
      id: 'issue-credential-pii',
      category: 'Credential & PII Protection',
      severity: 'critical',
      title: 'Credential or Verification Code Exposure Detected',
      explanation: 'Requests to collect, provide, or repeat one-time passwords (OTP), PINs, passwords, or credit card numbers violate financial authentication security policies.',
      flaggedPhrase: hasSSNPattern ? 'SSN Pattern (Masked)' : hasCardPattern ? 'Card Number (Masked)' : 'OTP / Verification Code Request',
      recommendation: 'Remove credential references. Display prominent warning: "Never share verification codes or account credentials."',
    });

    checks.push({
      name: 'PII & Sensitive Credential Shield',
      passed: false,
      explanation: 'Critical Flag: Request or text contains/requests OTPs, passwords, PINs, or raw financial credentials.',
    });
  } else {
    checks.push({
      name: 'PII & Sensitive Credential Shield',
      passed: true,
      explanation: 'Passed: No unmasked Social Security, card numbers, OTPs, or private credential strings detected.',
    });
  }

  // Check 2: No guaranteed returns or unrealistic yield promises
  const hasGuaranteedReturn = /guarantee(d)?\s+(return|profit|yield|rate|gain)/i.test(lower) ||
    /risk-free\s+(investment|return|yield)/i.test(lower) ||
    /(100%|surefire)\s+(profit|success)/i.test(lower);

  if (hasGuaranteedReturn) {
    score -= 35;
    flaggedIssues.push({
      id: 'issue-guaranteed-yield',
      category: 'Return Guarantees',
      severity: 'high',
      title: 'Prohibited Guaranteed Return Claim',
      explanation: 'Promising guaranteed yields or risk-free financial returns violates SEC/FINRA and FTC marketing compliance.',
      flaggedPhrase: 'Guaranteed / risk-free return phrasing',
      recommendation: 'Disclose all yields as variable and subject to market conditions.',
    });

    checks.push({
      name: 'Guaranteed Returns / Zero-Risk Claims',
      passed: false,
      explanation: 'Flagged: Promising guaranteed yields or risk-free financial returns violates SEC/FINRA and FTC marketing compliance.',
    });
  } else {
    checks.push({
      name: 'Guaranteed Returns / Zero-Risk Claims',
      passed: true,
      explanation: 'Passed: No misleading guaranteed returns or risk-free yield promises detected.',
    });
  }

  // Check 3: No personalized financial advice without disclaimers
  const givesFinancialAdvice = /you\s+should\s+(invest|buy|sell|put\s+your\s+money)\s+in/i.test(lower) ||
    /personal(ly)?\s+recommend\s+for\s+your\s+tax/i.test(lower);

  if (givesFinancialAdvice) {
    score -= 25;
    flaggedIssues.push({
      id: 'issue-financial-advice',
      category: 'Unregistered Advisory',
      severity: 'moderate',
      title: 'Personalized Financial or Tax Advice',
      explanation: 'Content appears to dispense individual financial/tax guidance rather than general product marketing.',
      flaggedPhrase: 'Individual advisory directive',
      recommendation: 'Frame as educational overview and advise consulting an independent financial advisor or CPA.',
    });

    checks.push({
      name: 'Personalized Financial & Tax Advice',
      passed: false,
      explanation: 'Flagged: Content appears to dispense individual financial/tax guidance rather than general product marketing.',
    });
  } else {
    checks.push({
      name: 'Personalized Financial & Tax Advice',
      passed: true,
      explanation: 'Passed: Content maintains neutral product education without individual financial advice.',
    });
  }

  // Check 4: Sensitive customer support escalation detection
  const isSensitiveSupportIssue = /fraud|unauthorized|stolen|hacked|freeze|frozen|dispute|subpoena|regulatory\s+audit|lawsuit/i.test(lower);
  const routesToHuman = /human|representative|support\s+desk|compliance\s+officer|security\s+team|official\s+status|ticket|concierge/i.test(lower);
  let requiresHumanEscalation = false;

  if (isSensitiveSupportIssue) {
    requiresHumanEscalation = true;
    if (!routesToHuman) {
      score -= 30;
      flaggedIssues.push({
        id: 'issue-human-escalation',
        category: 'Sensitive Support Routing',
        severity: 'high',
        title: 'Missing Human Escalation for Sensitive Inquiry',
        explanation: 'Inquiry mentions fraud, frozen funds, or security dispute without routing to human compliance personnel.',
        recommendation: 'Refer customer immediately to the dedicated Human Security & Compliance Desk.',
      });
      checks.push({
        name: 'Sensitive Inquiry Safe-Routing',
        passed: false,
        explanation: 'Warning: Inquiry mentions fraud, frozen funds, or security issues but does not route to human compliance representatives.',
      });
    } else {
      checks.push({
        name: 'Sensitive Inquiry Safe-Routing',
        passed: true,
        explanation: 'Passed: Sensitive account security matters are properly routed to accredited human representatives.',
      });
    }
  } else {
    checks.push({
      name: 'Sensitive Inquiry Safe-Routing',
      passed: true,
      explanation: 'Passed: Standard inquiry without urgent fraud escalation required.',
    });
  }

  // Check 5: Illustrative disclaimer presence
  const hasDisclaimer = /illustrative|prototype|hypothetical|sample|not\s+an\s+official|terms\s+apply|subject\s+to\s+approval|fdic/i.test(lower);
  if (!hasDisclaimer) {
    score -= 10;
    checks.push({
      name: 'Illustrative Prototype Disclosures',
      passed: false,
      explanation: 'Recommended: Ensure an explicit "Illustrative Prototype / Not an Official Offer" disclaimer is attached.',
    });
  } else {
    checks.push({
      name: 'Illustrative Prototype Disclosures',
      passed: true,
      explanation: 'Passed: Appropriate disclaimer acknowledging illustrative sample information was found.',
    });
  }

  const finalScore = Math.max(5, Math.min(100, score));
  const riskLevel = finalScore >= 90 ? 'low' : finalScore >= 70 ? 'moderate' : finalScore >= 40 ? 'high' : 'critical';

  return {
    passed: finalScore >= 70 && !hasCredentialRisk,
    score: finalScore,
    riskLevel,
    checks,
    flaggedIssues,
    hasCredentialRisk,
    requiresHumanEscalation,
    credentialWarning,
    disclaimer: '⚠️ FinTech Regulatory Notice: Automated risk indicator for guidance only. All VeloFin products, rates, fees, and metrics are hypothetical prototypes for demonstration purposes.',
  };
}

// Simulated responses tailored for rich FinTech demonstration
function generateSimulatedMarketingResponse(req: MarketingAgentRequest, audit: SafeguardAuditResult) {
  const { channel, targetAudience, goal, tone, product } = req.parameters || {};

  // Check if critical parameters are missing
  const missingParams: string[] = [];
  if (!channel) missingParams.push('Marketing Channel (e.g., Email, Blog Post, LinkedIn Ad, Twitter Thread)');
  if (!targetAudience) missingParams.push('Target Audience Segment (e.g., Seed-stage SaaS, DTC E-commerce, Freelance Agencies)');
  if (!goal) missingParams.push('Campaign Goal (e.g., Product Activation, Webinar Registrations, Churn Re-engagement)');

  let missingInfoSection = '';
  if (missingParams.length > 0) {
    missingInfoSection = `
> ⚠️ **Agent Clarification Note:**
> To deliver the most effective campaign, the following parameters were inferred using defaults:
${missingParams.map(p => `> - **Missing:** ${p}`).join('\n')}
> *Tip: You can refine or specify these in the prompt builder above for a targeted variation.*

---
`;
  }

  // Check for Credential / OTP Request in user prompt
  if (/otp|verification\s*code|auth\s*code|passcode|password|cvv/i.test(req.prompt)) {
    return {
      content: `${missingInfoSection}### ⚠️ Security Alert: Verification Codes & Account Credentials

> **CRITICAL SECURITY WARNING:**  
> **Never share verification codes, one-time passcodes (OTPs), PINs, or account credentials.**  
> VeloFin staff, automated agents, and support representatives will **never** ask you for your verification code or login password.

**Immediate Guidance:**
1. **Never Disclose or Forward OTPs:** Two-factor authorization codes are exclusively for entering directly into official VeloFin login portals.
2. **Recognizing Social Engineering:** Any request to provide or confirm an OTP over chat or email is a violation of authentication safeguards.
3. **Escalate to Human Security Desk:** If you suspect an unauthorized access attempt or lock-out, connect directly with our Security & Fraud Concierge at **security@velofin.sample** or through the verified in-app emergency hotline.

---
*Notice: Authentication credentials and verification codes were redacted to uphold privacy safeguards.*`,
      safeguardAudit: {
        ...audit,
        hasCredentialRisk: true,
        credentialWarning: '⚠️ Never share verification codes or account credentials.',
      },
      isSimulated: true,
      modelUsed: 'simulated-fintech-engine',
    };
  }

  // Handle sensitive customer support questions
  if (req.type === 'support_faq' || /unauthorized|stolen|fraud|freeze|guarantee/i.test(req.prompt)) {
    if (/unauthorized|stolen|fraud|freeze|hacked/i.test(req.prompt)) {
      return {
        content: `${missingInfoSection}### 🛡️ Customer Support Draft: Urgent Account Security & Verification

**Customer Inquiry:** "${req.prompt}"

**Draft Response for Customer:**
> "Dear Valued Customer,
> 
> Thank you for bringing this to our immediate attention. We take the security of your business funds with the utmost urgency. 
> 
> To safeguard your account, our automated risk engine temporarily flags unusual activity while maintaining your legitimate operations wherever possible. 
> 
> **Immediate Steps Taken:**
> 1. Any disputed transaction is currently isolated pending review.
> 2. No representative from VeloFin will ever ask you for your account password, full 16-digit card number, or two-factor code over email or chat.
> 
> **Connecting with Human Security Specialist:**
> I have escalated your case to our Senior FinTech Fraud & Compliance Concierge (Priority Case #VF-88419). An accredited security representative is reviewing your account log right now and will contact you directly within 15 minutes via your verified phone number or secure in-app message.
> 
> You can also review real-time system integrity and verified contact points at our official portal: **security.velofin.sample/status**
> 
> Sincerely,  
> The VeloFin Security & Compliance Concierge"

---
**Compliance Audit Details:**
- **Safeguard Category:** Sensitive Inquiry Safe-Routing (Passed ✅)
- **Action:** No unauthorized promises made. Safely escalated to human compliance officer.
- **PII Protection:** Reminded customer never to send credentials or unmasked card numbers.

*Disclaimer: VeloFin is an illustrative FinTech prototype. Security procedures depicted are simulated.*`,
        safeguardAudit: audit,
        isSimulated: true,
        modelUsed: 'simulated-fintech-engine',
      };
    }

    if (/guarantee|risk-free|12%|fixed\s+yield/i.test(req.prompt)) {
      return {
        content: `${missingInfoSection}### 🛡️ Customer Support Draft: Yield & Rate Inquiries

**Customer Inquiry:** "${req.prompt}"

**Draft Response for Customer:**
> "Hello,
> 
> Thank you for inquiring about VeloYield Treasury cash management!
> 
> At VeloFin, transparency and regulatory compliance are our highest priorities. In accordance with federal financial advertising standards:
> 
> 1. **Variable Yield:** Our illustrative rate (currently 4.85% APY) is variable and fluctuates based on prevailing Federal Reserve benchmark rates. We do not offer or advertise 'guaranteed' investment returns or risk-free speculative gains.
> 2. **FDIC Insurance Sweep:** Cash swept into our partner bank network is eligible for pass-through FDIC insurance up to $5,000,000 ($250,000 per program bank).
> 3. **Independent Advice:** We encourage every business treasurer and CFO to review our complete Program Disclosure Statement and speak with an independent certified financial advisor to evaluate liquidity needs.
> 
> Please explore our full product specifications or schedule a call with our Treasury Relationship Team at **treasury.velofin.sample/disclosures**."

---
*Disclaimer: All rates and products shown are illustrative prototype samples. Not personalized investment advice.*`,
        safeguardAudit: audit,
        isSimulated: true,
        modelUsed: 'simulated-fintech-engine',
      };
    }
  }

  // Handle Product Recommendations
  if (req.type === 'recommendation' || /recommend|which product|segment/i.test(req.prompt)) {
    return {
      content: `${missingInfoSection}### 📊 FinTech Product Recommendation by Customer Segment

Based on your target criteria, here is our compliance-aligned recommendation matrix:

| Segment | Primary Recommended Product | Secondary Add-on | Key Value Proposition (Illustrative) | Key Safeguard Caveat |
| :--- | :--- | :--- | :--- | :--- |
| **Early-Stage SaaS (Seed-Series A)** | **VeloYield Treasury** | VeloCard Corporate | Maximize runway with automated 4.85% variable yield sweep on idle funding. | Variable APY; subject to partner bank sweep limits. |
| **DTC / E-Commerce Merchants** | **VeloGrowth Credit Line** | VeloPay Global FX | Flexible working capital for seasonal inventory with zero equity dilution. | Revenue financing subject to credit underwriting; not a guaranteed loan. |
| **Agencies & Freelance Collectives** | **VeloCard Corporate** | Multi-Currency Virtual Cards | 1.5% cashback on SaaS & ad spend with custom team spending limits. | Cashback rewards subject to merchant category codes. |
| **Mid-Market Multi-Entity Finance** | **VeloPay Global FX** | Automated Treasury Yield | Unified treasury across 35+ currencies without punitive wire markup. | FX exchange rates subject to market volatility. |

**Recommended Next Step:**
Select one of the segments above to generate a channel-specific campaign draft (e.g. Email sequence or LinkedIn Ad).`,
      safeguardAudit: audit,
      isSimulated: true,
      modelUsed: 'simulated-fintech-engine',
    };
  }

  // Handle Campaign Generation (Email, Blog, Ads, Social, Recommendation, Customer Support)
  const mode = (req.parameters?.writingMode || '').toLowerCase();
  const chosenChannel = channel?.toLowerCase() || (mode === 'blog' ? 'blog' : mode === 'advertisement' ? 'paid ad' : mode === 'social_media' ? 'social media' : 'email');
  const effectiveProduct = product || 'VeloYield Treasury & VeloCard';
  const effectiveAudience = targetAudience || 'FinTech CFOs and Seed-stage Founders';
  const effectiveTone = tone || 'Authoritative & Data-Driven';
  const userPromptClean = req.prompt.trim();

  // Extract a clean core headline / subject from the user's prompt
  const cleanSummary = userPromptClean
    .replace(/^(write|create|draft|generate|make|build|provide|compose)\s+(a|an|the)?/i, '')
    .trim();
  const titleCaseSummary = cleanSummary.length > 3
    ? cleanSummary.charAt(0).toUpperCase() + cleanSummary.slice(1, 60)
    : `${effectiveProduct} Overview`;

  let campaignBody = '';

  if (mode === 'blog' || chosenChannel.includes('blog') || chosenChannel.includes('content') || chosenChannel.includes('seo')) {
    campaignBody = `### 📝 Blog Post: ${titleCaseSummary}

**Target Audience:** ${effectiveAudience}  
**Focus Product:** ${effectiveProduct}  
**Tone:** ${effectiveTone}  
**Creative Directive:** "${userPromptClean}"

#### Executive Summary
${userPromptClean.length > 20 ? userPromptClean : `Optimizing modern financial infrastructure requires balancing capital efficiency, cash management, and rigorous operational control.`} For ${effectiveAudience}, traditional financial approaches often create unnecessary drag. Here is a practical breakdown of how modern FinTech capabilities provide strategic advantages.

#### Key Discussion: Addressing the Core Challenge
Modern finance operators face evolving market dynamics. When deploying solutions around **${effectiveProduct}**, teams must address three primary considerations:
1. **Capital Velocity & Efficiency:** How operating balances are utilized rather than remaining stagnant in low-yield accounts.
2. **Risk Mitigation & Control:** Maintaining liquidity and compliance without administrative friction.
3. **Execution Clarity:** Implementing clear, data-informed workflows that deliver measurable ROI for ${effectiveAudience}.

#### Strategic Implementation Blueprint
To achieve the goal of **${goal || 'sustainable financial growth'}**, teams should adopt a staged rollout:
- **Phase 1 (Audit & Alignment):** Map current account structures and identify idle capital or expense leakages.
- **Phase 2 (Automated Optimization):** Activate **${effectiveProduct}** with custom thresholds and automated rule sets.
- **Phase 3 (Continuous Monitoring):** Review weekly yield benchmarks and reconcile transaction telemetry.

#### Conclusion & Actionable Takeaway
Whether streamlining treasury or accelerating transaction speed, forward-thinking teams make every capital asset defend their operating runway.
👉 **[Read the Full Technical Case Study & Documentation]**

---
*Compliance Notice: This article is educational and illustrative. Figures, products, and simulated yields are for demonstration purposes.*`;
  } else if (mode === 'advertisement' || chosenChannel.includes('ad') || chosenChannel.includes('linkedin') || chosenChannel.includes('search')) {
    campaignBody = `### 🎯 Paid Ad Campaign Copy Suite: ${titleCaseSummary}

**Target Segment:** ${effectiveAudience}  
**Product:** ${effectiveProduct}  
**Campaign Objective:** ${goal || 'High-Intent Acquisition'}  
**Prompt Focus:** "${userPromptClean}"

#### Option 1: B2B Sponsored Feed (LinkedIn / Professional Network)
- **Primary Text:** Looking to solve "${userPromptClean.slice(0, 80)}"? With ${effectiveProduct}, modern finance teams unlock automated efficiency, rigorous controls, and transparent terms.
- **Headline:** ${titleCaseSummary} | Built for ${effectiveAudience}
- **Description:** Illustrative 4.85% variable yield sweep and smart expense controls. Zero hidden fees.
- **Call to Action (CTA):** Learn More | Schedule Demo

#### Option 2: High-Intent Search Ad (Google / Search Engine Marketing)
- **Headline 1:** ${effectiveProduct} | Modern FinTech
- **Headline 2:** Built for ${effectiveAudience}
- **Headline 3:** Fast Setup · No Hidden Fees
- **Description 1:** ${userPromptClean.slice(0, 90)}. Start in minutes with institutional security.
- **Description 2:** Automated cash sweep, pass-through FDIC insurance eligibility up to $5M.
- **Display URL:** velofin.sample/start/${effectiveProduct.toLowerCase().replace(/[^a-z0-9]/g, '')}

---
*Compliance Safe Note: All ad variations feature mandatory illustrative prototype disclosures.*`;
  } else if (mode === 'social_media' || chosenChannel.includes('social') || chosenChannel.includes('twitter') || chosenChannel.includes('x')) {
    campaignBody = `### 📱 Social Media Post Suite: ${titleCaseSummary}

**Target Audience:** ${effectiveAudience}  
**Product:** ${effectiveProduct}  
**Tone:** ${effectiveTone}  
**Focus:** "${userPromptClean}"

#### Post 1 (LinkedIn / Long-form Thought Leadership)
Most finance leaders focus heavily on top-line revenue, but overlook the operational efficiencies that preserve runway.

Regarding **${titleCaseSummary}**:
Too often, teams settle for legacy systems that introduce friction, high fees, and sluggish execution.

With **${effectiveProduct}**, we engineered a modern approach:
→ Direct alignment with the needs of ${effectiveAudience}
→ Automated operational velocity and transparent pricing
→ Real-time visibility across all balances and transactions

If you're re-evaluating your stack this quarter, here's the question to ask: Is your current setup helping or hindering your growth?

Let's discuss below 👇

---
#### Post 2 (X / Twitter Thread Preview)
1/4 Quick breakdown on **${titleCaseSummary}** for modern finance teams 🧵👇

2/4 The standard friction: legacy workflows create delay and hidden fees when you need agility most.

3/4 The modern alternative: **${effectiveProduct}** delivers automated cash efficiency and flexible controls built for ${effectiveAudience}.

4/4 Explore our interactive simulator at velofin.sample (Illustrative Prototype).

---
*Notice: Illustrative demo figures. Rates are variable.*`;
  } else {
    // Default to Email Campaign tailored to user prompt
    campaignBody = `### ✉️ Email Campaign Draft: ${titleCaseSummary}

**Target Audience:** ${effectiveAudience}  
**Product Focus:** ${effectiveProduct}  
**Tone:** ${effectiveTone}  
**Campaign Goal:** ${goal || 'Product Adoption & Activation'}  
**User Request:** "${userPromptClean}"

---
**Subject Line:** ${titleCaseSummary} — A smarter approach for ${effectiveAudience}  
**Preview Text:** How ${effectiveProduct} helps modern teams address "${userPromptClean.slice(0, 60)}..."

**Email Body:**
Hi {{FirstName}},

When evaluating how to manage financial operations, ${effectiveAudience} frequently ask us about **${titleCaseSummary}**.

Traditional commercial providers often complicate this with manual paperwork, sluggish clearing times, and near-zero yield on operating reserves.

With **${effectiveProduct}**, we've built a unified platform designed specifically for fast-moving teams:
• **Tailored to Your Goal:** Purpose-built to support ${goal || 'efficient capital growth'} with zero administrative friction.
• **Automated Efficiency:** Real-time visibility, automated multi-bank sweep, and smart spending rules.
• **Institutional Security:** Pass-through FDIC insurance eligibility up to $5M through program partner institutions.

*“Implementing ${effectiveProduct} gave us the transparency and cash velocity we needed to scale confidently.”*  
— *Finance Director, ScaleUp Technologies (Illustrative Customer Story)*

👉 **[Get Started with ${effectiveProduct}]** (Takes less than 3 minutes)

Have questions about your specific requirements? Reply directly to this email to speak with our product team.

Best regards,  
The VeloFin Team

---
*Notice: VeloFin is an illustrative FinTech prototype. All products and rates depicted are for demonstration purposes.*`;
  }

  return {
    content: `${missingInfoSection}${campaignBody}`,
    safeguardAudit: audit,
    isSimulated: true,
    modelUsed: 'simulated-fintech-engine',
  };
}

function generateSimulatedAnalyticsResponse(metricsData: any, userQuery?: string) {
  const isSample = metricsData.isSampleData === true || (!metricsData.isUserData && !metricsData.userEntered);
  const dataSourceLabel = isSample ? 'Illustrative Benchmark Sample Data' : 'User-Entered Campaign Figures';

  const cac = metricsData.cac?.value ?? metricsData.cac ?? '142.50';
  const clv = metricsData.clv?.value ?? metricsData.clv ?? '1850';
  const roas = metricsData.roas?.value ?? metricsData.roas ?? '3.85';
  const ctr = metricsData.ctr?.value ?? metricsData.ctr ?? '3.42';
  const conversionRate = metricsData.conversionRate?.value ?? metricsData.conversionRate ?? '4.15';
  const emailOpenRate = metricsData.emailOpenRate?.value ?? metricsData.emailOpenRate ?? '28.7';
  const ltvCacRatio = metricsData.ltvCacRatio?.value ?? (Number(cac) > 0 ? (Number(clv) / Number(cac)).toFixed(2) : '—');

  let queryAnalysis = '';
  if (userQuery) {
    queryAnalysis = `\n**Response to your query:** "${userQuery}"\n`;
  }

  const channelsList = metricsData.channels || [];
  const topChannel = channelsList[0]?.name || 'Top Paid Channel';
  const topChannelRoas = channelsList[0]?.roas || roas;

  const dataNotice = isSample 
    ? `*⚠️ Benchmark Notice: These observations evaluate illustrative demo sample data. Hypotheses should be tested in controlled cohorts rather than assumed as guaranteed outcomes.*`
    : `*📊 User-Entered Data Notice: Analysis is generated directly from your manually entered campaign totals (${metricsData.campaigns?.length || 'entered'} campaigns). Adjust figures or add new campaign periods to update insights.*`;

  return {
    insights: `### 📈 Performance Analysis: ${metricsData.periodLabel || metricsData.period || 'Current Reporting Window'}
**Data Source:** ${dataSourceLabel}
${queryAnalysis}
**Executive Summary:**
Across the selected reporting window, your acquisition setup records an overall **ROAS of ${roas}x** and a **blended CAC of $${cac}**. With an estimated LTV:CAC multiplier of **${ltvCacRatio}x**, unit economics demonstrate ${Number(ltvCacRatio) >= 3 ? 'healthy sustainability above standard industry targets (3.0x+)' : 'an opportunity for acquisition cost refinement'}.

---

### 💡 3 Actionable Recommendations from Current Figures

#### 1. Scale High-Efficiency Acquisition Channels
- **Observed Metrics:** Top channel (${topChannel}) is delivering ${topChannelRoas}x ROAS with strong conversion efficiency.
- **Actionable Hypothesis to Test:** 
  Gradually increase weekly allocation by 10-15% on high-performing segments while monitoring marginal CAC stability.
- **Anticipated Impact:** High | **Risk Level:** Low

#### 2. Address Conversion Funnel Drop-Off
- **Observed Metrics:** Blended visitor conversion rate is currently ${conversionRate}%, with opportunities between landing page traffic and customer activation.
- **Actionable Hypothesis to Test:** 
  Implement targeted educational nurture copy emphasizing product security and fast onboarding to accelerate initial deposit completion.
- **Anticipated Impact:** Moderate | **Risk Level:** Minimal

#### 3. Optimize Ad Creative & Messaging Alignment
- **Observed Metrics:** Current CTR stands at ${ctr}%, with email engagement at ${emailOpenRate}%.
- **Actionable Hypothesis to Test:** 
  A/B test value-first value propositions (e.g. quantified runway impact and multi-bank FDIC protections) against generic feature lists.
- **Anticipated Impact:** Moderate | **Risk Level:** Very Low

---
${dataNotice}`,
    isSimulated: true,
    modelUsed: 'simulated-analytics-engine',
  };
}
