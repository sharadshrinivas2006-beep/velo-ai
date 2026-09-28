import React from 'react';
import { 
  FileText, 
  Mail, 
  Megaphone, 
  Share2, 
  LifeBuoy, 
  Compass,
  Check
} from 'lucide-react';
import { WritingMode } from '../../types';
import { WRITING_MODES } from '../../utils/safetyAuditor';

interface WritingModeSelectorProps {
  selectedMode: WritingMode;
  onSelectMode: (mode: WritingMode) => void;
}

const MODE_ICONS: Record<WritingMode, React.ReactNode> = {
  blog: <FileText className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  advertisement: <Megaphone className="w-4 h-4" />,
  social_media: <Share2 className="w-4 h-4" />,
  customer_support: <LifeBuoy className="w-4 h-4" />,
  product_recommendation: <Compass className="w-4 h-4" />,
};

export const WritingModeSelector: React.FC<WritingModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
}) => {
  const currentConfig = WRITING_MODES[selectedMode];

  return (
    <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#D8E2EA]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#202938]">Writing Mode</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentConfig.badgeClass}`}>
              Active: {currentConfig.label}
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Select a mode before submitting. Each mode structures content and tone specifically for its channel.
          </p>
        </div>
      </div>

      {/* Grid of Selectable Modes with Distinct Subtle Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(Object.keys(WRITING_MODES) as WritingMode[]).map((modeKey) => {
          const cfg = WRITING_MODES[modeKey];
          const isSelected = selectedMode === modeKey;

          return (
            <button
              key={modeKey}
              type="button"
              onClick={() => onSelectMode(modeKey)}
              className={`relative text-left p-3 rounded-lg border transition-all flex flex-col justify-between h-[92px] group cursor-pointer ${
                isSelected
                  ? `${cfg.activeBorderClass} shadow-xs`
                  : 'border-[#D8E2EA] bg-[#F8FAFC] hover:bg-white hover:border-[#426A8C]/40 text-[#667085]'
              }`}
            >
              {/* Header inside button */}
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-1.5 rounded-md ${
                    isSelected
                      ? 'bg-white shadow-2xs'
                      : 'bg-white border border-[#D8E2EA]'
                  }`}
                  style={{ color: cfg.hex }}
                >
                  {MODE_ICONS[modeKey]}
                </div>

                {isSelected && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: cfg.hex }}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Title & Short Tag */}
              <div>
                <div className={`text-xs font-bold ${isSelected ? 'text-[#202938]' : 'text-[#202938]/80 group-hover:text-[#202938]'}`}>
                  {cfg.label}
                </div>
                <div className="text-[10px] text-[#667085] truncate mt-0.5">
                  {cfg.badgeLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mode Banner with Guidelines */}
      <div className={`p-2.5 rounded-md border text-xs flex items-center justify-between gap-3 ${currentConfig.bgClass} ${currentConfig.borderClass}`}>
        <div className="flex items-center gap-2 text-[#202938]">
          <span className="font-semibold">{currentConfig.label} Mode:</span>
          <span className="text-[#667085] hidden sm:inline">{currentConfig.guidelines}</span>
          <span className="text-[#667085] sm:hidden truncate">{currentConfig.description}</span>
        </div>
        <span className="text-[11px] font-medium text-[#667085] shrink-0">
          Tone: <span className="text-[#202938] font-semibold">{currentConfig.defaultTone}</span>
        </span>
      </div>
    </div>
  );
};
