import { 
  WritingMode, 
  RiskLevel, 
  FlaggedIssue, 
  SafeguardCheck, 
  SafetyReviewResult, 
  SafetyHistoryRecord 
} from '../types';

export const SAFETY_HISTORY_STORAGE_KEY = 'velofin_safety_history';
export const SAFETY_HISTORY_SOURCE_KEY = 'velofin_safety_history_source'; // 'user' | 'sample'

export interface WritingModeConfig {
  id: WritingMode;
  label: string;
  badgeLabel: string;
  description: string;
  colorName: string;
  hex: string;
  borderClass: string;
  activeBorderClass: string;
  bgClass: string;
  badgeClass: string;
  tagClass: string;
  defaultChannel: string;
  defaultTone: string;
  defaultGoal: string;
  guidelines: string;
}

export const WRITING_MODES: Record<WritingMode, WritingModeConfig> = {
  blog: {
    id: 'blog',
    label: 'Blog',
    badgeLabel: 'Blog Post',
    description: 'Long-form thought leadership, SEO educational guides, benchmark deep dives',
    colorName: 'Indigo',
    hex: '#4F46E5',
    borderClass: 'border-indigo-200',
    activeBorderClass: 'border-indigo-600 ring-1 ring-indigo-500 bg-indigo-50/40',
    bgClass: 'bg-indigo-50/30',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tagClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    defaultChannel: 'Blog Post Draft',
    defaultTone: 'Authoritative & Educational',
    defaultGoal: 'Organic SEO & Thought Leadership',
    guidelines: 'Structure with an executive introduction, contextualized sub-headings, clear data tables or benchmark callouts, and standard FinTech disclaimers.',
  },
  email: {
    id: 'email',
    label: 'Email',
    badgeLabel: 'Email Campaign',
    description: 'Direct outbound sequences, founder onboarding drips, product newsletters',
    colorName: 'Teal',
    hex: '#0F766E',
    borderClass: 'border-teal-200',
    activeBorderClass: 'border-teal-600 ring-1 ring-teal-500 bg-teal-50/40',
    bgClass: 'bg-teal-50/30',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    tagClass: 'text-teal-700 bg-teal-50 border-teal-200',
    defaultChannel: 'Email Campaign',
    defaultTone: 'Data-Driven & Concise',
    defaultGoal: 'Treasury Account Activations',
    guidelines: 'Craft compelling subject lines, single focused call to action, variable APY disclaimers, and clear value proposition without generic fluff.',
  },
  advertisement: {
    id: 'advertisement',
    label: 'Advertisement',
    badgeLabel: 'Paid Ad Copy',
    description: 'Google Search headlines, LinkedIn sponsored copy, high-intent display text',
    colorName: 'Amber',
    hex: '#B45309',
    borderClass: 'border-amber-200',
    activeBorderClass: 'border-amber-600 ring-1 ring-amber-500 bg-amber-50/40',
    bgClass: 'bg-amber-50/30',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    tagClass: 'text-amber-800 bg-amber-50 border-amber-200',
    defaultChannel: 'Paid Ad Copy (LinkedIn & Search)',
    defaultTone: 'Direct & Action-Oriented',
    defaultGoal: 'Demo Bookings & Clicks',
    guidelines: 'Provide headline variations, body snippets with concrete metrics (e.g. 1.5% cashback, up to $5M FDIC sweep), and explicit compliance footnote.',
  },
  social_media: {
    id: 'social_media',
    label: 'Social Media',
    badgeLabel: 'Social Post',
    description: 'Executive X/LinkedIn posts, founder insights, milestone updates',
    colorName: 'Sky',
    hex: '#0284C7',
    borderClass: 'border-sky-200',
    activeBorderClass: 'border-sky-600 ring-1 ring-sky-500 bg-sky-50/40',
    bgClass: 'bg-sky-50/30',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    tagClass: 'text-sky-700 bg-sky-50 border-sky-200',
    defaultChannel: 'Social Media Suite',
    defaultTone: 'Conversational & Engaging',
    defaultGoal: 'Brand Awareness & Inbound Interest',
    guidelines: 'Engaging hook, punchy line breaks, relatable startup finance takeaway, and a conversational CTA inviting discussion.',
  },
  customer_support: {
    id: 'customer_support',
    label: 'Customer Support Response',
    badgeLabel: 'Support Response',
    description: 'FAQ replies, account security concerns, dispute routing, de-escalation',
    colorName: 'Rose',
    hex: '#BE123C',
    borderClass: 'border-rose-200',
    activeBorderClass: 'border-rose-600 ring-1 ring-rose-500 bg-rose-50/40',
    bgClass: 'bg-rose-50/30',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    tagClass: 'text-rose-700 bg-rose-50 border-rose-200',
    defaultChannel: 'Customer Support FAQ',
    defaultTone: 'Empathetic, Transparent & De-escalating',
    defaultGoal: 'Safe Resolution & Human Escalation',
    guidelines: 'Reassure client immediately. For fraud, disputes, or frozen funds: NEVER speculate, confirm isolation of the issue, and provide clear human routing.',
  },
  product_recommendation: {
    id: 'product_recommendation',
    label: 'Product Recommendation',
    badgeLabel: 'Product Match',
    description: 'Needs-based product matching across treasury, credit lines, cards, and FX',
    colorName: 'Emerald',
    hex: '#047857',
    borderClass: 'border-emerald-200',
    activeBorderClass: 'border-emerald-600 ring-1 ring-emerald-500 bg-emerald-50/40',
    bgClass: 'bg-emerald-50/30',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    defaultChannel: 'Product Recommendation',
    defaultTone: 'Consultative & Objective',
    defaultGoal: 'Qualified Segment Routing',
    guidelines: 'Compare trade-offs between products (e.g. Treasury sweep vs Revenue Credit line) without steering or offering unregistered investment advice.',
  },
};

// Safe string masking to prevent exposing secrets, OTPs, or card credentials in excerpts or logs
export function maskSensitiveSecrets(text: string): string {
  if (!text) return '';

  let masked = text;

  // Mask Social Security Numbers (e.g. 042-55-9182 or 042 55 9182)
  masked = masked.replace(/\b\d{3}[- ]\d{2}[- ]\d{4}\b/g, '•••-••-••••');

  // Mask 15-16 digit card numbers
  masked = masked.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '•••• •••• •••• ••••');

  // Mask OTP / verification codes (e.g. "otp: 938102", "code 492019", "code is 123456", "2fa: 881920", "pin 9481")
  masked = masked.replace(/(otp|code|pin|passcode|token|verification\s*code|2fa\s*code|secret)[:\s=]+(\d{4,8})/gi, '$1: ••••••');
  masked = masked.replace(/(\b\d{6}\b)/g, (match, p1, offset, str) => {
    // Only mask standalone 6-digit numbers if in proximity of keywords or likely credentials
    const nearby = str.substring(Math.max(0, offset - 35), Math.min(str.length, offset + 35)).toLowerCase();
    if (/otp|code|pin|verify|verification|password|auth|2fa|login/i.test(nearby)) {
      return '••••••';
    }
    return match;
  });

  // Mask passwords / CVVs
  masked = masked.replace(/(password|passwd|pwd|cvv|cvc|security\s*code)[:\s=]+([^\s,;]+)/gi, '$1: ••••••');

  return masked;
}

// Truncate and mask text for excerpt display
export function getSafeExcerpt(text: string, maxLength = 160): string {
  if (!text) return '';
  const masked = maskSensitiveSecrets(text.trim());
  // Replace newlines and excessive whitespace
  const singleLine = masked.replace(/\s+/g, ' ');
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength) + '...';
}

// Determine Risk Level from numerical score (higher score = lower detected risk)
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 90) return 'low';
  if (score >= 70) return 'moderate';
  if (score >= 40) return 'high';
  return 'critical';
}

export function getRiskLevelBadge(level: RiskLevel): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBg: string;
} {
  switch (level) {
    case 'low':
      return {
        label: 'Low Risk',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800',
      };
    case 'moderate':
      return {
        label: 'Moderate Risk',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800',
      };
    case 'high':
      return {
        label: 'High Risk',
        bgClass: 'bg-orange-50',
        textClass: 'text-orange-700',
        borderClass: 'border-orange-200',
        badgeBg: 'bg-orange-100 text-orange-800',
      };
    case 'critical':
      return {
        label: 'Critical Risk',
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        borderClass: 'border-red-200',
        badgeBg: 'bg-red-100 text-red-800',
      };
  }
}

// Core Safety Evaluation Engine
export function performComprehensiveSafetyReview(
  userPrompt: string,
  generatedResponse: string,
  mode: WritingMode
): SafetyReviewResult {
  const combinedText = `${userPrompt} \n\n ${generatedResponse}`;
  const lowerPrompt = userPrompt.toLowerCase();
  const lowerResponse = generatedResponse.toLowerCase();
  const lowerCombined = combinedText.toLowerCase();

  const flaggedIssues: FlaggedIssue[] = [];
  const checks: SafeguardCheck[] = [];
  let score = 100;

  // -------------------------------------------------------------
  // CHECK 1: OTP, PASSWORDS, ACCOUNT CREDENTIALS & SENSITIVE PII
  // -------------------------------------------------------------
  const otpPatternInPrompt = /\b(otp|one-time\s+passcode|verification\s+code|auth\s+code|secret\s+pin)\b/i.test(lowerPrompt);
  const asksForCredential = /(enter|provide|send|repeat|verify|share|type|confirm)\s+(your\s+)?(otp|password|pin|cvv|passcode|secret|card\s+number|account\s+credential)/i.test(lowerCombined);
  const containsSSN = /\b\d{3}[- ]\d{2}[- ]\d{4}\b/.test(combinedText);
  const containsCard = /\b(?:\d{4}[ -]?){3}\d{4}\b/.test(combinedText);
  const containsRawPassword = /(password|passwd|pwd|cvv|cvc)[:\s=]+([a-zA-Z0-9!@#$%^&*]{4,})/i.test(combinedText);

  const hasCredentialViolation = otpPatternInPrompt || asksForCredential || containsSSN || containsCard || containsRawPassword;
  let hasCredentialRisk = false;
  let credentialWarning: string | undefined = undefined;

  if (hasCredentialViolation) {
    hasCredentialRisk = true;
    score -= 65; // Severe risk deduction
    credentialWarning = '⚠️ Never share verification codes, OTPs, passwords, or account credentials. VeloFin representatives will never ask for your verification code.';

    flaggedIssues.push({
      id: 'issue-credential-security',
      category: 'Credential & PII Protection',
      severity: 'critical',
      title: 'Credential or Verification Code Exposure Detected',
      explanation: 'Requests to collect, provide, verify, or repeat an OTP, password, PIN, CVV, or payment credential violate core FinTech security policies.',
      flaggedPhrase: containsSSN ? 'SSN Pattern (Masked)' : containsCard ? 'Card Number (Masked)' : 'OTP / Verification Code Request',
      recommendation: 'Remove credential references immediately. Show clear warning: "Never share verification codes or account credentials."',
    });

    checks.push({
      name: 'Credential & Authentication Protection',
      passed: false,
      explanation: 'Critical Flag: Request or text references one-time verification codes, passwords, or unmasked credentials.',
    });
  } else {
    checks.push({
      name: 'Credential & Authentication Protection',
      passed: true,
      explanation: 'Passed: No requests for OTPs, passwords, PINs, or raw account credentials detected.',
    });
  }

  // -------------------------------------------------------------
  // CHECK 2: GUARANTEED FINANCIAL RETURNS & UNSUPPORTED YIELDS
  // -------------------------------------------------------------
  const guaranteedReturnsPattern = /guarantee(d)?\s+(return|profit|yield|rate|gain)|risk-free\s+(investment|return|yield|growth)|(100%|surefire)\s+(profit|success)|cannot\s+lose\s+money/i.test(lowerCombined);
  
  if (guaranteedReturnsPattern) {
    score -= 35;
    flaggedIssues.push({
      id: 'issue-guaranteed-returns',
      category: 'Return Guarantees',
      severity: 'high',
      title: 'Prohibited Guaranteed Return Claim',
      explanation: 'Promising guaranteed yields, risk-free interest rates, or surefire investment gains violates FTC and SEC marketing guidelines.',
      flaggedPhrase: 'Guaranteed / risk-free claim in copy',
      recommendation: 'Disclose all yields as variable, subject to market fluctuations, and cite the FDIC insured sweep mechanism rather than guaranteeing returns.',
    });

    checks.push({
      name: 'Yield Accuracy & Anti-Guarantee Standard',
      passed: false,
      explanation: 'Flagged: Contains language suggesting guaranteed financial gains or risk-free returns.',
    });
  } else {
    checks.push({
      name: 'Yield Accuracy & Anti-Guarantee Standard',
      passed: true,
      explanation: 'Passed: Rates are properly described without deceptive zero-risk promises.',
    });
  }

  // -------------------------------------------------------------
  // CHECK 3: PERSONALIZED FINANCIAL & TAX ADVICE
  // -------------------------------------------------------------
  const personalizedAdvicePattern = /(you\s+must|you\s+should)\s+(personally\s+)?(invest|allocate|put\s+your\s+runway|buy|sell)|(our\s+tax\s+advice\s+to\s+you|we\s+advise\s+you\s+to\s+write\s+off)/i.test(lowerCombined);

  if (personalizedAdvicePattern) {
    score -= 25;
    flaggedIssues.push({
      id: 'issue-financial-advice',
      category: 'Unregistered Advisory',
      severity: 'moderate',
      title: 'Personalized Financial or Tax Advice',
      explanation: 'Marketing content and automated assistants must not provide individual financial steering or tax counseling.',
      flaggedPhrase: 'Personal investment or tax directive',
      recommendation: 'Frame content as educational product features and recommend that users consult certified financial planners or CPAs.',
    });

    checks.push({
      name: 'General Education vs. Personalized Advice',
      passed: false,
      explanation: 'Flagged: Directives suggest individual portfolio or tax allocation counsel.',
    });
  } else {
    checks.push({
      name: 'General Education vs. Personalized Advice',
      passed: true,
      explanation: 'Passed: Content maintains neutral product education without individual financial advice.',
    });
  }

  // -------------------------------------------------------------
  // CHECK 4: SENSITIVE SUPPORT INQUIRIES & HUMAN ESCALATION
  // -------------------------------------------------------------
  const isSensitiveSupportIssue = /fraud|unauthorized|stolen|hacked|freeze|frozen|dispute|compromised|subpoena|regulatory\s+audit/i.test(lowerPrompt);
  const routesToHuman = /human|representative|support\s+desk|compliance\s+officer|security\s+specialist|security\s+team|ticket|concierge|priority\s+case/i.test(lowerResponse);

  let requiresHumanEscalation = false;

  if (isSensitiveSupportIssue) {
    if (!routesToHuman) {
      score -= 35;
      requiresHumanEscalation = true;
      flaggedIssues.push({
        id: 'issue-missing-human-escalation',
        category: 'Sensitive Support Routing',
        severity: 'high',
        title: 'Missing Human Escalation for Sensitive Inquiry',
        explanation: 'Customer inquiry involves fraud, disputed transactions, or account lockouts, but the response does not route to an accredited human specialist.',
        flaggedPhrase: 'Inquiry mentions urgent security concern without human dispatch',
        recommendation: 'Immediately provide explicit contact routing to the FinTech Security & Fraud Desk (e.g. priority case creation and verified callback).',
      });

      checks.push({
        name: 'Urgent Support & Human Escalation Protocol',
        passed: false,
        explanation: 'Warning: Urgent security/fraud matters must provide clear handoff to human representatives.',
      });
    } else {
      requiresHumanEscalation = true; // Still mark as needing human touch, but passed because response correctly escalated!
      checks.push({
        name: 'Urgent Support & Human Escalation Protocol',
        passed: true,
        explanation: 'Passed: Sensitive security inquiry appropriately prioritizes human specialist dispatch.',
      });
    }
  } else {
    checks.push({
      name: 'Urgent Support & Human Escalation Protocol',
      passed: true,
      explanation: 'Passed: Standard request does not require emergency fraud escalation routing.',
    });
  }

  // -------------------------------------------------------------
  // CHECK 5: REQUIRED DISCLOSURES & FOOTNOTES
  // -------------------------------------------------------------
  const hasComplianceDisclaimer = /illustrative|prototype|hypothetical|sample|fdic|variable\s+apy|terms\s+apply|subject\s+to/i.test(lowerResponse);

  if (!hasComplianceDisclaimer && mode !== 'customer_support') {
    score -= 10;
    flaggedIssues.push({
      id: 'issue-missing-disclaimer',
      category: 'Regulatory Disclosures',
      severity: 'low',
      title: 'Missing Prototype / Illustrative Disclosure',
      explanation: 'FinTech marketing materials should include concise illustrative rate disclosures and FDIC pass-through references.',
      recommendation: 'Attach standard footer: "Rates are variable and illustrative. Deposits held at FDIC-insured partner banks up to $5M."',
    });

    checks.push({
      name: 'Regulatory Disclosures & Sample Framing',
      passed: false,
      explanation: 'Notice: Standard illustrative product disclosures are missing or incomplete.',
    });
  } else {
    checks.push({
      name: 'Regulatory Disclosures & Sample Framing',
      passed: true,
      explanation: 'Passed: Contains necessary variable yield and partner bank framing disclosures.',
    });
  }

  // Clamp score
  const finalScore = Math.max(5, Math.min(100, score));
  const riskLevel = getRiskLevelFromScore(finalScore);

  // Generate concise summary
  let summary = '';
  if (finalScore >= 90) {
    summary = 'Low risk detected. Content aligns with FinTech advertising standards and includes appropriate disclosures.';
  } else if (finalScore >= 70) {
    summary = `Moderate risk (${flaggedIssues.length} issue${flaggedIssues.length === 1 ? '' : 's'} noted). Review recommendations before publishing.`;
  } else if (finalScore >= 40) {
    summary = `High risk detected. Identified ${flaggedIssues.length} compliance concerns including ${flaggedIssues[0]?.title || 'regulatory policies'}.`;
  } else {
    summary = `Critical risk detected. Violates fundamental authentication security or prohibited return guarantees.`;
  }

  return {
    score: finalScore,
    riskLevel,
    passed: finalScore >= 70 && !hasCredentialRisk,
    summary,
    flaggedIssues,
    hasCredentialRisk,
    credentialWarning,
    requiresHumanEscalation,
    maskedUserPrompt: maskSensitiveSecrets(userPrompt),
    maskedResponseExcerpt: getSafeExcerpt(generatedResponse, 200),
    checks,
    disclaimer: 'Automated risk indicator for guidance only. Does not constitute legal compliance approval or a safety guarantee.',
  };
}

// -------------------------------------------------------------
// LOCAL STORAGE SAFETY HISTORY HELPERS
// -------------------------------------------------------------

export function loadSafetyHistory(): SafetyHistoryRecord[] {
  try {
    const raw = localStorage.getItem(SAFETY_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse safety history from localStorage:', err);
    return [];
  }
}

export function saveSafetyHistory(history: SafetyHistoryRecord[]): void {
  try {
    localStorage.setItem(SAFETY_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to save safety history to localStorage:', err);
  }
}

export function addSafetyHistoryRecord(record: SafetyHistoryRecord): void {
  const current = loadSafetyHistory();
  // Keep newest at front, cap at 100 entries to prevent local storage bloat
  const updated = [record, ...current].slice(0, 100);
  saveSafetyHistory(updated);
}

export function clearSafetyHistory(): void {
  try {
    localStorage.removeItem(SAFETY_HISTORY_STORAGE_KEY);
  } catch {}
}

export function loadSafetyHistorySource(): 'user' | 'sample' {
  try {
    const val = localStorage.getItem(SAFETY_HISTORY_SOURCE_KEY);
    if (val === 'sample' || val === 'user') return val;
  } catch {}
  return 'user';
}

export function saveSafetyHistorySource(source: 'user' | 'sample'): void {
  try {
    localStorage.setItem(SAFETY_HISTORY_SOURCE_KEY, source);
  } catch {}
}

// Curated sample review records to demonstrate audit history
export const SAMPLE_SAFETY_HISTORY: SafetyHistoryRecord[] = [
  {
    id: 'safe-hist-01',
    timestamp: '2026-09-28T04:15:00Z',
    formattedDate: 'Sep 28, 2026 · 04:15 AM',
    mode: 'email',
    modeLabel: 'Email',
    score: 95,
    riskLevel: 'low',
    flaggedCategories: [],
    maskedExcerpt: 'Subject: Optimize your Q4 cash reserves with automated sweep treasury. Earn an illustrative 4.85% variable APY across FDIC partner banks...',
    review: {
      score: 95,
      riskLevel: 'low',
      passed: true,
      summary: 'Low risk detected. Content aligns with FinTech advertising standards and includes appropriate disclosures.',
      flaggedIssues: [],
      hasCredentialRisk: false,
      requiresHumanEscalation: false,
      maskedUserPrompt: 'Draft an email introducing VeloYield Treasury to startup founders holding idle cash in checking accounts.',
      maskedResponseExcerpt: 'Subject: Optimize your Q4 cash reserves with automated sweep treasury. Earn an illustrative 4.85% variable APY across FDIC partner banks...',
      checks: [
        { name: 'Credential & Authentication Protection', passed: true, explanation: 'Passed: No requests for OTPs or passwords.' },
        { name: 'Yield Accuracy & Anti-Guarantee Standard', passed: true, explanation: 'Passed: Rates properly identified as variable.' },
        { name: 'General Education vs. Personalized Advice', passed: true, explanation: 'Passed: Neutral educational framing.' },
        { name: 'Urgent Support & Human Escalation Protocol', passed: true, explanation: 'Passed: Standard request.' },
        { name: 'Regulatory Disclosures & Sample Framing', passed: true, explanation: 'Passed: Variable yield disclaimers included.' },
      ],
      disclaimer: 'Automated risk indicator for guidance only. Does not constitute legal compliance approval or a safety guarantee.',
    },
    isSample: true,
  },
  {
    id: 'safe-hist-02',
    timestamp: '2026-09-28T03:40:00Z',
    formattedDate: 'Sep 28, 2026 · 03:40 AM',
    mode: 'customer_support',
    modeLabel: 'Customer Support Response',
    score: 85,
    riskLevel: 'moderate',
    flaggedCategories: ['Sensitive Support Routing'],
    maskedExcerpt: 'Dear Valued Customer, we have isolated the disputed card transaction and escalated Priority Case #VF-88419 to a Senior Fraud Specialist...',
    review: {
      score: 85,
      riskLevel: 'moderate',
      passed: true,
      summary: 'Moderate risk. Sensitive fraud inquiry safely escalated to human specialist.',
      flaggedIssues: [
        {
          id: 'sample-support-1',
          category: 'Sensitive Support Routing',
          severity: 'moderate',
          title: 'Urgent Fraud Inquiry Routed to Human',
          explanation: 'Inquiry involves an unauthorized transaction claim. Response correctly routed case to senior human security officer.',
          recommendation: 'Confirm human representative initiates contact within 15 minutes.',
        },
      ],
      hasCredentialRisk: false,
      requiresHumanEscalation: true,
      maskedUserPrompt: 'A customer says: "I see an unauthorized charge of $4,200 on our virtual card that nobody approved. Was our account hacked?!"',
      maskedResponseExcerpt: 'Dear Valued Customer, we have isolated the disputed card transaction and escalated Priority Case #VF-88419 to a Senior Fraud Specialist...',
      checks: [
        { name: 'Credential & Authentication Protection', passed: true, explanation: 'Passed: Reminded customer never to share passwords.' },
        { name: 'Yield Accuracy & Anti-Guarantee Standard', passed: true, explanation: 'Passed: No yield claims.' },
        { name: 'General Education vs. Personalized Advice', passed: true, explanation: 'Passed: Operational security guidance.' },
        { name: 'Urgent Support & Human Escalation Protocol', passed: true, explanation: 'Passed: Appropriately routed to human fraud team.' },
        { name: 'Regulatory Disclosures & Sample Framing', passed: true, explanation: 'Passed: Prototype disclaimer attached.' },
      ],
      disclaimer: 'Automated risk indicator for guidance only. Does not constitute legal compliance approval or a safety guarantee.',
    },
    isSample: true,
  },
  {
    id: 'safe-hist-03',
    timestamp: '2026-09-27T19:22:00Z',
    formattedDate: 'Sep 27, 2026 · 07:22 PM',
    mode: 'advertisement',
    modeLabel: 'Advertisement',
    score: 45,
    riskLevel: 'high',
    flaggedCategories: ['Return Guarantees', 'Regulatory Disclosures'],
    maskedExcerpt: 'Earn a guaranteed 12% risk-free return with surefire gains for your corporate treasury reserves...',
    review: {
      score: 45,
      riskLevel: 'high',
      passed: false,
      summary: 'High risk detected. Identified 2 compliance concerns including prohibited guaranteed returns.',
      flaggedIssues: [
        {
          id: 'sample-ad-1',
          category: 'Return Guarantees',
          severity: 'high',
          title: 'Prohibited Guaranteed Return Claim',
          explanation: 'Promising guaranteed yields or risk-free financial returns violates SEC and FTC marketing guidelines.',
          flaggedPhrase: 'guaranteed 12% risk-free return',
          recommendation: 'Replace with variable APY language and remove zero-risk promises.',
        },
      ],
      hasCredentialRisk: false,
      requiresHumanEscalation: false,
      maskedUserPrompt: 'Write ad copy claiming our account provides a guaranteed 12% risk-free return with zero loss.',
      maskedResponseExcerpt: 'Earn a guaranteed 12% risk-free return with surefire gains for your corporate treasury reserves...',
      checks: [
        { name: 'Credential & Authentication Protection', passed: true, explanation: 'Passed: No credentials.' },
        { name: 'Yield Accuracy & Anti-Guarantee Standard', passed: false, explanation: 'Flagged: Promising guaranteed yields violates rules.' },
        { name: 'General Education vs. Personalized Advice', passed: true, explanation: 'Passed: General ad format.' },
        { name: 'Urgent Support & Human Escalation Protocol', passed: true, explanation: 'Passed: Standard request.' },
        { name: 'Regulatory Disclosures & Sample Framing', passed: false, explanation: 'Notice: Missing required disclosures.' },
      ],
      disclaimer: 'Automated risk indicator for guidance only. Does not constitute legal compliance approval or a safety guarantee.',
    },
    isSample: true,
  },
  {
    id: 'safe-hist-04',
    timestamp: '2026-09-27T14:05:00Z',
    formattedDate: 'Sep 27, 2026 · 02:05 PM',
    mode: 'customer_support',
    modeLabel: 'Customer Support Response',
    score: 25,
    riskLevel: 'critical',
    flaggedCategories: ['Credential & PII Protection'],
    maskedExcerpt: 'Never share verification codes or account credentials. VeloFin representatives will never request your one-time passcode or password...',
    review: {
      score: 25,
      riskLevel: 'critical',
      passed: false,
      summary: 'Critical risk detected. Request attempts to elicit one-time verification passcode (OTP).',
      flaggedIssues: [
        {
          id: 'sample-crit-1',
          category: 'Credential & PII Protection',
          severity: 'critical',
          title: 'Credential or Verification Code Exposure Detected',
          explanation: 'Requests to collect, provide, verify, or repeat an OTP, password, PIN, CVV, or payment credential violate core FinTech security policies.',
          flaggedPhrase: 'OTP / Verification Code Request',
          recommendation: 'Never collect or repeat verification codes. Direct user to in-app secure portal.',
        },
      ],
      hasCredentialRisk: true,
      credentialWarning: '⚠️ Never share verification codes, OTPs, passwords, or account credentials. VeloFin representatives will never ask for your verification code.',
      requiresHumanEscalation: true,
      maskedUserPrompt: 'Please tell the customer to reply with the 6-digit OTP code sent to their phone to verify their account.',
      maskedResponseExcerpt: 'Never share verification codes or account credentials. VeloFin representatives will never request your one-time passcode or password...',
      checks: [
        { name: 'Credential & Authentication Protection', passed: false, explanation: 'Critical Flag: Request attempts to collect OTP verification codes.' },
        { name: 'Yield Accuracy & Anti-Guarantee Standard', passed: true, explanation: 'Passed.' },
        { name: 'General Education vs. Personalized Advice', passed: true, explanation: 'Passed.' },
        { name: 'Urgent Support & Human Escalation Protocol', passed: true, explanation: 'Passed: Routes to secure human portal.' },
        { name: 'Regulatory Disclosures & Sample Framing', passed: true, explanation: 'Passed.' },
      ],
      disclaimer: 'Automated risk indicator for guidance only. Does not constitute legal compliance approval or a safety guarantee.',
    },
    isSample: true,
  },
];
