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
  };
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

export interface SafeguardAuditResult {
  passed: boolean;
  score: number; // 0-100
  checks: Array<{
    name: string;
    passed: boolean;
    explanation: string;
  }>;
  disclaimer: string;
}

export async function generateMarketingContent(req: MarketingAgentRequest) {
  const ai = getGeminiClient();

  // Run local safeguard pre-check for blatant sensitive/harmful inputs
  const localAudit = auditSafeguards(req.prompt);

  if (!ai) {
    // Return high-quality realistic simulated FinTech response
    return generateSimulatedMarketingResponse(req, localAudit);
  }

  try {
    const userPromptWithContext = `
Task Type: ${req.type}
Parameters Provided:
- Channel: ${req.parameters?.channel || 'Unspecified'}
- Target Audience: ${req.parameters?.targetAudience || 'Unspecified'}
- Campaign Goal: ${req.parameters?.goal || 'Unspecified'}
- Tone: ${req.parameters?.tone || 'Professional & Modern FinTech'}
- Product: ${req.parameters?.product || 'General VeloFin Platform'}

User Request:
${req.prompt}

Please review if essential information is missing. If missing, highlight the gaps clearly. Then generate the requested content draft with appropriate FinTech compliance footers and labeled illustrative assumptions.
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
    return generateSimulatedMarketingResponse(req, localAudit);
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
export function auditSafeguards(text: string): SafeguardAuditResult {
  const lower = text.toLowerCase();
  const checks = [];

  // Check 1: No guaranteed returns or unrealistic yield promises
  const hasGuaranteedReturn = /guarantee(d)?\s+(return|profit|yield|rate|gain)/i.test(text) ||
    /risk-free\s+(investment|return|yield)/i.test(text) ||
    /(100%|surefire)\s+(profit|success)/i.test(text);

  checks.push({
    name: 'Guaranteed Returns / Zero-Risk Claims',
    passed: !hasGuaranteedReturn,
    explanation: hasGuaranteedReturn
      ? 'Flagged: Promising guaranteed yields or risk-free financial returns violates SEC/FINRA and FTC marketing compliance.'
      : 'Passed: No misleading guaranteed returns or risk-free yield promises detected.',
  });

  // Check 2: No personalized financial advice without disclaimers
  const givesFinancialAdvice = /you\s+should\s+(invest|buy|sell|put\s+your\s+money)\s+in/i.test(text) ||
    /personal(ly)?\s+recommend\s+for\s+your\s+tax/i.test(text);

  checks.push({
    name: 'Personalized Financial & Tax Advice',
    passed: !givesFinancialAdvice,
    explanation: givesFinancialAdvice
      ? 'Flagged: Content appears to dispense individual financial/tax guidance rather than general product marketing.'
      : 'Passed: Content maintains neutral product education without individual financial advice.',
  });

  // Check 3: Sensitive PII avoidance
  const hasSSNPattern = /\b\d{3}-\d{2}-\d{4}\b/.test(text);
  const hasCardPattern = /\b(?:\d{4}[ -]?){3}\d{4}\b/.test(text);
  const hasPII = hasSSNPattern || hasCardPattern;

  checks.push({
    name: 'PII & Sensitive Credential Shield',
    passed: !hasPII,
    explanation: hasPII
      ? 'Critical Flag: Potential Social Security Number or credit card number sequence detected.'
      : 'Passed: No unmasked Social Security, card, or private credential strings detected.',
  });

  // Check 4: Sensitive customer support escalation detection
  const isSensitiveSupportIssue = /fraud|unauthorized|stolen|hacked|freeze|frozen|subpoena|regulatory\s+audit|lawsuit/i.test(text);
  const routesToHuman = /human|representative|support\s+desk|compliance\s+officer|security\s+team|official\s+status|ticket/i.test(text);

  checks.push({
    name: 'Sensitive Inquiry Safe-Routing',
    passed: !isSensitiveSupportIssue || routesToHuman,
    explanation: isSensitiveSupportIssue && !routesToHuman
      ? 'Warning: Inquiry mentions fraud, frozen funds, or security issues but does not route to human compliance representatives.'
      : 'Passed: Sensitive account security matters are properly routed or not present.',
  });

  // Check 5: Illustrative disclaimer presence
  const hasDisclaimer = /illustrative|prototype|hypothetical|sample|not\s+an\s+official|terms\s+apply|subject\s+to\s+approval/i.test(text);
  checks.push({
    name: 'Illustrative Prototype Disclosures',
    passed: hasDisclaimer,
    explanation: hasDisclaimer
      ? 'Passed: Appropriate disclaimer acknowledging illustrative sample information was found.'
      : 'Recommended: Ensure an explicit "Illustrative Prototype / Not an Official Offer" disclaimer is attached.',
  });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    passed: score >= 80,
    score,
    checks,
    disclaimer: '⚠️ FinTech Regulatory Notice: All VeloFin products, rates, fees, and metrics are hypothetical prototypes for demonstration purposes. Yield rates are variable and illustrative.',
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

  // Handle Campaign Generation (Email, Blog, Ads, Social)
  const chosenChannel = channel?.toLowerCase() || 'email';
  const effectiveProduct = product || 'VeloYield Treasury & VeloCard';
  const effectiveAudience = targetAudience || 'FinTech CFOs and Seed-stage Founders';
  const effectiveTone = tone || 'Authoritative & Data-Driven';

  let campaignBody = '';

  if (chosenChannel.includes('email')) {
    campaignBody = `### ✉️ Email Campaign Draft

**Audience:** ${effectiveAudience}  
**Product:** ${effectiveProduct}  
**Tone:** ${effectiveTone}  

---
**Subject Line:** [Action Required] Stop letting idle cash sit at 0.05%
**Preview Text:** How modern startup finance teams earn up to 4.85% variable APY with automated FDIC sweep.

**Email Body:**
Hi {{FirstName}},

Running a high-growth company means every dollar on your balance sheet should work as hard as your engineering team. 

Yet most commercial banks still offer near-zero return on operating reserves—silently eroding your runway against inflation.

With **${effectiveProduct}**, your treasury operations run on autopilot:
• **Automated Cash Sweep:** Idle balances are swept into a vetted network of partner banks, earning an illustrative **4.85% variable APY**.
• **Multi-Bank Coverage:** Up to **$5,000,000** in pass-through FDIC insurance eligibility through participating program institutions.
• **Instant Liquidity:** Access your operating capital 24/7 with zero lockup penalties or hidden maintenance fees.

*“VeloFin helped us extend our operating runway by 2.4 months purely through automated treasury optimization.”*  
— *Elena Vance, VP of Finance, CloudScale Labs (Illustrative Testimonial)*

👉 **[Explore VeloYield Treasury Dashboard]** (3-minute setup)

Questions? Reply directly to this note or book a 10-minute briefing with our Treasury Engineering Team.

Best regards,  
The VeloFin Team

---
*Illustrative Prototype Notice: VeloFin is a hypothetical FinTech platform. 4.85% APY is variable and based on illustrative benchmark assumptions. Funds swept into program banks are FDIC-insured up to statutory limits upon deposit.*`;
  } else if (chosenChannel.includes('ad') || chosenChannel.includes('linkedin') || chosenChannel.includes('search')) {
    campaignBody = `### 🎯 Paid Ad Campaign Copy Suite

**Target Segment:** ${effectiveAudience}  
**Product:** ${effectiveProduct}  

#### 1. LinkedIn Sponsored Content (B2B CFOs)
**Headline:** Upgrade Your Startup Treasury with Automated Cash Sweep  
**Primary Text:** Traditional banks keep the yield on your runway. VeloFin sweeps idle operating capital into partner banks earning up to 4.85% illustrative variable APY with up to $5M FDIC insurance eligibility. Zero lockups. Full operational liquidity.  
**CTA Button:** Learn More | Schedule Demo  
**Accompanying Creative Note:** Clean dark-mode UI mockup showing real-time yield accrual graph with badge "4.85% Illustrative Variable APY".

#### 2. Google Search Responsive Ads
- **Headline 1:** High-Yield Business Treasury | VeloFin
- **Headline 2:** Automated Cash Management for Startups
- **Headline 3:** Earn 4.85% Illustrative APY
- **Description 1:** Put your startup runway to work. Multi-bank FDIC insurance sweep up to $5M.
- **Description 2:** Built for modern SaaS and e-commerce finance teams. No hidden wire or account fees.
- **Path:** velofin.sample/treasury/startup

---
*Compliance Safe Note: All ad variations feature mandatory illustrative APY disclosures and disclaimer tags.*`;
  } else if (chosenChannel.includes('blog')) {
    campaignBody = `### 📝 Blog Post Draft: Educational Thought Leadership

**Title:** The Modern CFO's Guide to Runway Preservation: Beyond Cutbacks
**Target SEO Keywords:** Startup treasury management, automated cash sweep, corporate cash yield, B2B cash preservation.
**Target Audience:** ${effectiveAudience}

#### Executive Summary
When capital costs rise, extending runway doesn't just mean reducing expenditure—it requires intelligent balance-sheet optimization. This article breaks down how forward-thinking finance teams manage operating liquidity while maximizing passive yield.

#### Section 1: The Hidden Cost of Idle Commercial Balances
Traditional commercial checking accounts often pay less than 0.10% APY. For a Series A startup holding $3,000,000 in reserves, the opportunity cost between 0.10% and an illustrative 4.85% variable yield represents over $140,000 annually—equivalent to an entire junior engineering salary.

#### Section 2: How Program Bank Sweeps Protect and Preserve
Rather than holding funds in a single regional institution, automated FinTech sweep accounts distribute deposits across a consortium of FDIC-member institutions, multiplying insurance protection up to $5M without adding administrative friction.

#### Section 3: Maintaining Same-Day Liquidity
The cardinal rule of treasury management: never sacrifice payroll liquidity for yield. Modern treasury platforms utilize intelligent buffer algorithms that maintain 60 days of operational float while sweeping surplus funds.

#### Key Takeaway & Call to Action
Don't let inflation dictate your runway timeline. Evaluate your cash yield distribution today.  
👉 *[Download the FinTech Treasury Checklist]*

---
*Disclaimer: This article provides general financial technology education and does not constitute formal tax, legal, or investment advice. Figures are illustrative.*`;
  } else {
    campaignBody = `### 📱 Social Media Post Suite (X / Twitter & LinkedIn)

**Post 1 (LinkedIn Long-form):**
Most startup founders spend 40 hours a week optimizing customer acquisition costs.
Yet almost none spend 1 hour optimizing where their $2M seed round sits.

If your capital is parked in a legacy bank paying 0.08%, you are leaving critical runway on the table.

With **${effectiveProduct}**:
→ Automated sweep across partner banks
→ Up to 4.85% illustrative variable APY
→ Pass-through FDIC protection up to $5M
→ Zero lockup on payroll liquidity

Smart finance teams make every dollar defend their runway. 

What is your current treasury distribution strategy? Let's discuss in the comments 👇

---
**Post 2 (X / Twitter Thread):**
1/5 Why are top SaaS CFOs moving operating cash away from traditional checking? A 30-second breakdown on modern treasury yield 🧵👇

2/5 The problem: High inflation + 0.1% legacy checking = your raised round loses purchasing power every single month.

3/5 The solution: FinTech automated sweep accounts that distribute cash across dozens of FDIC partner institutions for higher variable yield + expanded coverage.

4/5 The result: An illustrative 4.85% APY on $1.5M reserves yields ~$72,000/yr in non-dilutive balance sheet buffer.

5/5 Check out our open-source runway preservation simulator: velofin.sample/runway (Illustrative Demo)

---
*Notice: Illustrative demo figures. Yields are variable.*`;
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
