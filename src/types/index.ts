export type TimeRange = '7d' | '30d' | 'q3' | 'ytd';

export type WritingMode = 
  | 'blog'
  | 'email'
  | 'advertisement'
  | 'social_media'
  | 'customer_support'
  | 'product_recommendation';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface FlaggedIssue {
  id: string;
  category: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  explanation: string;
  flaggedPhrase?: string;
  recommendation: string;
}

export interface SafeguardCheck {
  name: string;
  passed: boolean;
  explanation: string;
}

export interface SafeguardAuditResult {
  passed: boolean;
  score: number; // 0-100, higher means lower detected risk
  riskLevel?: RiskLevel;
  checks: SafeguardCheck[];
  disclaimer: string;
  flaggedIssues?: FlaggedIssue[];
  hasCredentialRisk?: boolean;
  requiresHumanEscalation?: boolean;
  credentialWarning?: string;
  maskedPrompt?: string;
  maskedExcerpt?: string;
}

export interface SafetyReviewResult {
  score: number; // 0-100 (100 = lowest risk)
  riskLevel: RiskLevel;
  passed: boolean;
  summary: string;
  flaggedIssues: FlaggedIssue[];
  hasCredentialRisk: boolean;
  credentialWarning?: string;
  requiresHumanEscalation: boolean;
  maskedUserPrompt: string;
  maskedResponseExcerpt: string;
  checks: SafeguardCheck[];
  disclaimer: string;
}

export interface SafetyHistoryRecord {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string;
  mode: WritingMode;
  modeLabel: string;
  score: number;
  riskLevel: RiskLevel;
  flaggedCategories: string[];
  maskedExcerpt: string;
  review: SafetyReviewResult;
  isSample?: boolean;
}

export interface CampaignParameters {
  channel: string;
  targetAudience: string;
  goal: string;
  tone: string;
  product: string;
  writingMode?: WritingMode;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parameters?: Partial<CampaignParameters>;
  missingFields?: string[];
  safeguardAudit?: SafeguardAuditResult;
  safetyReview?: SafetyReviewResult;
  isSimulated?: boolean;
  modelUsed?: string;
}

export interface SavedDraft {
  id: string;
  title: string;
  channel: string;
  product: string;
  content: string;
  updatedAt: string;
  version: number;
  history: string[];
}

export interface CampaignData {
  id: string;
  name: string;
  channel: string;
  targetSegment: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | string; // percentage e.g. 3.4 or '—'
  conversions: number;
  cac: number | string; // dollars e.g. 142.50 or '—'
  roas: number | string; // e.g. 3.8 or '—'
  status: 'Active' | 'Paused' | 'Optimizing';
  product: string;
  date?: string; // e.g. '2026-09-18'
  websiteVisits?: number;
  newCustomers?: number;
  attributedRevenue?: number;
  emailDelivered?: number;
  emailOpens?: number;
  estimatedLtv?: number;
}

export interface UserCampaign {
  id: string;
  name: string;
  channel: string;
  date: string; // YYYY-MM-DD
  spend: number; // ad spend ($)
  impressions: number;
  clicks: number;
  websiteVisits: number;
  newCustomers: number; // new customers acquired
  attributedRevenue: number; // ($)
  emailDelivered?: number;
  emailOpens?: number;
  estimatedLtv?: number;
  targetSegment?: string;
  product?: string;
  status?: 'Active' | 'Paused' | 'Optimizing';
  createdAt?: string;
}

export interface ChannelMetric {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
  cac: number;
  roas: number;
  ctr: number;
  color: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate?: number;
}

export interface MetricSnapshot {
  value: number | string;
  unit?: string;
  prefix?: string;
  suffix?: string;
  change: number; // percentage change vs prior period
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean;
  description: string;
  benchmarkContext?: string;
}

export interface DashboardMetrics {
  period: string;
  periodLabel: string;
  traffic: MetricSnapshot;
  ctr: MetricSnapshot;
  conversionRate: MetricSnapshot;
  cac: MetricSnapshot;
  roas: MetricSnapshot;
  emailOpenRate: MetricSnapshot;
  clv: MetricSnapshot;
  ltvCacRatio: MetricSnapshot;
  timeSeries: Array<{
    date: string;
    traffic: number;
    conversions: number;
    spend: number;
  }>;
  channels: ChannelMetric[];
  funnel: FunnelStage[];
  campaigns: CampaignData[];
}
