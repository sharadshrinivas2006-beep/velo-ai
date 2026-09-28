export type TimeRange = '7d' | '30d' | 'q3' | 'ytd';

export interface SafeguardCheck {
  name: string;
  passed: boolean;
  explanation: string;
}

export interface SafeguardAuditResult {
  passed: boolean;
  score: number;
  checks: SafeguardCheck[];
  disclaimer: string;
}

export interface CampaignParameters {
  channel: string;
  targetAudience: string;
  goal: string;
  tone: string;
  product: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parameters?: Partial<CampaignParameters>;
  missingFields?: string[];
  safeguardAudit?: SafeguardAuditResult;
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
  channel: 'Paid Search' | 'LinkedIn B2B' | 'Paid Social' | 'Email Nurture' | 'Content/SEO' | 'Referral';
  targetSegment: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number; // percentage e.g. 3.4
  conversions: number;
  cac: number; // dollars e.g. 142.50
  roas: number; // e.g. 3.8
  status: 'Active' | 'Paused' | 'Optimizing';
  product: string;
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
