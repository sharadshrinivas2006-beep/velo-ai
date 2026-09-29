import React, { useState } from 'react';
import { Header } from './components/Header';
import { AgentStudio } from './components/MarketingAgent/AgentStudio';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { SafeguardsInspector } from './components/Safeguards/SafeguardsInspector';
import { SafetyHistoryTab } from './components/Safeguards/SafetyHistoryTab';
import { DataManagementTab } from './components/DataManagement/DataManagementTab';
import { CampaignData } from './types';
import { Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'agent' | 'analytics' | 'safeguards' | 'safety_history' | 'data'>('agent');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draftToLoad, setDraftToLoad] = useState<{
    content: string;
    title: string;
    channel: string;
    mode?: any;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOptimizeCampaignInAgent = (campaign: CampaignData) => {
    setActiveTab('agent');
    showToast(`Loaded "${campaign.name}" for copy optimization`);
  };

  const handleOpenDraftInAgent = (draft: {
    content: string;
    title: string;
    channel: string;
    mode?: any;
  }) => {
    setDraftToLoad(draft);
    setActiveTab('agent');
    showToast(`Opened "${draft.title}" in Marketing Agent`);
  };

  return (
    <div className="min-h-screen bg-[#EAF0F5] text-[#202938] flex flex-col font-sans">
      {/* Clean White Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'agent' && (
          <AgentStudio 
            draftToLoad={draftToLoad}
            onClearDraftToLoad={() => setDraftToLoad(null)}
            onNavigateToAnalytics={() => setActiveTab('analytics')}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            onOptimizeCampaignInAgent={handleOptimizeCampaignInAgent}
            onOpenDraftInAgent={handleOpenDraftInAgent}
          />
        )}
        {activeTab === 'safeguards' && <SafeguardsInspector />}
        {activeTab === 'safety_history' && (
          <SafetyHistoryTab onNavigateToAgent={() => setActiveTab('agent')} />
        )}
        {activeTab === 'data' && <DataManagementTab />}
      </main>

      {/* Minimal Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#426A8C] text-white px-3.5 py-2 rounded-md shadow-md text-xs font-medium flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-white/90" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Discreet Single-Location Disclosure Footer */}
      <footer className="border-t border-[#D8E2EA] bg-white py-4 text-xs text-[#667085]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-[#202938]">VeloFin</span> · Marketing Agent &amp; Analytics
          </div>
          <div className="text-[#667085] text-[11px] text-center sm:text-right">
            All sample figures, rates, and yields are illustrative for demonstration purposes. Content conforms to standard FinTech marketing disclosures.
          </div>
        </div>
      </footer>
    </div>
  );
}
