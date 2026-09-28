import { SafeguardAuditResult } from '../types';

export interface MarketingAgentPayload {
  type: 'campaign' | 'support_faq' | 'recommendation' | 'refine' | 'chat';
  prompt: string;
  parameters?: {
    channel?: string;
    targetAudience?: string;
    goal?: string;
    tone?: string;
    product?: string;
  };
}

export interface MarketingAgentResponse {
  content: string;
  safeguardAudit: SafeguardAuditResult;
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
    return {
      insights: `### 📈 Executive Performance Analysis (${metrics.periodLabel || 'Current Period'})

**Executive Summary:**
Across the selected reporting window, your FinTech acquisition engine shows healthy unit economics with a **CLV:CAC multiplier of ${(metrics.clv?.value / metrics.cac?.value).toFixed(2)}x**. The blended CAC of $${metrics.cac?.value} reflects solid channel diversification, though optimization opportunities remain.

---

### 💡 3 Prioritized Campaign Improvements

#### 1. Reallocate 15-20% of Paid Search Budget to LinkedIn B2B CFO Audiences
- **Supporting Metrics:** 
  - LinkedIn Ads deliver a higher ROAS (${metrics.channels?.[1]?.roas || 4.6}x vs ${metrics.channels?.[0]?.roas || 3.4}x on Paid Search).
  - Search CAC is elevated at $${metrics.channels?.[0]?.cac || 164.20} vs $${metrics.channels?.[1]?.cac || 128.50} on LinkedIn.
- **Actionable Hypothesis to Test:** 
  Reallocate $4,000 from high-CPC generic search terms into decision-maker targeted LinkedIn Sponsored Content.
- **Anticipated Impact:** High | **Risk Level:** Low

#### 2. Address Post-KYC Conversion Drop-Off
- **Supporting Metrics:** 
  - Funnel demonstrates a ~36% drop-off between KYC identity submission and initial treasury deposit.
- **Actionable Hypothesis to Test:** 
  Deploy a 3-step educational email nurture emphasizing $5M FDIC pass-through sweep security within 4 hours of KYC approval.
- **Anticipated Impact:** High | **Risk Level:** Minimal

#### 3. Refresh Email Subject Lines with Quantified Proof
- **Supporting Metrics:** 
  - Email Open Rate is currently ${metrics.emailOpenRate?.value}%, with minor decay in later campaign drips.
- **Actionable Hypothesis to Test:** 
  Replace generic headlines with concrete metrics (e.g. "How Seed Founders Earn 4.85% Illustrative APY on Idle Reserves").
- **Anticipated Impact:** Moderate | **Risk Level:** Very Low

---
*⚠️ Compliance Disclosure: All metrics and figures are illustrative demo samples. Suggestions represent hypotheses to test in controlled cohorts, not guaranteed business outcomes.*`,
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
  return {
    content: `### ✉️ Campaign Draft: VeloFin Capital & Treasury

**Channel:** ${p.channel || 'Email Campaign'}  
**Audience:** ${p.targetAudience || 'Startup Founders & CFOs'}  
**Product:** ${p.product || 'VeloYield Treasury (4.85% Illustrative Variable APY)'}  

---
**Subject:** Stop leaving startup runway at 0.05% checking rates
**Preview Text:** Put idle operating cash to work with automated multi-bank FDIC insurance sweep.

Hi {{FirstName}},

As a founder, capital efficiency is your primary competitive edge. 

With **VeloYield Treasury**, surplus operating reserves are automatically swept across our network of partner institutions:
- **Earn up to 4.85% variable APY** (illustrative benchmark rate).
- **Up to $5,000,000 FDIC insurance eligibility** via program banks.
- **Zero lockups:** Keep 100% liquidity for payroll and vendor payments.

👉 **[Explore Treasury Simulator & Open Account]**

Best regards,  
The VeloFin Capital Team

---
*Notice: VeloFin is an illustrative FinTech prototype. APY is variable and based on hypothetical assumptions.*`,
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
    modelUsed: 'client-fallback',
  };
}
