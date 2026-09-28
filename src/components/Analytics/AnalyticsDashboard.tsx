import React, { useState } from 'react';
import { 
  Search
} from 'lucide-react';
import { TimeRange, DashboardMetrics, CampaignData } from '../../types';
import { MOCK_ANALYTICS_DATA } from '../../data/mockAnalytics';
import { AnalyticsAdvisor } from './AnalyticsAdvisor';

interface AnalyticsDashboardProps {
  onOptimizeCampaignInAgent?: (campaign: CampaignData) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  onOptimizeCampaignInAgent 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeChartMetric, setActiveChartMetric] = useState<'traffic' | 'conversions' | 'spend'>('traffic');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  const metrics: DashboardMetrics = MOCK_ANALYTICS_DATA[selectedPeriod];

  // Filter campaigns
  const filteredCampaigns = metrics.campaigns.filter((cmp) => {
    const matchesSearch = cmp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.targetSegment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'All' || cmp.channel === channelFilter;
    const matchesStatus = statusFilter === 'All' || cmp.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  // Calculate SVG Chart coordinates
  const chartPoints = metrics.timeSeries;
  const maxTraffic = Math.max(...chartPoints.map((p) => p.traffic)) * 1.15;
  const maxConversions = Math.max(...chartPoints.map((p) => p.conversions)) * 1.15;
  const maxSpend = Math.max(...chartPoints.map((p) => p.spend)) * 1.15;

  const chartWidth = 720;
  const chartHeight = 200;

  const getSvgY = (val: number, max: number) => {
    return chartHeight - (val / max) * (chartHeight - 40) - 20;
  };

  const getSvgX = (index: number) => {
    const step = chartWidth / (chartPoints.length - 1);
    return index * step;
  };

  const currentMetricMax = activeChartMetric === 'traffic' ? maxTraffic : activeChartMetric === 'conversions' ? maxConversions : maxSpend;
  const currentMetricVal = (p: typeof chartPoints[0]) => activeChartMetric === 'traffic' ? p.traffic : activeChartMetric === 'conversions' ? p.conversions : p.spend;

  const pathD = chartPoints.reduce((acc, point, i) => {
    const x = getSvgX(i);
    const y = getSvgY(currentMetricVal(point), currentMetricMax);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-[#202938]">Marketing Analytics</h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Overview of traffic, acquisition costs, and channel performance.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#EAF0F5] p-1 rounded-md border border-[#D8E2EA] self-start sm:self-auto">
          {(['7d', '30d', 'q3', 'ytd'] as TimeRange[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                  : 'text-[#667085] hover:text-[#202938]'
              }`}
            >
              {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === 'q3' ? 'Quarter' : 'Year to Date'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Website Traffic */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Website Traffic</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            {Number(metrics.traffic.value).toLocaleString()}
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">+{metrics.traffic.change}%</span> vs prior period
          </div>
        </div>

        {/* Metric 2: Click-Through Rate */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Click-Through Rate (CTR)</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            {metrics.ctr.value}%
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">+{metrics.ctr.change}%</span> pts
          </div>
        </div>

        {/* Metric 3: Conversion Rate */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Conversion Rate</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            {metrics.conversionRate.value}%
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">+{metrics.conversionRate.change}%</span> pts
          </div>
        </div>

        {/* Metric 4: Customer Acquisition Cost */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Acquisition Cost (CAC)</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            ${Number(metrics.cac.value).toFixed(2)}
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">{metrics.cac.change}%</span> change
          </div>
        </div>

        {/* Metric 5: Return on Ad Spend */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Return on Ad Spend (ROAS)</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            {metrics.roas.value}x
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">+{metrics.roas.change}%</span>
          </div>
        </div>

        {/* Metric 6: Email Open Rate */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Email Open Rate</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            {metrics.emailOpenRate.value}%
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">+{metrics.emailOpenRate.change}%</span> pts
          </div>
        </div>

        {/* Metric 7: Customer Lifetime Value */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">Customer Lifetime Value</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            ${Number(metrics.clv.value).toLocaleString()}
          </div>
          <div className="text-xs text-[#667085] mt-1">
            <span className="text-[#202938] font-semibold">+{metrics.clv.change}%</span>
          </div>
        </div>

        {/* Metric 8: LTV:CAC Ratio */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
          <div className="text-xs text-[#667085] font-medium">LTV:CAC Ratio</div>
          <div className="text-xl font-bold text-[#202938] mt-1">
            {metrics.ltvCacRatio.value}x
          </div>
          <div className="text-xs text-[#667085] mt-1">
            Healthy unit economics
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#202938]">Performance Over Time</h3>
              <p className="text-xs text-[#667085]">{metrics.periodLabel}</p>
            </div>

            <div className="flex items-center gap-1 bg-[#EAF0F5] p-0.5 rounded-md border border-[#D8E2EA] self-start sm:self-auto">
              <button
                onClick={() => setActiveChartMetric('traffic')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                  activeChartMetric === 'traffic'
                    ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                    : 'text-[#667085] hover:text-[#202938]'
                }`}
              >
                Traffic
              </button>
              <button
                onClick={() => setActiveChartMetric('conversions')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                  activeChartMetric === 'conversions'
                    ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                    : 'text-[#667085] hover:text-[#202938]'
                }`}
              >
                Conversions
              </button>
              <button
                onClick={() => setActiveChartMetric('spend')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                  activeChartMetric === 'spend'
                    ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                    : 'text-[#667085] hover:text-[#202938]'
                }`}
              >
                Spend
              </button>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full h-[220px] bg-[#F8FAFC] rounded-md border border-[#D8E2EA] p-3 flex flex-col justify-end">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-[170px] overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartNavyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#426A8C" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#426A8C" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#E2E8F0" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#E2E8F0" strokeDasharray="3 3" />

              {/* Area Fill */}
              <path d={areaD} fill="url(#chartNavyGrad)" />

              {/* Line */}
              <path d={pathD} fill="none" stroke="#426A8C" strokeWidth="2.5" strokeLinecap="round" />

              {/* Points */}
              {chartPoints.map((point, index) => {
                const x = getSvgX(index);
                const y = getSvgY(currentMetricVal(point), currentMetricMax);
                const isHovered = hoveredDataPoint === index;

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#426A8C"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredDataPoint(index)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[11px] text-[#667085] mt-2 px-1">
              {chartPoints.map((point, index) => (
                <span key={index}>{point.date}</span>
              ))}
            </div>

            {/* Hover Tooltip */}
            {hoveredDataPoint !== null && (
              <div className="absolute top-3 left-4 bg-white border border-[#D8E2EA] rounded-md px-3 py-1.5 text-xs text-[#202938] shadow-md pointer-events-none">
                <span className="font-semibold text-[#426A8C]">{chartPoints[hoveredDataPoint].date}: </span>
                <span>
                  {activeChartMetric === 'traffic'
                    ? `${chartPoints[hoveredDataPoint].traffic.toLocaleString()} visitors`
                    : activeChartMetric === 'conversions'
                    ? `${chartPoints[hoveredDataPoint].conversions} accounts`
                    : `$${chartPoints[hoveredDataPoint].spend.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Channel Breakdown (1 column) */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#202938] mb-0.5">Channel Performance</h3>
            <p className="text-xs text-[#667085] mb-4">ROAS and acquisition cost by channel</p>

            <div className="space-y-3.5">
              {metrics.channels.map((chan, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#202938]">{chan.name}</span>
                    <span className="text-[#667085] font-medium">{chan.roas}x ROAS · ${chan.cac.toFixed(0)} CAC</span>
                  </div>
                  {/* Subtle bar in muted navy */}
                  <div className="w-full bg-[#EAF0F5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#426A8C] rounded-full"
                      style={{ width: `${Math.min(100, (chan.roas / 7.5) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8E2EA] text-xs text-[#667085] flex justify-between">
            <span>Highest efficiency:</span>
            <span className="font-semibold text-[#426A8C]">Organic SEO &amp; Content (7.2x)</span>
          </div>
        </div>
      </div>

      {/* Funnel Breakdown */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-[#202938]">Conversion Funnel</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {metrics.funnel.map((step, idx) => (
            <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#D8E2EA] rounded-md">
              <div className="text-[11px] text-[#667085] truncate font-medium">{step.stage}</div>
              <div className="text-base font-bold text-[#202938] mt-1">
                {step.count.toLocaleString()}
              </div>
              <div className="text-xs text-[#426A8C] font-semibold mt-0.5">
                {step.percentage}% conversion
              </div>
              {step.dropOffRate !== undefined && (
                <div className="text-[10px] text-[#667085] mt-1">
                  -{step.dropOffRate}% drop-off
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Analytics Assistant */}
      <AnalyticsAdvisor metrics={metrics} />

      {/* Campaign Table */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D8E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#202938]">Campaigns</h3>
            <p className="text-xs text-[#667085]">
              Showing {filteredCampaigns.length} campaigns for {metrics.periodLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#667085] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="bg-[#F8FAFC] border border-[#D8E2EA] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#202938] placeholder-[#667085] focus:outline-none focus:ring-1 focus:ring-[#426A8C] w-44 sm:w-56"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
            >
              <option value="All">All Channels</option>
              <option value="Paid Search">Paid Search</option>
              <option value="LinkedIn B2B">LinkedIn B2B</option>
              <option value="Paid Social">Paid Social</option>
              <option value="Email Nurture">Email Nurture</option>
              <option value="Content/SEO">Content/SEO</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#202938]">
            <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#D8E2EA]">
              <tr>
                <th className="px-4 py-3">Campaign Name</th>
                <th className="px-3 py-3">Channel</th>
                <th className="px-3 py-3">Target Audience</th>
                <th className="px-3 py-3 text-right">Spend</th>
                <th className="px-3 py-3 text-right">CTR</th>
                <th className="px-3 py-3 text-right">Conversions</th>
                <th className="px-3 py-3 text-right">CAC</th>
                <th className="px-3 py-3 text-right">ROAS</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E2EA]/60 bg-white">
              {filteredCampaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#F8FAFC]/80 transition">
                  <td className="px-4 py-3 font-medium text-[#202938]">
                    <div>{camp.name}</div>
                    <div className="text-[11px] text-[#667085] font-normal">{camp.product}</div>
                  </td>
                  <td className="px-3 py-3 text-[#202938]">
                    {camp.channel}
                  </td>
                  <td className="px-3 py-3 text-[#667085]">
                    {camp.targetSegment}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-[#202938]">
                    ${camp.spend.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right text-[#202938]">
                    {camp.ctr.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3 text-right text-[#202938]">
                    {camp.conversions}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-[#202938]">
                    ${camp.cac.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-[#426A8C]">
                    {camp.roas.toFixed(2)}x
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOptimizeCampaignInAgent && onOptimizeCampaignInAgent(camp)}
                      className="px-2.5 py-1 rounded bg-[#EAF0F5] hover:bg-[#DFE9F2] text-[#426A8C] border border-[#D8E2EA] text-xs font-semibold transition"
                    >
                      Optimize Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
