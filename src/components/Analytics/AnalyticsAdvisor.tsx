import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Send, 
  ArrowUpRight
} from 'lucide-react';
import { DashboardMetrics } from '../../types';
import { requestAnalyticsAdvisor } from '../../services/api';
import { FormattedContent } from '../FormattedContent';

interface AnalyticsAdvisorProps {
  metrics: DashboardMetrics;
  onSelectCampaignForAgent?: (campaignName: string, channel: string) => void;
}

const SAMPLE_QUESTIONS = [
  'Why is Paid Search CAC higher than LinkedIn?',
  'Explain our LTV:CAC ratio in plain language.',
  'How can we reduce drop-off during account onboarding?',
  'Which channel shows the highest acquisition efficiency?',
];

export const AnalyticsAdvisor: React.FC<AnalyticsAdvisorProps> = ({ 
  metrics,
}) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  const fetchInsights = async (query?: string) => {
    setIsLoading(true);
    try {
      const res = await requestAnalyticsAdvisor(metrics, query);
      setInsights(res.insights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [metrics.period]);

  const handleAskQuestion = (q: string) => {
    setUserQuery(q);
    fetchInsights(q);
  };

  return (
    <div className="bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D8E2EA]">
        <div>
          <h3 className="text-sm font-semibold text-[#202938]">Analytics Insights &amp; Recommendations</h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Observations and campaign suggestions based on the reporting period data.
          </p>
        </div>

        <button
          onClick={() => fetchInsights(userQuery || undefined)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 text-[#426A8C] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Structured Content Area */}
      <div className="p-4 rounded-md bg-[#F8FAFC] border border-[#D8E2EA] text-xs sm:text-sm text-[#202938] leading-relaxed overflow-y-auto max-h-[380px]">
        {isLoading ? (
          <div className="py-8 text-center text-[#667085] text-xs flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-[#426A8C]" />
            <span className="text-[#202938] font-medium">Analyzing metric relationships...</span>
          </div>
        ) : (
          <FormattedContent content={insights} />
        )}
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-[#667085]">
          Suggested Questions:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(q)}
              disabled={isLoading}
              className="text-left p-2 rounded bg-white hover:bg-[#F3F7FA] border border-[#D8E2EA] text-xs text-[#202938] transition flex items-center justify-between group shadow-2xs"
            >
              <span className="truncate pr-2">{q}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#667085] group-hover:text-[#426A8C] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom Question Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (userQuery.trim()) {
            fetchInsights(userQuery);
          }
        }}
        className="flex gap-2 pt-2 border-t border-[#D8E2EA]"
      >
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Ask a question about current campaign performance..."
          className="flex-1 bg-white border border-[#D8E2EA] rounded-md px-3 py-1.5 text-xs text-[#202938] placeholder-[#667085] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
        />
        <button
          type="submit"
          disabled={isLoading || !userQuery.trim()}
          className="px-3.5 py-1.5 bg-[#426A8C] hover:bg-[#355571] disabled:opacity-50 text-white font-medium rounded-md text-xs flex items-center gap-1 transition shadow-sm"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
