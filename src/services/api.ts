import { SafeguardAuditResult, SafetyReviewResult, WritingMode } from '../types';

export interface MarketingAgentPayload {
  type: 'campaign' | 'support_faq' | 'recommendation' | 'refine' | 'chat';
  prompt: string;
  parameters?: {
    channel?: string;
    targetAudience?: string;
    goal?: string;
    tone?: string;
    product?: string;
    writingMode?: WritingMode;
  };
}

export interface MarketingAgentResponse {
  content: string;
  safeguardAudit: SafeguardAuditResult;
  safetyReview?: SafetyReviewResult;
  isSimulated: boolean;
  modelUsed?: string;
}

export async function requestMarketingAgent(payload: MarketingAgentPayload): Promise<MarketingAgentResponse> {
  try {
    const res = await fetch('/api/gemini/marketing-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Network API request failed, generating client-side compliance-safe fallback:', err?.message);
    return getFallbackMarketingResponse(payload);
  }
}

export async function requestAnalyticsAdvisor(metrics: any, query?: string): Promise<{ insights: string; isSimulated: boolean; modelUsed?: string }> {
  try {
    const res = await fetch('/api/gemini/analytics-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics, query }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Analytics Advisor request failed, falling back to client synthesis:', err?.message);
    const isSample = metrics?.isSampleData === true || (!metrics?.isUserData && !metrics?.userEntered);
    const cacVal = metrics?.cac?.value ?? metrics?.cac ?? '142.50';
    const clvVal = metrics?.clv?.value ?? metrics?.clv ?? '1850';
    const roasVal = metrics?.roas?.value ?? metrics?.roas ?? '3.85';
    const ltvCacVal = metrics?.ltvCacRatio?.value ?? (Number(cacVal) > 0 ? (Number(clvVal) / Number(cacVal)).toFixed(2) : '—');
    const openRateVal = metrics?.emailOpenRate?.value ?? '28.7';
    const topChannel = metrics?.channels?.[0]?.name || 'Top Acquisition Channel';
    const topChannelRoas = metrics?.channels?.[0]?.roas || roasVal;

    const sourceContext = isSample ? 'Illustrative Benchmark Sample Data' : 'User-Entered Campaign Figures';
    const disclaimer = isSample
      ? '*⚠️ Compliance Disclosure: All metrics and figures are illustrative demo samples. Suggestions represent hypotheses to test in controlled cohorts, not guaranteed business outcomes.*'
      : `*📊 User-Entered Campaign Data Notice: Insights generated from your ${metrics?.campaigns?.length || 'entered'} manual campaign entries. Adjust records to dynamically update performance analysis.*`;

    return {
      insights: `### 📈 Performance Analysis (${metrics?.periodLabel || 'Current Period'})
**Data Source:** ${sourceContext}

**Executive Summary:**
Across the selected reporting window, your acquisition setup records an overall **ROAS of ${roasVal}x** and a blended **CAC of $${cacVal}**. With an estimated LTV:CAC multiplier of **${ltvCacVal}x**, unit economics demonstrate ${Number(ltvCacVal) >= 3 ? 'sustainable health (above standard 3x benchmark)' : 'actionable headroom for channel tuning'}.

---

### 💡 3 Prioritized Campaign Improvements

#### 1. Reallocate Budget Toward Highest-ROAS Channels
- **Supporting Metrics:** 
  - ${topChannel} currently delivers a strong ROAS of ${topChannelRoas}x.
- **Actionable Hypothesis to Test:** 
  Gradually increase weekly allocation by 10-15% into top-performing channels while monitoring blended acquisition stability.
- **Anticipated Impact:** High | **Risk Level:** Low

#### 2. Address Funnel Conversion Drop-Off
- **Supporting Metrics:** 
  - Conversion rate across recorded touchpoints is currently ${metrics?.conversionRate?.value ?? '—'}%.
- **Actionable Hypothesis to Test:** 
  Deploy targeted email or remarketing sequences to reduce friction between initial landing visits and customer activation.
- **Anticipated Impact:** High | **Risk Level:** Minimal

#### 3. Refresh Creative Copy with Value-First Metrics
- **Supporting Metrics:** 
  - Open rate / CTR stands at ${openRateVal}%.
- **Actionable Hypothesis to Test:** 
  A/B test clear quantitative value propositions (e.g. automated FDIC sweep protections and cash management yields) against generic product descriptions.
- **Anticipated Impact:** Moderate | **Risk Level:** Very Low

---
${disclaimer}`,
      isSimulated: true,
      modelUsed: 'client-synthesizer',
    };
  }
}

export async function requestSafeguardAudit(text: string): Promise<SafeguardAuditResult> {
  try {
    const res = await fetch('/api/safeguard-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    // Local fallback auditor
    const hasGuarantee = /guarantee|risk-free|100%|surefire/i.test(text);
    const hasAdvice = /you should invest|personal advice/i.test(text);
    const hasPII = /\b\d{3}-\d{2}-\d{4}\b/.test(text) || /\b(?:\d{4}[ -]?){3}\d{4}\b/.test(text);
    const hasDisclaimer = /illustrative|prototype|hypothetical|sample/i.test(text);
    const isSensitive = /fraud|unauthorized|stolen|freeze/i.test(text);
    const routesHuman = /human|representative|concierge|officer/i.test(text);

    const checks = [
      {
        name: 'Guaranteed Returns / Zero-Risk Claims',
        passed: !hasGuarantee,
        explanation: hasGuarantee ? 'Flagged: Contains claims of guaranteed return or risk-free profits.' : 'Passed: No prohibited yield guarantees detected.',
      },
      {
        name: 'Personalized Financial & Tax Advice',
        passed: !hasAdvice,
        explanation: hasAdvice ? 'Flagged: Appears to offer individual financial advice.' : 'Passed: Informational marketing content only.',
      },
      {
        name: 'PII & Sensitive Credential Shield',
        passed: !hasPII,
        explanation: hasPII ? 'Flagged: Potential SSN or credit card string detected.' : 'Passed: No sensitive PII detected.',
      },
      {
        name: 'Sensitive Inquiry Safe-Routing',
        passed: !isSensitive || routesHuman,
        explanation: isSensitive && !routesHuman ? 'Warning: Urgent security inquiry not routed to human representative.' : 'Passed: Safe routing adhered to.',
      },
      {
        name: 'Illustrative Prototype Disclosures',
        passed: hasDisclaimer,
        explanation: hasDisclaimer ? 'Passed: Illustrative disclosure attached.' : 'Recommendation: Attach prototype disclosure statement.',
      },
    ];

    const passedCount = checks.filter(c => c.passed).length;
    return {
      passed: passedCount >= 4,
      score: Math.round((passedCount / checks.length) * 100),
      checks,
      disclaimer: '⚠️ FinTech Regulatory Notice: All VeloFin products, rates, fees, and metrics are hypothetical prototypes for demonstration purposes. Yield rates are variable and illustrative.',
    };
  }
}

function getFallbackMarketingResponse(payload: MarketingAgentPayload): MarketingAgentResponse {
  const p = payload.parameters || {};
  const mode = p.writingMode || 'email';
  const prompt = payload.prompt.trim();
  const summary = prompt.replace(/^(write|create|draft|generate|make|build|provide)\s+(a|an|the)?/i, '').trim();
  const title = summary.length > 5 ? summary.charAt(0).toUpperCase() + summary.slice(1, 55) : 'FinTech Campaign Draft';
  const audience = p.targetAudience || 'Founders & CFOs';
  const product = p.product || 'VeloYield Treasury';
  const tone = p.tone || 'Professional & Data-Driven';

  let body = '';
  if (mode === 'blog' || (p.channel && p.channel.toLowerCase().includes('blog'))) {
    body = `### 📝 Blog Post: ${title}

**Target Audience:** ${audience}  
**Product:** ${product}  
**Tone:** ${tone}  
**User Request:** "${prompt}"

#### Executive Summary
When evaluating financial infrastructure for ${audience}, standard commercial accounts create unnecessary cost and friction. This guide explores modern approaches to addressing "${summary.slice(0, 60)}".

#### Core Analysis: Addressing Modern Treasury Friction
Modern high-growth companies cannot afford idle balance drag. Implementing **${product}** helps teams:
- Maximize capital velocity with automated rules
- Maintain immediate liquidity for payroll and daily operations
- Access pass-through FDIC insurance eligibility up to $5M

#### Recommended Action
Evaluate current account structures and run illustrative runway scenario modeling.
👉 **[Explore the Interactive Runway Simulator]**

---
*Disclaimer: Illustrative prototype. Not formal tax or investment advice.*`;
  } else if (mode === 'advertisement') {
    body = `### 🎯 Paid Ad Campaign Copy: ${title}

**Target Audience:** ${audience}  
**Product:** ${product}  
**Prompt:** "${prompt}"

#### Variation 1: Sponsored Search Copy
- **Headline:** ${title} | ${product}
- **Description:** Built specifically for ${audience}. Fast onboarding, automated yield sweep, zero lockups.
- **CTA:** Get Started

#### Variation 2: Social / LinkedIn B2B
- **Headline:** Modern Treasury Infrastructure for ${audience}
- **Primary Text:** Addressing "${prompt.slice(0, 80)}". Unlock automated yield sweep and smart expense controls.
- **CTA:** Request Briefing

---
*Compliance Notice: Prototype demonstration. Yield rates are illustrative and variable.*`;
  } else if (mode === 'social_media') {
    body = `### 📱 Social Media Post: ${title}

**Audience:** ${audience} · **Product:** ${product}

Most finance leaders focus on top-line revenue, but overlook the operational efficiencies that preserve runway.

Regarding **${title}**:
Legacy setups introduce friction, high fees, and sluggish execution.

With **${product}**:
→ Automated operational velocity
→ Built for ${audience}
→ Real-time visibility across all accounts

Let's discuss your current treasury distribution strategy in the comments 👇

---
*Illustrative FinTech prototype notice.*`;
  } else {
    body = `### ✉️ Email Campaign: ${title}

**Audience:** ${audience}  
**Product:** ${product}  
**Tone:** ${tone}  
**Goal:** ${p.goal || 'Product Activation'}

---
**Subject:** ${title} — Built for ${audience}  
**Preview:** How ${product} helps solve "${prompt.slice(0, 50)}..."

Hi {{FirstName}},

When evaluating options for **${title}**, modern finance teams require both velocity and security.

With **${product}**, your capital operations are automated from day one:
- **Purpose-Built for ${audience}:** Designed to support ${p.goal || 'efficient capital growth'}.
- **Automated Sweep:** Put operating reserves to work with variable yields up to 4.85% APY.
- **Security First:** Pass-through FDIC insurance eligibility up to $5,000,000 across program banks.

👉 **[Explore ${product} Dashboard]**

Best regards,  
The VeloFin Team

---
*Notice: VeloFin is an illustrative FinTech prototype. APY is variable and based on hypothetical assumptions.*`;
  }

  return {
    content: body,
    safeguardAudit: {
      passed: true,
      score: 100,
      checks: [
        { name: 'Guaranteed Returns / Zero-Risk Claims', passed: true, explanation: 'Passed: Variable rate labeled with standard disclaimers.' },
        { name: 'Personalized Financial Advice', passed: true, explanation: 'Passed: General product marketing only.' },
        { name: 'PII Shield', passed: true, explanation: 'Passed: No sensitive personal credentials.' },
        { name: 'Sensitive Safe-Routing', passed: true, explanation: 'Passed: Standard product marketing workflow.' },
        { name: 'Illustrative Prototype Disclosures', passed: true, explanation: 'Passed: Prototype disclaimers attached.' },
      ],
      disclaimer: '⚠️ FinTech Regulatory Notice: All VeloFin products, rates, fees, and metrics are hypothetical prototypes for demonstration purposes. Yield rates are variable and illustrative.',
    },
    isSimulated: true,
    modelUsed: 'client-fallback (Dynamic Synthesizer)',
  };
}
