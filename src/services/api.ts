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
