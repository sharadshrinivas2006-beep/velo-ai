import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  Layers, 
  Database,
  ExternalLink,
  Lock,
  Headphones,
  Check
} from 'lucide-react';
import { SafetyHistoryRecord, WritingMode, RiskLevel } from '../../types';
import { 
  loadSafetyHistory, 
  saveSafetyHistory, 
  clearSafetyHistory, 
  loadSafetyHistorySource, 
  saveSafetyHistorySource, 
  SAMPLE_SAFETY_HISTORY,
  WRITING_MODES,
  getRiskLevelBadge
} from '../../utils/safetyAuditor';
import { SafetyReviewModal } from '../MarketingAgent/SafetyReviewModal';

export const SafetyHistoryTab: React.FC<{ onNavigateToAgent?: () => void }> = ({ onNavigateToAgent }) => {
  const [historySource, setHistorySource] = useState<'user' | 'sample'>('user');
  const [userRecords, setUserRecords] = useState<SafetyHistoryRecord[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modal inspection state
  const [selectedRecord, setSelectedRecord] = useState<SafetyHistoryRecord | null>(null);

  // Notification toast
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    const loaded = loadSafetyHistory();
    const sourcePref = loadSafetyHistorySource();
    setUserRecords(loaded);
    setHistorySource(loaded.length > 0 ? sourcePref : 'user');
  }, []);

  const activeRecords = historySource === 'user' ? userRecords : SAMPLE_SAFETY_HISTORY;

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all user safety audit records?')) {
      clearSafetyHistory();
      setUserRecords([]);
      showNotice('Cleared user safety history log');
    }
  };

  const handleLoadSampleLog = () => {
    setHistorySource('sample');
    saveSafetyHistorySource('sample');
    showNotice('Loaded illustrative sample audit history');
  };

  const handleSwitchSource = (source: 'user' | 'sample') => {
    setHistorySource(source);
    saveSafetyHistorySource(source);
    showNotice(source === 'user' ? 'Switched to User Audit History' : 'Switched to Sample Audit Log');
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return activeRecords.filter((rec) => {
      // Search
      const searchMatch = !searchQuery.trim() || 
        rec.modeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.maskedExcerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.flaggedCategories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));

      // Mode
      const modeMatch = modeFilter === 'all' || rec.mode === modeFilter;

      // Risk
      const riskMatch = riskFilter === 'all' || rec.riskLevel === riskFilter;

      // Date
      let dateMatch = true;
      if (dateFilter !== 'all') {
        const recordDate = new Date(rec.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - recordDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateFilter === 'today') {
          dateMatch = diffDays <= 1;
        } else if (dateFilter === '7d') {
          dateMatch = diffDays <= 7;
        } else if (dateFilter === 'older') {
          dateMatch = diffDays > 7;
        }
      }

      return searchMatch && modeMatch && riskMatch && dateMatch;
    });
  }, [activeRecords, searchQuery, modeFilter, riskFilter, dateFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-20 right-5 z-50 bg-[#202938] text-white px-3.5 py-2 rounded-md shadow-lg text-xs font-medium flex items-center gap-2 border border-[#426A8C] animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header & Source Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D8E2EA]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-[#202938]">Safety &amp; Compliance History</h1>
            {historySource === 'user' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Database className="w-3 h-3 text-emerald-600" />
                User Review Records ({userRecords.length})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#EAF0F5] text-[#426A8C] border border-[#D8E2EA]">
                <Layers className="w-3 h-3 text-[#426A8C]" />
                Sample Benchmark Log (4)
              </span>
            )}
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Audit trail of every generated marketing draft, customer support response, and credential check.
          </p>
        </div>

        {/* Source Toggle Strip & Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="inline-flex rounded-md border border-[#D8E2EA] p-0.5 bg-white">
            <button
              onClick={() => handleSwitchSource('user')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                historySource === 'user'
                  ? 'bg-[#EAF0F5] text-[#426A8C] font-semibold border border-[#D8E2EA]'
                  : 'text-[#667085] hover:text-[#202938]'
              }`}
            >
              My Records ({userRecords.length})
            </button>
            <button
              onClick={() => handleSwitchSource('sample')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                historySource === 'sample'
                  ? 'bg-[#EAF0F5] text-[#426A8C] font-semibold border border-[#D8E2EA]'
                  : 'text-[#667085] hover:text-[#202938]'
              }`}
            >
              Sample Log (4)
            </button>
          </div>

          {historySource === 'user' && userRecords.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-md transition shadow-2xs"
              title="Clear User History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mode, excerpt, or category..."
            className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#667085] font-medium">Mode:</span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2 py-1 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
            >
              <option value="all">All Modes</option>
              <option value="blog">Blog</option>
              <option value="email">Email</option>
              <option value="advertisement">Advertisement</option>
              <option value="social_media">Social Media</option>
              <option value="customer_support">Customer Support Response</option>
              <option value="product_recommendation">Product Recommendation</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#667085] font-medium">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2 py-1 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk (90-100)</option>
              <option value="moderate">Moderate Risk (70-89)</option>
              <option value="high">High Risk (40-69)</option>
              <option value="critical">Critical Risk (0-39)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#667085] font-medium">Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2 py-1 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="older">Older</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {historySource === 'user' && userRecords.length === 0 && (
        <div className="bg-white border-2 border-dashed border-[#D8E2EA] rounded-xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EAF0F5] text-[#426A8C] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[#202938]">
              No reviews recorded yet
            </h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Every marketing draft, customer support reply, and product recommendation generated in the Marketing Agent is automatically audited and recorded here.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigateToAgent && (
              <button
                onClick={onNavigateToAgent}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md shadow-sm transition flex items-center gap-1.5"
              >
                <span>Generate Content in Agent</span>
              </button>
            )}

            <button
              onClick={handleLoadSampleLog}
              className="px-4 py-2 text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md transition flex items-center gap-1.5 shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-[#426A8C]" />
              <span>Explore Sample Audit Log</span>
            </button>
          </div>

          <div className="pt-2 text-[11px] text-[#667085]">
            🔒 All secrets, OTPs, and card credentials are automatically masked. Only minimum required compliance metadata is stored locally.
          </div>
        </div>
      )}

      {/* Safety Records Table / List */}
      {(historySource === 'sample' || userRecords.length > 0) && (
        <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#D8E2EA] flex items-center justify-between text-xs">
            <div className="font-semibold text-[#202938]">
              {historySource === 'user' ? 'User Audit Log' : 'Sample Benchmark Audit Log'} ({filteredRecords.length} records)
            </div>
            <div className="text-[#667085]">
              Scale: 0-100 (Higher score = lower detected risk)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#202938]">
              <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#D8E2EA]">
                <tr>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Safety Score</th>
                  <th className="px-3 py-3">Risk Level</th>
                  <th className="px-3 py-3">Flagged Issues</th>
                  <th className="px-4 py-3">Safely Masked Excerpt</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E2EA]/60 bg-white">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((rec) => {
                    const badge = getRiskLevelBadge(rec.riskLevel);
                    const modeCfg = WRITING_MODES[rec.mode];

                    return (
                      <tr key={rec.id} className="hover:bg-[#F8FAFC]/80 transition">
                        {/* Writing Mode */}
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${modeCfg ? modeCfg.tagClass : 'bg-[#F8FAFC] text-[#202938] border-[#D8E2EA]'}`}>
                            {rec.modeLabel}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-3 py-3 text-[#667085] font-mono text-[11px] whitespace-nowrap">
                          {rec.formattedDate}
                        </td>

                        {/* Safety Score */}
                        <td className="px-3 py-3 font-mono font-bold text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className={rec.score >= 90 ? 'text-emerald-700' : rec.score >= 70 ? 'text-amber-700' : 'text-red-700'}>
                              {rec.score}
                            </span>
                            <span className="text-[10px] text-[#667085] font-normal">/ 100</span>
                          </div>
                        </td>

                        {/* Risk Level Badge */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.badgeBg} ${badge.borderClass}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Flagged Issue Categories */}
                        <td className="px-3 py-3">
                          {rec.review.hasCredentialRisk && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 mr-1 mb-1">
                              <Lock className="w-2.5 h-2.5 text-red-700" />
                              OTP / Credential
                            </span>
                          )}
                          {rec.review.requiresHumanEscalation && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200 mr-1 mb-1">
                              <Headphones className="w-2.5 h-2.5 text-rose-700" />
                              Human Handoff
                            </span>
                          )}
                          {rec.flaggedCategories.length > 0 ? (
                            rec.flaggedCategories.map((cat, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F8FAFC] text-[#667085] border border-[#D8E2EA] mr-1 mb-1"
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            !rec.review.hasCredentialRisk && (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                None (Clean)
                              </span>
                            )
                          )}
                        </td>

                        {/* Masked Excerpt */}
                        <td className="px-4 py-3 max-w-xs truncate text-[11px] text-[#667085]" title={rec.maskedExcerpt}>
                          {rec.maskedExcerpt}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedRecord(rec)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#426A8C] hover:text-[#355571] bg-[#EAF0F5] hover:bg-[#DFE9F2] border border-[#D8E2EA] rounded transition shadow-2xs"
                          >
                            Review Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#667085]">
                      No audit records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {selectedRecord && (
        <SafetyReviewModal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          review={selectedRecord.review}
          mode={selectedRecord.mode}
          dateStr={selectedRecord.formattedDate}
        />
      )}
    </div>
  );
};
