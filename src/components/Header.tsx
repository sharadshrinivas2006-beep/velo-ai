import React from 'react';

interface HeaderProps {
  activeTab: 'agent' | 'analytics' | 'safeguards' | 'safety_history';
  setActiveTab: (tab: 'agent' | 'analytics' | 'safeguards' | 'safety_history') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D8E2EA] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#202938]">VeloFin</span>
              <span className="text-xs text-[#D8E2EA] font-normal">|</span>
              <span className="text-xs text-[#667085] font-medium">Marketing &amp; Analytics</span>
            </div>
          </div>

          {/* Clean Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'agent'
                  ? 'bg-[#EAF0F5] text-[#426A8C] font-semibold border border-[#D8E2EA]'
                  : 'text-[#667085] hover:text-[#202938] hover:bg-[#F3F7FA] border border-transparent'
              }`}
            >
              Marketing Agent
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-[#EAF0F5] text-[#426A8C] font-semibold border border-[#D8E2EA]'
                  : 'text-[#667085] hover:text-[#202938] hover:bg-[#F3F7FA] border border-transparent'
              }`}
            >
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('safeguards')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'safeguards'
                  ? 'bg-[#EAF0F5] text-[#426A8C] font-semibold border border-[#D8E2EA]'
                  : 'text-[#667085] hover:text-[#202938] hover:bg-[#F3F7FA] border border-transparent'
              }`}
            >
              Safeguards &amp; Compliance
            </button>

            <button
              onClick={() => setActiveTab('safety_history')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'safety_history'
                  ? 'bg-[#EAF0F5] text-[#426A8C] font-semibold border border-[#D8E2EA]'
                  : 'text-[#667085] hover:text-[#202938] hover:bg-[#F3F7FA] border border-transparent'
              }`}
            >
              Safety History
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
