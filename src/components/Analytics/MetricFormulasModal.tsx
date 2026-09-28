import React from 'react';
import { X, HelpCircle, Calculator, ShieldCheck } from 'lucide-react';

interface MetricFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricFormulasModal: React.FC<MetricFormulasModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formulas = [
    {
      name: 'Click-Through Rate (CTR)',
      formula: 'Clicks ÷ Impressions',
      example: '3,200 clicks ÷ 100,000 impressions = 3.20%',
      description: 'Measures the proportion of ad viewers who clicked through to your landing page.',
      fallback: 'Displays "—" if impressions is 0 or unrecorded.',
    },
    {
      name: 'Conversion Rate',
      formula: 'New Customers Acquired ÷ Website Visits',
      example: '35 customers ÷ 2,800 visits = 1.25%',
      description: 'The percentage of website visitors who complete activation and become funded accounts.',
      fallback: 'Displays "—" if website visits is 0 or unrecorded.',
    },
    {
      name: 'Customer Acquisition Cost (CAC)',
      formula: 'Ad Spend ÷ New Customers Acquired',
      example: '$5,000 spend ÷ 35 customers = $142.86',
      description: 'The average advertising spend required to acquire a single verified business customer.',
      fallback: 'Displays "—" if new customers acquired is 0.',
    },
    {
      name: 'Return on Ad Spend (ROAS)',
      formula: 'Attributed Revenue ÷ Ad Spend',
      example: '$22,500 revenue ÷ $5,000 spend = 4.50x',
      description: 'Gross revenue generated per $1 of advertising expenditure.',
      fallback: 'Displays "—" if ad spend is 0.',
    },
    {
      name: 'Email Open Rate',
      formula: 'Email Opens ÷ Email Delivered',
      example: '4,200 opens ÷ 12,500 delivered = 33.60%',
      description: 'The percentage of delivered marketing emails that were opened by recipients.',
      fallback: 'Displays "—" if email delivery data is unrecorded or 0.',
    },
    {
      name: 'LTV:CAC Ratio',
      formula: 'Estimated Customer Lifetime Value ÷ CAC',
      example: '$2,200 CLV ÷ $142.86 CAC = 15.40x',
      description: 'Unit economic multiplier comparing lifetime gross customer value against initial acquisition cost. Target for SaaS/FinTech is typically 3.0x - 5.0x+.',
      fallback: 'Displays "—" if either CAC is 0 / unavailable or LTV is not estimated.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white border border-[#D8E2EA] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2EA] bg-white">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#426A8C]" />
            <div>
              <h2 className="text-base font-bold text-[#202938]">
                Metric Calculation Guide
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Exact mathematical formulas used across the dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#202938] rounded-md hover:bg-[#F8FAFC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-[#EAF0F5] border border-[#D8E2EA] rounded-lg text-xs text-[#202938] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#426A8C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#426A8C]">Zero &amp; Missing Denominator Safety: </span>
              In cases where input values are 0 or unrecorded (e.g. 0 clicks, 0 new customers, or no email delivery figures), ratios safely display <span className="font-mono font-semibold">"—"</span> rather than misleading values such as Infinity or NaN.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {formulas.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202938]">{item.name}</span>
                  <span className="px-2 py-0.5 bg-white border border-[#D8E2EA] rounded text-[11px] font-mono text-[#426A8C] font-semibold">
                    {item.formula}
                  </span>
                </div>
                <div className="text-xs text-[#667085] leading-relaxed">
                  {item.description}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-1 border-t border-[#D8E2EA]/60 gap-1 text-[#667085]">
                  <span><strong>Example:</strong> {item.example}</span>
                  <span className="text-amber-800 font-medium">{item.fallback}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#D8E2EA] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md transition shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
