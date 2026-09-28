import { DashboardMetrics, UserCampaign, CampaignData, ChannelMetric, FunnelStage } from '../types';

export const USER_CAMPAIGNS_STORAGE_KEY = 'velofin_user_campaigns';
export const USER_CAMPAIGNS_MODE_KEY = 'velofin_analytics_data_source'; // 'user' | 'sample'

export const SAMPLE_STARTER_CAMPAIGNS: UserCampaign[] = [
  {
    id: 'user-cmp-01',
    name: 'Q3 Treasury Runway Push',
    channel: 'LinkedIn B2B',
    date: '2026-09-24',
    targetSegment: 'Series A/B Startup Founders',
    product: 'VeloYield Treasury',
    status: 'Active',
    spend: 8500,
    impressions: 142000,
    clicks: 4680,
    websiteVisits: 3950,
    newCustomers: 48,
    attributedRevenue: 38250,
    estimatedLtv: 2400,
  },
  {
    id: 'user-cmp-02',
    name: 'Search: "High Yield Business Checking"',
    channel: 'Paid Search',
    date: '2026-09-20',
    targetSegment: 'In-market FinTech CFOs',
    product: 'VeloYield Treasury',
    status: 'Active',
    spend: 7200,
    impressions: 89000,
    clicks: 2950,
    websiteVisits: 2600,
    newCustomers: 34,
    attributedRevenue: 23800,
    estimatedLtv: 2200,
  },
  {
    id: 'user-cmp-03',
    name: 'Founder Nurture Sequence #4',
    channel: 'Email Nurture',
    date: '2026-09-16',
    targetSegment: 'Waitlist & KYC Initiators',
    product: 'VeloYield Treasury',
    status: 'Active',
    spend: 1400,
    impressions: 12500,
    clicks: 1820,
    websiteVisits: 1650,
    newCustomers: 42,
    attributedRevenue: 15400,
    emailDelivered: 12500,
    emailOpens: 4250,
    estimatedLtv: 2500,
  },
  {
    id: 'user-cmp-04',
    name: 'Corporate Card SaaS Cashback Blitz',
    channel: 'Paid Social',
    date: '2026-09-12',
    targetSegment: 'Tech Agency Directors',
    product: 'VeloCard Corporate',
    status: 'Active',
    spend: 4800,
    impressions: 165000,
    clicks: 3100,
    websiteVisits: 2750,
    newCustomers: 26,
    attributedRevenue: 17200,
    estimatedLtv: 1600,
  },
  {
    id: 'user-cmp-05',
    name: 'SEO: 2026 Startup Runway Benchmark Report',
    channel: 'Content/SEO',
    date: '2026-09-08',
    targetSegment: 'Early Stage Controllers',
    product: 'VeloYield Treasury',
    status: 'Active',
    spend: 2100,
    impressions: 210000,
    clicks: 9400,
    websiteVisits: 8800,
    newCustomers: 52,
    attributedRevenue: 28600,
    estimatedLtv: 2300,
  },
  {
    id: 'user-cmp-06',
    name: 'VC Partner Fast-Track Referral',
    channel: 'Referral',
    date: '2026-09-04',
    targetSegment: 'Portfolio Companies',
    product: 'VeloYield Treasury',
    status: 'Active',
    spend: 3200,
    impressions: 18000,
    clicks: 1950,
    websiteVisits: 1800,
    newCustomers: 38,
    attributedRevenue: 24500,
    estimatedLtv: 2800,
  },
];

// LocalStorage helpers
export function loadUserCampaigns(): UserCampaign[] {
  try {
    const raw = localStorage.getItem(USER_CAMPAIGNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse user campaigns from localStorage:', err);
    return [];
  }
}

export function saveUserCampaigns(campaigns: UserCampaign[]): void {
  try {
    localStorage.setItem(USER_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (err) {
    console.warn('Failed to save user campaigns to localStorage:', err);
  }
}

export function loadDataSourcePreference(): 'user' | 'sample' {
  try {
    const pref = localStorage.getItem(USER_CAMPAIGNS_MODE_KEY);
    if (pref === 'sample' || pref === 'user') return pref;
  } catch {}
  return 'user';
}

export function saveDataSourcePreference(pref: 'user' | 'sample'): void {
  try {
    localStorage.setItem(USER_CAMPAIGNS_MODE_KEY, pref);
  } catch {}
}

// Convert UserCampaign to CampaignData for table and agent optimization
export function userCampaignToCampaignData(cmp: UserCampaign): CampaignData {
  const ctrVal = cmp.impressions > 0 ? (cmp.clicks / cmp.impressions) * 100 : null;
  const cacVal = cmp.newCustomers > 0 ? cmp.spend / cmp.newCustomers : null;
  const roasVal = cmp.spend > 0 ? cmp.attributedRevenue / cmp.spend : null;

  return {
    id: cmp.id,
    name: cmp.name,
    channel: cmp.channel,
    targetSegment: cmp.targetSegment || 'Target Audience',
    spend: cmp.spend,
    impressions: cmp.impressions,
    clicks: cmp.clicks,
    ctr: ctrVal !== null ? Number(ctrVal.toFixed(2)) : '—',
    conversions: cmp.newCustomers,
    cac: cacVal !== null ? Number(cacVal.toFixed(2)) : '—',
    roas: roasVal !== null ? Number(roasVal.toFixed(2)) : '—',
    status: cmp.status || 'Active',
    product: cmp.product || 'VeloYield Treasury',
    date: cmp.date,
    websiteVisits: cmp.websiteVisits,
    newCustomers: cmp.newCustomers,
    attributedRevenue: cmp.attributedRevenue,
    emailDelivered: cmp.emailDelivered,
    emailOpens: cmp.emailOpens,
    estimatedLtv: cmp.estimatedLtv,
  };
}

// Format numbers safely
export function formatMetricNumber(val: number | string | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || val === '—' || val === '' || isNaN(Number(val))) {
    return '—';
  }
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Filter campaigns by period selection
export function filterCampaignsByPeriod(campaigns: UserCampaign[], period: string): UserCampaign[] {
  if (period === 'all') return campaigns;

  const now = new Date();
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    'q3': 90,
    'ytd': 270,
  };

  const daysLimit = daysMap[period];
  if (!daysLimit) return campaigns;

  const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);

  // Return campaigns on or after cutoff, or all if no date is provided
  const filtered = campaigns.filter((c) => {
    if (!c.date) return true;
    const cDate = new Date(c.date);
    if (isNaN(cDate.getTime())) return true;
    return cDate >= cutoff;
  });

  // If filtering yielded 0 but campaigns exist, return all so the user isn't stuck with empty data for future/historical dates
  return filtered.length > 0 ? filtered : campaigns;
}

// Calculate DashboardMetrics from an array of UserCampaigns
export function calculateDashboardFromUserCampaigns(
  campaigns: UserCampaign[],
  period: string
): DashboardMetrics {
  const periodLabels: Record<string, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    'q3': 'Current Quarter',
    'ytd': 'Year to Date',
    'all': 'All Recorded Periods',
  };

  const periodLabel = periodLabels[period] || 'User Entered Data';

  // Empty state fallback metrics
  if (!campaigns || campaigns.length === 0) {
    return {
      period,
      periodLabel: `${periodLabel} (0 campaigns)`,
      traffic: {
        value: '—',
        unit: 'visits',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'No website visit data entered yet.',
        benchmarkContext: 'Enter website visits in a campaign to populate.',
      },
      ctr: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'Click-Through Rate = Clicks ÷ Impressions.',
        benchmarkContext: 'Requires impressions and clicks.',
      },
      conversionRate: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'Conversion Rate = New Customers ÷ Website Visits.',
        benchmarkContext: 'Requires website visits and new customers.',
      },
      cac: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'Customer Acquisition Cost = Ad Spend ÷ New Customers Acquired.',
        benchmarkContext: 'Requires ad spend and new customers.',
      },
      roas: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'ROAS = Attributed Revenue ÷ Ad Spend.',
        benchmarkContext: 'Requires attributed revenue and ad spend.',
      },
      emailOpenRate: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'Email Open Rate = Email Opens ÷ Email Delivered.',
        benchmarkContext: 'Optional for email channel campaigns.',
      },
      clv: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'Average Estimated Customer Lifetime Value.',
        benchmarkContext: 'Optional field per campaign.',
      },
      ltvCacRatio: {
        value: '—',
        change: 0,
        trend: 'neutral',
        isPositive: true,
        description: 'LTV:CAC Ratio = Estimated CLV ÷ CAC.',
        benchmarkContext: 'Requires CLV and CAC.',
      },
      timeSeries: [],
      channels: [],
      funnel: [
        { stage: '1. Impressions', count: 0, percentage: 0 },
        { stage: '2. Clicks', count: 0, percentage: 0 },
        { stage: '3. Website Visits', count: 0, percentage: 0 },
        { stage: '4. Customers Acquired', count: 0, percentage: 0 },
      ],
      campaigns: [],
    };
  }

  // Aggregate totals
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalVisits = 0;
  let totalNewCustomers = 0;
  let totalRevenue = 0;
  let totalEmailDelivered = 0;
  let totalEmailOpens = 0;
  let ltvSum = 0;
  let ltvCount = 0;

  campaigns.forEach((c) => {
    totalSpend += Number(c.spend) || 0;
    totalImpressions += Number(c.impressions) || 0;
    totalClicks += Number(c.clicks) || 0;
    totalVisits += Number(c.websiteVisits) || 0;
    totalNewCustomers += Number(c.newCustomers) || 0;
    totalRevenue += Number(c.attributedRevenue) || 0;
    if (c.emailDelivered) totalEmailDelivered += Number(c.emailDelivered) || 0;
    if (c.emailOpens) totalEmailOpens += Number(c.emailOpens) || 0;
    if (c.estimatedLtv && c.estimatedLtv > 0) {
      ltvSum += Number(c.estimatedLtv);
      ltvCount++;
    }
  });

  // Safe metric divisions
  const ctrValue = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
  const convValue = totalVisits > 0 ? (totalNewCustomers / totalVisits) * 100 : null;
  const cacValue = totalNewCustomers > 0 ? totalSpend / totalNewCustomers : null;
  const roasValue = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const emailRateValue = totalEmailDelivered > 0 ? (totalEmailOpens / totalEmailDelivered) * 100 : null;
  const avgLtvValue = ltvCount > 0 ? ltvSum / ltvCount : null;
  const ltvCacValue = (avgLtvValue !== null && cacValue !== null && cacValue > 0) 
    ? avgLtvValue / cacValue 
    : null;

  // Group by channel
  const channelMap: Record<string, {
    spend: number;
    clicks: number;
    impressions: number;
    visits: number;
    conversions: number;
    revenue: number;
  }> = {};

  campaigns.forEach((c) => {
    const ch = c.channel || 'Other';
    if (!channelMap[ch]) {
      channelMap[ch] = {
        spend: 0,
        clicks: 0,
        impressions: 0,
        visits: 0,
        conversions: 0,
        revenue: 0,
      };
    }
    channelMap[ch].spend += Number(c.spend) || 0;
    channelMap[ch].clicks += Number(c.clicks) || 0;
    channelMap[ch].impressions += Number(c.impressions) || 0;
    channelMap[ch].visits += Number(c.websiteVisits) || 0;
    channelMap[ch].conversions += Number(c.newCustomers) || 0;
    channelMap[ch].revenue += Number(c.attributedRevenue) || 0;
  });

  const channels: ChannelMetric[] = Object.keys(channelMap).map((chName) => {
    const d = channelMap[chName];
    const chCac = d.conversions > 0 ? d.spend / d.conversions : 0;
    const chRoas = d.spend > 0 ? d.revenue / d.spend : 0;
    const chCtr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;

    return {
      name: chName,
      spend: d.spend,
      clicks: d.clicks,
      conversions: d.conversions,
      cac: Number(chCac.toFixed(2)),
      roas: Number(chRoas.toFixed(2)),
      ctr: Number(chCtr.toFixed(2)),
      color: '#426A8C',
    };
  });

  // Group by date for TimeSeries
  const dateMap: Record<string, { traffic: number; conversions: number; spend: number }> = {};
  campaigns.forEach((c) => {
    const dStr = c.date ? c.date.slice(5) : 'Recent'; // e.g. "09-24"
    if (!dateMap[dStr]) {
      dateMap[dStr] = { traffic: 0, conversions: 0, spend: 0 };
    }
    dateMap[dStr].traffic += Number(c.websiteVisits) || 0;
    dateMap[dStr].conversions += Number(c.newCustomers) || 0;
    dateMap[dStr].spend += Number(c.spend) || 0;
  });

  const sortedDates = Object.keys(dateMap).sort();
  const timeSeries = sortedDates.map((dateKey) => ({
    date: dateKey,
    traffic: dateMap[dateKey].traffic,
    conversions: dateMap[dateKey].conversions,
    spend: dateMap[dateKey].spend,
  }));

  // If timeSeries has only 1 point, duplicate or pad so the SVG line chart renders cleanly
  if (timeSeries.length === 1) {
    timeSeries.unshift({
      date: 'Start',
      traffic: 0,
      conversions: 0,
      spend: 0,
    });
  }

  // Funnel calculations
  const funnel: FunnelStage[] = [
    {
      stage: '1. Ad Impressions',
      count: totalImpressions,
      percentage: 100,
    },
    {
      stage: '2. Clicks Generated',
      count: totalClicks,
      percentage: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0,
      dropOffRate: totalImpressions > 0 ? Number((100 - (totalClicks / totalImpressions) * 100).toFixed(1)) : 0,
    },
    {
      stage: '3. Website Visits',
      count: totalVisits,
      percentage: totalClicks > 0 ? Number(((totalVisits / totalClicks) * 100).toFixed(1)) : 0,
      dropOffRate: totalClicks > 0 && totalClicks > totalVisits ? Number((((totalClicks - totalVisits) / totalClicks) * 100).toFixed(1)) : 0,
    },
    {
      stage: '4. Customers Acquired',
      count: totalNewCustomers,
      percentage: totalVisits > 0 ? Number(((totalNewCustomers / totalVisits) * 100).toFixed(2)) : 0,
      dropOffRate: totalVisits > 0 ? Number((100 - (totalNewCustomers / totalVisits) * 100).toFixed(1)) : 0,
    },
  ];

  return {
    period,
    periodLabel: `${periodLabel} (${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'})`,
    traffic: {
      value: totalVisits > 0 ? totalVisits : '—',
      unit: 'visits',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Total website visits reported across entered campaigns.',
      benchmarkContext: 'Calculated directly from entered website visits.',
    },
    ctr: {
      value: ctrValue !== null ? Number(ctrValue.toFixed(2)) : '—',
      suffix: ctrValue !== null ? '%' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Blended CTR = Total Clicks ÷ Total Impressions.',
      benchmarkContext: 'Calculated directly from entered figures.',
    },
    conversionRate: {
      value: convValue !== null ? Number(convValue.toFixed(2)) : '—',
      suffix: convValue !== null ? '%' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Conversion Rate = New Customers ÷ Website Visits.',
      benchmarkContext: 'Calculated directly from entered figures.',
    },
    cac: {
      value: cacValue !== null ? Number(cacValue.toFixed(2)) : '—',
      prefix: cacValue !== null ? '$' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Customer Acquisition Cost = Ad Spend ÷ New Customers Acquired.',
      benchmarkContext: 'Calculated directly from entered figures.',
    },
    roas: {
      value: roasValue !== null ? Number(roasValue.toFixed(2)) : '—',
      suffix: roasValue !== null ? 'x' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Return on Ad Spend = Attributed Revenue ÷ Ad Spend.',
      benchmarkContext: 'Calculated directly from entered figures.',
    },
    emailOpenRate: {
      value: emailRateValue !== null ? Number(emailRateValue.toFixed(2)) : '—',
      suffix: emailRateValue !== null ? '%' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Email Open Rate = Email Opens ÷ Email Delivered.',
      benchmarkContext: totalEmailDelivered > 0 ? 'Calculated from email campaigns.' : 'No email campaigns with delivery data.',
    },
    clv: {
      value: avgLtvValue !== null ? Number(avgLtvValue.toFixed(0)) : '—',
      prefix: avgLtvValue !== null ? '$' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'Average Estimated Customer Lifetime Value across campaigns.',
      benchmarkContext: ltvCount > 0 ? `Based on ${ltvCount} campaigns reporting LTV.` : 'No LTV estimates entered.',
    },
    ltvCacRatio: {
      value: ltvCacValue !== null ? Number(ltvCacValue.toFixed(2)) : '—',
      suffix: ltvCacValue !== null ? 'x' : '',
      change: 0,
      trend: 'neutral',
      isPositive: true,
      description: 'LTV:CAC Ratio = Estimated CLV ÷ CAC.',
      benchmarkContext: ltvCacValue !== null ? (ltvCacValue >= 3 ? 'Healthy unit economics (≥ 3.0x)' : 'Sub-optimal unit economics (< 3.0x)') : 'Requires both LTV and CAC.',
    },
    timeSeries,
    channels,
    funnel,
    campaigns: campaigns.map(userCampaignToCampaignData),
  };
}

// CSV Export Helper
export function exportCampaignsToCSV(campaigns: UserCampaign[]): string {
  const headers = [
    'Campaign Name',
    'Channel',
    'Reporting Date',
    'Ad Spend',
    'Impressions',
    'Clicks',
    'Website Visits',
    'New Customers',
    'Attributed Revenue',
    'Email Delivered',
    'Email Opens',
    'Estimated LTV',
    'Target Audience',
    'Product',
    'Status',
  ];

  const rows = campaigns.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.channel || '').replace(/"/g, '""')}"`,
    `"${c.date || ''}"`,
    c.spend ?? 0,
    c.impressions ?? 0,
    c.clicks ?? 0,
    c.websiteVisits ?? 0,
    c.newCustomers ?? 0,
    c.attributedRevenue ?? 0,
    c.emailDelivered ?? '',
    c.emailOpens ?? '',
    c.estimatedLtv ?? '',
    `"${(c.targetSegment || '').replace(/"/g, '""')}"`,
    `"${(c.product || '').replace(/"/g, '""')}"`,
    `"${c.status || 'Active'}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// CSV Sample Template
export const CSV_TEMPLATE_CONTENT = `Campaign Name,Channel,Reporting Date,Ad Spend,Impressions,Clicks,Website Visits,New Customers,Attributed Revenue,Email Delivered,Email Opens,Estimated LTV,Target Audience,Product,Status
"Q3 Treasury Growth Push","LinkedIn B2B","2026-09-24",8500,142000,4680,3950,48,38250,,,2400,"FinTech Founders","VeloYield Treasury","Active"
"High-Yield Search Ads","Paid Search","2026-09-20",7200,89000,2950,2600,34,23800,,,2200,"In-market CFOs","VeloYield Treasury","Active"
"Founder Onboarding Sequence","Email Nurture","2026-09-16",1400,12500,1820,1650,42,15400,12500,4250,2500,"Waitlist Initiators","VeloYield Treasury","Active"`;

// CSV Parser Helper
export function parseCampaignsFromCSV(csvText: string): { campaigns: UserCampaign[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    errors.push('The CSV file does not contain any data rows.');
    return { campaigns: [], errors };
  }

  // Parse header
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findColIndex = (aliases: string[]) => {
    return header.findIndex((h) => aliases.some((a) => h.includes(a)));
  };

  const nameIdx = findColIndex(['campaignname', 'name', 'campaign']);
  const channelIdx = findColIndex(['channel']);
  const dateIdx = findColIndex(['reportingdate', 'date', 'period']);
  const spendIdx = findColIndex(['adspend', 'spend', 'cost']);
  const impIdx = findColIndex(['impressions', 'impr']);
  const clicksIdx = findColIndex(['clicks', 'click']);
  const visitsIdx = findColIndex(['websitevisits', 'visits', 'traffic']);
  const customersIdx = findColIndex(['newcustomers', 'customers', 'conversions', 'acquired']);
  const revenueIdx = findColIndex(['attributedrevenue', 'revenue', 'rev']);
  const emailDeliveredIdx = findColIndex(['emaildelivered', 'delivered', 'sends']);
  const emailOpensIdx = findColIndex(['emailopens', 'opens']);
  const ltvIdx = findColIndex(['estimatedltv', 'ltv', 'clv']);
  const audienceIdx = findColIndex(['targetaudience', 'targetsegment', 'audience', 'segment']);
  const productIdx = findColIndex(['product']);
  const statusIdx = findColIndex(['status']);

  if (nameIdx === -1) {
    errors.push('Missing required column "Campaign Name" in CSV header.');
    return { campaigns: [], errors };
  }

  const campaigns: UserCampaign[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;
    const cols = parseCSVLine(rawLine);
    const rowNum = i + 1;

    const name = cols[nameIdx] || `Campaign #${i}`;
    const channel = channelIdx !== -1 && cols[channelIdx] ? cols[channelIdx] : 'Paid Search';
    const date = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString().slice(0, 10);
    
    // Numeric parsing and validation
    const parseNonNegative = (valStr: string | undefined, defaultVal = 0): number => {
      if (!valStr || valStr.trim() === '') return defaultVal;
      const clean = valStr.replace(/[$,]/g, '').trim();
      const num = Number(clean);
      if (isNaN(num) || num < 0) {
        errors.push(`Row ${rowNum} ("${name}"): Value "${valStr}" is not a valid non-negative number.`);
        return 0;
      }
      return num;
    };

    const spend = spendIdx !== -1 ? parseNonNegative(cols[spendIdx], 0) : 0;
    const impressions = impIdx !== -1 ? parseNonNegative(cols[impIdx], 0) : 0;
    const clicks = clicksIdx !== -1 ? parseNonNegative(cols[clicksIdx], 0) : 0;
    const websiteVisits = visitsIdx !== -1 ? parseNonNegative(cols[visitsIdx], 0) : 0;
    const newCustomers = customersIdx !== -1 ? parseNonNegative(cols[customersIdx], 0) : 0;
    const attributedRevenue = revenueIdx !== -1 ? parseNonNegative(cols[revenueIdx], 0) : 0;
    
    const emailDelivered = emailDeliveredIdx !== -1 && cols[emailDeliveredIdx] ? parseNonNegative(cols[emailDeliveredIdx], 0) : undefined;
    const emailOpens = emailOpensIdx !== -1 && cols[emailOpensIdx] ? parseNonNegative(cols[emailOpensIdx], 0) : undefined;
    const estimatedLtv = ltvIdx !== -1 && cols[ltvIdx] ? parseNonNegative(cols[ltvIdx], 0) : undefined;

    const targetSegment = audienceIdx !== -1 && cols[audienceIdx] ? cols[audienceIdx] : 'General Audience';
    const product = productIdx !== -1 && cols[productIdx] ? cols[productIdx] : 'VeloYield Treasury';
    const statusRaw = statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'Active';
    const status = (['Active', 'Paused', 'Optimizing'].includes(statusRaw) ? statusRaw : 'Active') as 'Active' | 'Paused' | 'Optimizing';

    campaigns.push({
      id: `user-cmp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      channel,
      date,
      spend,
      impressions,
      clicks,
      websiteVisits,
      newCustomers,
      attributedRevenue,
      emailDelivered,
      emailOpens,
      estimatedLtv,
      targetSegment,
      product,
      status,
      createdAt: new Date().toISOString(),
    });
  }

  return { campaigns, errors };
}
