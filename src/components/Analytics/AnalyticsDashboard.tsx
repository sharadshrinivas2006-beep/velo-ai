import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  HelpCircle, 
  Edit2, 
  Trash2, 
  Sparkles,
  Database,
  Layers,
  RotateCcw,
  Check
} from 'lucide-react';
import { TimeRange, DashboardMetrics, CampaignData, UserCampaign } from '../../types';
import { MOCK_ANALYTICS_DATA } from '../../data/mockAnalytics';
import { AnalyticsAdvisor } from './AnalyticsAdvisor';
import { CampaignModal } from './CampaignModal';
import { CsvImportExportModal } from './CsvImportExportModal';
import { MetricFormulasModal } from './MetricFormulasModal';
import { 
  loadUserCampaigns, 
  saveUserCampaigns, 
  loadDataSourcePreference,
  saveDataSourcePreference,
  calculateDashboardFromUserCampaigns,
  filterCampaignsByPeriod,
  SAMPLE_STARTER_CAMPAIGNS,
  formatMetricNumber
} from '../../utils/analyticsCalculations';

interface AnalyticsDashboardProps {
  onOptimizeCampaignInAgent?: (campaign: CampaignData) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  onOptimizeCampaignInAgent 
}) => {
  // Data Source mode: 'user' (user-entered campaigns) or 'sample' (mock baseline)
  const [dataSource, setDataSource] = useState<'user' | 'sample'>('user');
  const [userCampaigns, setUserCampaigns] = useState<UserCampaign[]>([]);
  
  // Reporting period
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  
  // Table search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Chart metric
  const [activeChartMetric, setActiveChartMetric] = useState<'traffic' | 'conversions' | 'spend'>('traffic');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<UserCampaign | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isFormulasModalOpen, setIsFormulasModalOpen] = useState(false);
  
  // Notification toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Load user campaigns and preference on mount
  useEffect(() => {
    const saved = loadUserCampaigns();
    const pref = loadDataSourcePreference();
    if (saved.length > 0) {
      setUserCampaigns(saved);
      setDataSource(pref);
    } else {
      // If no user campaigns exist yet, start in user mode with starter option
      setUserCampaigns([]);
      setDataSource('user');
    }
  }, []);

  // Save changes to localStorage
  const handleSaveCampaign = (campaign: UserCampaign) => {
    let updated: UserCampaign[];
    const exists = userCampaigns.some((c) => c.id === campaign.id);
    if (exists) {
      updated = userCampaigns.map((c) => (c.id === campaign.id ? campaign : c));
      showNotice(`Updated campaign "${campaign.name}"`);
    } else {
      updated = [campaign, ...userCampaigns];
      showNotice(`Added campaign "${campaign.name}"`);
    }
    setUserCampaigns(updated);
    saveUserCampaigns(updated);
    setDataSource('user');
    saveDataSourcePreference('user');
  };

  const handleDeleteCampaign = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      const updated = userCampaigns.filter((c) => c.id !== id);
      setUserCampaigns(updated);
      saveUserCampaigns(updated);
      showNotice(`Deleted campaign "${name}"`);
    }
  };

  const handleImportCsv = (newCampaigns: UserCampaign[], mode: 'append' | 'replace') => {
    const updated = mode === 'replace' ? newCampaigns : [...newCampaigns, ...userCampaigns];
    setUserCampaigns(updated);
    saveUserCampaigns(updated);
    setDataSource('user');
    saveDataSourcePreference('user');
    showNotice(`Successfully imported ${newCampaigns.length} campaigns`);
  };

  const handleLoadStarterData = () => {
    setUserCampaigns(SAMPLE_STARTER_CAMPAIGNS);
    saveUserCampaigns(SAMPLE_STARTER_CAMPAIGNS);
    setDataSource('user');
    saveDataSourcePreference('user');
    showNotice(`Loaded ${SAMPLE_STARTER_CAMPAIGNS.length} sample starter campaigns into user data`);
  };

  const handleSwitchDataSource = (source: 'user' | 'sample') => {
    setDataSource(source);
    saveDataSourcePreference(source);
    showNotice(source === 'user' ? 'Switched to User-Entered Data' : 'Switched to Benchmark Sample Data');
  };

  // Derive metrics based on active data source and period filter
  const metrics: DashboardMetrics = useMemo(() => {
    if (dataSource === 'sample') {
      const validPeriod = (['7d', '30d', 'q3', 'ytd'].includes(selectedPeriod) ? selectedPeriod : '30d') as TimeRange;
      return MOCK_ANALYTICS_DATA[validPeriod];
    } else {
      const filtered = filterCampaignsByPeriod(userCampaigns, selectedPeriod);
      return calculateDashboardFromUserCampaigns(filtered, selectedPeriod);
    }
  }, [dataSource, selectedPeriod, userCampaigns]);

  // Filter campaigns for the table
  const filteredCampaigns = useMemo(() => {
    return metrics.campaigns.filter((cmp) => {
      const matchesSearch = cmp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.targetSegment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = channelFilter === 'All' || cmp.channel.toLowerCase() === channelFilter.toLowerCase();
      const matchesStatus = statusFilter === 'All' || cmp.status === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [metrics.campaigns, searchQuery, channelFilter, statusFilter]);

  // Chart coordinates calculation
  const chartPoints = metrics.timeSeries;
  const maxTraffic = Math.max(...chartPoints.map((p) => p.traffic), 10) * 1.15;
  const maxConversions = Math.max(...chartPoints.map((p) => p.conversions), 5) * 1.15;
  const maxSpend = Math.max(...chartPoints.map((p) => p.spend), 100) * 1.15;

  const chartWidth = 720;
  const chartHeight = 200;

  const getSvgY = (val: number, max: number) => {
    return chartHeight - (val / (max || 1)) * (chartHeight - 40) - 20;
  };

  const getSvgX = (index: number) => {
    if (chartPoints.length <= 1) return chartWidth / 2;
    const step = chartWidth / (chartPoints.length - 1);
    return index * step;
  };

  const currentMetricMax = activeChartMetric === 'traffic' ? maxTraffic : activeChartMetric === 'conversions' ? maxConversions : maxSpend;
  const currentMetricVal = (p: typeof chartPoints[0]) => activeChartMetric === 'traffic' ? p.traffic : activeChartMetric === 'conversions' ? p.conversions : p.spend;

  const pathD = chartPoints.length > 0 ? chartPoints.reduce((acc, point, i) => {
    const x = getSvgX(i);
    const y = getSvgY(currentMetricVal(point), currentMetricMax);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '') : `M 0 ${chartHeight} L ${chartWidth} ${chartHeight}`;

  const areaD = chartPoints.length > 0 ? `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-5 z-50 bg-[#202938] text-white px-3.5 py-2 rounded-md shadow-lg text-xs font-medium flex items-center gap-2 border border-[#426A8C] animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D8E2EA]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-[#202938]">Marketing Analytics</h1>
            {dataSource === 'user' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Database className="w-3 h-3 text-emerald-600" />
                User-Entered Data ({userCampaigns.length} total)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#EAF0F5] text-[#426A8C] border border-[#D8E2EA]">
                <Layers className="w-3 h-3 text-[#426A8C]" />
                Sample Benchmark Data
              </span>
            )}
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            {dataSource === 'user'
              ? 'Dashboard automatically updates from your entered campaign figures and metrics.'
              : 'Viewing pre-populated benchmark figures for demo testing. Switch to your data anytime.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Add Campaign Button */}
          <button
            onClick={() => {
              setCampaignToEdit(null);
              setIsCampaignModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Campaign</span>
          </button>

          {/* Import / Export CSV */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#202938] bg-white hover:bg-[#F8FAFC] border border-[#D8E2EA] rounded-md transition shadow-2xs"
            title="Import or Export CSV"
          >
            <Upload className="w-3.5 h-3.5 text-[#667085]" />
            <span>CSV Import/Export</span>
          </button>

          {/* Metric Formulas Guide */}
          <button
            onClick={() => setIsFormulasModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-[#667085] hover:text-[#202938] bg-white hover:bg-[#F8FAFC] border border-[#D8E2EA] rounded-md transition shadow-2xs"
            title="View Metric Calculation Formulas"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formulas</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Data Source Switch & Period Filters */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Data Source Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#667085]">Data Source:</span>
          <div className="inline-flex rounded-md border border-[#D8E2EA] p-0.5 bg-[#F8FAFC]">
            <button
              onClick={() => handleSwitchDataSource('user')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                dataSource === 'user'
                  ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                  : 'text-[#667085] hover:text-[#202938]'
              }`}
            >
              My Entered Data ({userCampaigns.length})
            </button>
            <button
              onClick={() => handleSwitchDataSource('sample')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                dataSource === 'sample'
                  ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                  : 'text-[#667085] hover:text-[#202938]'
              }`}
            >
              Sample Benchmarks
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#667085]">Window:</span>
          <div className="inline-flex rounded-md border border-[#D8E2EA] p-0.5 bg-[#F8FAFC]">
            {(['7d', '30d', 'q3', 'ytd', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  selectedPeriod === period
                    ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                    : 'text-[#667085] hover:text-[#202938]'
                }`}
              >
                {period === '7d' ? '7D' : period === '30d' ? '30D' : period === 'q3' ? 'Q3' : period === 'ytd' ? 'YTD' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State for User-Entered Data */}
      {dataSource === 'user' && userCampaigns.length === 0 && (
        <div className="bg-white border-2 border-dashed border-[#D8E2EA] rounded-xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EAF0F5] text-[#426A8C] flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[#202938]">
              No user-entered campaigns yet
            </h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Enter your campaign figures manually, import a CSV spreadsheet, or load starter sample data to see the live metrics, ratios, and charts recalculate.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCampaignToEdit(null);
                setIsCampaignModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Campaign</span>
            </button>

            <button
              onClick={handleLoadStarterData}
              className="px-4 py-2 text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md transition flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#426A8C]" />
              <span>Load Starter Dataset</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-[#667085] hover:text-[#202938] bg-white border border-[#D8E2EA] hover:bg-[#F8FAFC] rounded-md transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          </div>

          <div className="pt-2 text-[11px] text-[#667085]">
            💾 Figures are stored safely in local browser storage. No account credentials or PII required.
          </div>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Website Traffic */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Website Visits</span>
              <span className="text-[10px] text-[#667085]">Traffic</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {typeof metrics.traffic.value === 'number' ? metrics.traffic.value.toLocaleString() : metrics.traffic.value}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.traffic.description}>
            {metrics.traffic.description}
          </div>
        </div>

        {/* Metric 2: Click-Through Rate */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Click-Through Rate</span>
              <span className="text-[10px] text-[#667085]">Clicks ÷ Imp</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {metrics.ctr.value}{metrics.ctr.value !== '—' && '%'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.ctr.description}>
            {metrics.ctr.description}
          </div>
        </div>

        {/* Metric 3: Conversion Rate */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Conversion Rate</span>
              <span className="text-[10px] text-[#667085]">Cust ÷ Visits</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {metrics.conversionRate.value}{metrics.conversionRate.value !== '—' && '%'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.conversionRate.description}>
            {metrics.conversionRate.description}
          </div>
        </div>

        {/* Metric 4: Customer Acquisition Cost */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Acquisition Cost (CAC)</span>
              <span className="text-[10px] text-[#667085]">Spend ÷ Cust</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {metrics.cac.value !== '—' ? `$${formatMetricNumber(metrics.cac.value, 2)}` : '—'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.cac.description}>
            {metrics.cac.description}
          </div>
        </div>

        {/* Metric 5: Return on Ad Spend */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Return on Ad Spend</span>
              <span className="text-[10px] text-[#667085]">Rev ÷ Spend</span>
            </div>
            <div className="text-xl font-bold text-[#426A8C] mt-1">
              {metrics.roas.value !== '—' ? `${formatMetricNumber(metrics.roas.value, 2)}x` : '—'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.roas.description}>
            {metrics.roas.description}
          </div>
        </div>

        {/* Metric 6: Email Open Rate */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Email Open Rate</span>
              <span className="text-[10px] text-[#667085]">Opens ÷ Sends</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {metrics.emailOpenRate.value !== '—' ? `${formatMetricNumber(metrics.emailOpenRate.value, 2)}%` : '—'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.emailOpenRate.description}>
            {metrics.emailOpenRate.description}
          </div>
        </div>

        {/* Metric 7: Customer Lifetime Value */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>Estimated CLV</span>
              <span className="text-[10px] text-[#667085]">Per Account</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {metrics.clv.value !== '—' ? `$${Number(metrics.clv.value).toLocaleString()}` : '—'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.clv.description}>
            {metrics.clv.description}
          </div>
        </div>

        {/* Metric 8: LTV:CAC Ratio */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#667085] font-medium flex items-center justify-between">
              <span>LTV:CAC Ratio</span>
              <span className="text-[10px] text-[#667085]">CLV ÷ CAC</span>
            </div>
            <div className="text-xl font-bold text-[#202938] mt-1">
              {metrics.ltvCacRatio.value !== '—' ? `${formatMetricNumber(metrics.ltvCacRatio.value, 2)}x` : '—'}
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2 pt-1 border-t border-[#D8E2EA]/50 truncate" title={metrics.ltvCacRatio.description}>
            {metrics.ltvCacRatio.description}
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
              <p className="text-xs text-[#667085]">
                {metrics.periodLabel} · Visualized by campaign date
              </p>
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
                Visits
              </button>
              <button
                onClick={() => setActiveChartMetric('conversions')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                  activeChartMetric === 'conversions'
                    ? 'bg-white text-[#426A8C] font-semibold shadow-xs'
                    : 'text-[#667085] hover:text-[#202938]'
                }`}
              >
                Customers
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
            {chartPoints.length > 0 ? (
              <>
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
                {hoveredDataPoint !== null && chartPoints[hoveredDataPoint] && (
                  <div className="absolute top-3 left-4 bg-white border border-[#D8E2EA] rounded-md px-3 py-1.5 text-xs text-[#202938] shadow-md pointer-events-none">
                    <span className="font-semibold text-[#426A8C]">{chartPoints[hoveredDataPoint].date}: </span>
                    <span>
                      {activeChartMetric === 'traffic'
                        ? `${chartPoints[hoveredDataPoint].traffic.toLocaleString()} visits`
                        : activeChartMetric === 'conversions'
                        ? `${chartPoints[hoveredDataPoint].conversions} customers`
                        : `$${chartPoints[hoveredDataPoint].spend.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#667085]">
                No time-series data available. Add campaigns with reporting dates to visualize trend curves.
              </div>
            )}
          </div>
        </div>

        {/* Channel Breakdown (1 column) */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#202938] mb-0.5">Channel Performance</h3>
            <p className="text-xs text-[#667085] mb-4">
              {metrics.channels.length} channel{metrics.channels.length === 1 ? '' : 's'} recorded
            </p>

            <div className="space-y-3.5">
              {metrics.channels.length > 0 ? (
                metrics.channels.map((chan, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#202938] truncate pr-2">{chan.name}</span>
                      <span className="text-[#667085] font-medium shrink-0">
                        {chan.roas}x ROAS · ${chan.cac.toFixed(0)} CAC
                      </span>
                    </div>
                    {/* Progress bar in muted navy */}
                    <div className="w-full bg-[#EAF0F5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#426A8C] rounded-full"
                        style={{ width: `${Math.min(100, Math.max(8, (chan.roas / 7) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#667085]">
                  No channel records available.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8E2EA] text-xs text-[#667085] flex justify-between">
            <span>Data Mode:</span>
            <span className="font-semibold text-[#426A8C]">
              {dataSource === 'user' ? 'Calculated from User Data' : 'Benchmark Prototype'}
            </span>
          </div>
        </div>
      </div>

      {/* Funnel Breakdown */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#202938]">Acquisition Conversion Funnel</h3>
          <span className="text-xs text-[#667085]">Calculated from entered impressions, clicks, visits &amp; customers</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.funnel.map((step, idx) => (
            <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#D8E2EA] rounded-md">
              <div className="text-[11px] text-[#667085] truncate font-medium">{step.stage}</div>
              <div className="text-base font-bold text-[#202938] mt-1">
                {step.count.toLocaleString()}
              </div>
              <div className="text-xs text-[#426A8C] font-semibold mt-0.5">
                {step.percentage}% step rate
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
      <AnalyticsAdvisor 
        metrics={metrics} 
        isSampleData={dataSource === 'sample'}
        userCampaignCount={userCampaigns.length}
      />

      {/* Campaign Data Table */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D8E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#202938]">
                {dataSource === 'user' ? 'User-Entered Campaigns' : 'Sample Benchmark Campaigns'}
              </h3>
              <span className="text-xs text-[#667085] font-normal">
                ({filteredCampaigns.length} of {metrics.campaigns.length})
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              {dataSource === 'user' 
                ? 'Manage and edit your entered campaigns. Changes reflect instantly across metrics and charts.'
                : 'Benchmark prototype campaigns. Switch to "My Entered Data" to add or edit custom figures.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#667085] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="bg-[#F8FAFC] border border-[#D8E2EA] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#202938] placeholder-[#667085] focus:outline-none focus:ring-1 focus:ring-[#426A8C] w-40 sm:w-52"
              />
            </div>

            {/* Channel Filter Dropdown */}
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
              <option value="Referral">Referral</option>
            </select>

            {/* Add campaign quick trigger */}
            {dataSource === 'user' && (
              <button
                onClick={() => {
                  setCampaignToEdit(null);
                  setIsCampaignModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#426A8C] hover:bg-[#355571] text-white rounded-md text-xs font-semibold shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#202938]">
            <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#D8E2EA]">
              <tr>
                <th className="px-4 py-3">Campaign Name &amp; Product</th>
                <th className="px-3 py-3">Channel</th>
                <th className="px-3 py-3">Reporting Date</th>
                <th className="px-3 py-3 text-right">Ad Spend</th>
                <th className="px-3 py-3 text-right">CTR</th>
                <th className="px-3 py-3 text-right">New Customers</th>
                <th className="px-3 py-3 text-right">CAC</th>
                <th className="px-3 py-3 text-right">ROAS</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E2EA]/60 bg-white">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => {
                  const matchingUserCampaign = userCampaigns.find((c) => c.id === camp.id);

                  return (
                    <tr key={camp.id} className="hover:bg-[#F8FAFC]/80 transition">
                      {/* Name & Product */}
                      <td className="px-4 py-3 font-medium text-[#202938]">
                        <div>{camp.name}</div>
                        <div className="text-[11px] text-[#667085] font-normal flex items-center gap-1.5 mt-0.5">
                          <span>{camp.product}</span>
                          {camp.targetSegment && (
                            <>
                              <span>·</span>
                              <span className="text-[#667085]">{camp.targetSegment}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="px-3 py-3 text-[#202938]">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#D8E2EA] text-[11px]">
                          {camp.channel}
                        </span>
                      </td>

                      {/* Reporting Date */}
                      <td className="px-3 py-3 text-[#667085] font-mono text-[11px]">
                        {camp.date || '—'}
                      </td>

                      {/* Ad Spend */}
                      <td className="px-3 py-3 text-right font-medium text-[#202938]">
                        ${camp.spend.toLocaleString()}
                      </td>

                      {/* CTR */}
                      <td className="px-3 py-3 text-right text-[#202938]">
                        {camp.ctr !== '—' ? `${camp.ctr}%` : '—'}
                      </td>

                      {/* New Customers Acquired */}
                      <td className="px-3 py-3 text-right font-semibold text-[#202938]">
                        {camp.conversions}
                      </td>

                      {/* CAC */}
                      <td className="px-3 py-3 text-right font-medium text-[#202938]">
                        {camp.cac !== '—' ? `$${formatMetricNumber(camp.cac, 2)}` : '—'}
                      </td>

                      {/* ROAS */}
                      <td className="px-3 py-3 text-right font-semibold text-[#426A8C]">
                        {camp.roas !== '—' ? `${formatMetricNumber(camp.roas, 2)}x` : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If it's a user campaign, provide Edit & Delete */}
                          {dataSource === 'user' && matchingUserCampaign && (
                            <>
                              <button
                                onClick={() => {
                                  setCampaignToEdit(matchingUserCampaign);
                                  setIsCampaignModalOpen(true);
                                }}
                                className="p-1 text-[#667085] hover:text-[#426A8C] hover:bg-[#EAF0F5] rounded transition"
                                title="Edit campaign figures"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                                className="p-1 text-[#667085] hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete campaign"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Optimize in Agent */}
                          <button
                            onClick={() => onOptimizeCampaignInAgent && onOptimizeCampaignInAgent(camp)}
                            className="px-2.5 py-1 rounded bg-[#EAF0F5] hover:bg-[#DFE9F2] text-[#426A8C] border border-[#D8E2EA] text-xs font-semibold transition"
                            title="Generate marketing copy in AI Agent"
                          >
                            Optimize Copy
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-xs text-[#667085]">
                    No campaigns found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => {
          setIsCampaignModalOpen(false);
          setCampaignToEdit(null);
        }}
        onSave={handleSaveCampaign}
        initialCampaign={campaignToEdit}
      />

      <CsvImportExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        campaigns={userCampaigns}
        onImport={handleImportCsv}
      />

      <MetricFormulasModal
        isOpen={isFormulasModalOpen}
        onClose={() => setIsFormulasModalOpen(false)}
      />
    </div>
  );
};
