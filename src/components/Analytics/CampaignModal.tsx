import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import { UserCampaign } from '../../types';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: UserCampaign) => void;
  initialCampaign?: UserCampaign | null;
}

const CHANNELS = [
  'Paid Search',
  'LinkedIn B2B',
  'Paid Social',
  'Email Nurture',
  'Content/SEO',
  'Referral',
  'Affiliate / Partner',
  'Display Network',
  'Event / Conference',
];

const PRODUCTS = [
  'VeloYield Treasury',
  'VeloCard Corporate',
  'VeloGrowth Credit Line',
  'VeloPay Global FX',
];

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCampaign,
}) => {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Paid Search');
  const [customChannel, setCustomChannel] = useState('');
  const [isCustomChannel, setIsCustomChannel] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetSegment, setTargetSegment] = useState('');
  const [product, setProduct] = useState('VeloYield Treasury');
  const [status, setStatus] = useState<'Active' | 'Paused' | 'Optimizing' | 'Draft' | 'Ready for review'>('Active');

  // Numeric fields as strings for easy controlled input typing
  const [spend, setSpend] = useState<string>('0');
  const [impressions, setImpressions] = useState<string>('0');
  const [clicks, setClicks] = useState<string>('0');
  const [websiteVisits, setWebsiteVisits] = useState<string>('0');
  const [newCustomers, setNewCustomers] = useState<string>('0');
  const [attributedRevenue, setAttributedRevenue] = useState<string>('0');
  const [emailDelivered, setEmailDelivered] = useState<string>('');
  const [emailOpens, setEmailOpens] = useState<string>('');
  const [estimatedLtv, setEstimatedLtv] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialCampaign) {
      setName(initialCampaign.name || '');
      const isPredefined = CHANNELS.includes(initialCampaign.channel);
      if (isPredefined) {
        setChannel(initialCampaign.channel);
        setIsCustomChannel(false);
        setCustomChannel('');
      } else {
        setChannel('Other');
        setIsCustomChannel(true);
        setCustomChannel(initialCampaign.channel || '');
      }
      setDate(initialCampaign.date || new Date().toISOString().slice(0, 10));
      setTargetSegment(initialCampaign.targetSegment || '');
      setProduct(initialCampaign.product || 'VeloYield Treasury');
      setStatus(initialCampaign.status || 'Active');

      setSpend(String(initialCampaign.spend ?? 0));
      setImpressions(String(initialCampaign.impressions ?? 0));
      setClicks(String(initialCampaign.clicks ?? 0));
      setWebsiteVisits(String(initialCampaign.websiteVisits ?? 0));
      setNewCustomers(String(initialCampaign.newCustomers ?? 0));
      setAttributedRevenue(String(initialCampaign.attributedRevenue ?? 0));
      setEmailDelivered(initialCampaign.emailDelivered !== undefined ? String(initialCampaign.emailDelivered) : '');
      setEmailOpens(initialCampaign.emailOpens !== undefined ? String(initialCampaign.emailOpens) : '');
      setEstimatedLtv(initialCampaign.estimatedLtv !== undefined ? String(initialCampaign.estimatedLtv) : '');
    } else {
      // Reset form
      setName('');
      setChannel('Paid Search');
      setIsCustomChannel(false);
      setCustomChannel('');
      setDate(new Date().toISOString().slice(0, 10));
      setTargetSegment('Founders & CFOs');
      setProduct('VeloYield Treasury');
      setStatus('Active');
      setSpend('5000');
      setImpressions('100000');
      setClicks('3200');
      setWebsiteVisits('2800');
      setNewCustomers('35');
      setAttributedRevenue('22500');
      setEmailDelivered('');
      setEmailOpens('');
      setEstimatedLtv('2200');
    }
    setErrors({});
  }, [initialCampaign, isOpen]);

  if (!isOpen) return null;

  // Numeric parsing and validation
  const numSpend = Number(spend);
  const numImpressions = Number(impressions);
  const numClicks = Number(clicks);
  const numVisits = Number(websiteVisits);
  const numCustomers = Number(newCustomers);
  const numRevenue = Number(attributedRevenue);
  const numEmailDelivered = emailDelivered !== '' ? Number(emailDelivered) : undefined;
  const numEmailOpens = emailOpens !== '' ? Number(emailOpens) : undefined;
  const numLtv = estimatedLtv !== '' ? Number(estimatedLtv) : undefined;

  // Real-time metric calculations
  const calcCtr = !isNaN(numImpressions) && numImpressions > 0 && !isNaN(numClicks)
    ? ((numClicks / numImpressions) * 100).toFixed(2) + '%'
    : '—';

  const calcConversionRate = !isNaN(numVisits) && numVisits > 0 && !isNaN(numCustomers)
    ? ((numCustomers / numVisits) * 100).toFixed(2) + '%'
    : '—';

  const calcCac = !isNaN(numCustomers) && numCustomers > 0 && !isNaN(numSpend)
    ? '$' + (numSpend / numCustomers).toFixed(2)
    : '—';

  const calcRoas = !isNaN(numSpend) && numSpend > 0 && !isNaN(numRevenue)
    ? (numRevenue / numSpend).toFixed(2) + 'x'
    : '—';

  const calcEmailOpenRate = numEmailDelivered !== undefined && !isNaN(numEmailDelivered) && numEmailDelivered > 0 && numEmailOpens !== undefined && !isNaN(numEmailOpens)
    ? ((numEmailOpens / numEmailDelivered) * 100).toFixed(2) + '%'
    : '—';

  const rawCac = numCustomers > 0 && numSpend >= 0 ? numSpend / numCustomers : 0;
  const calcLtvCac = rawCac > 0 && numLtv !== undefined && !isNaN(numLtv) && numLtv >= 0
    ? (numLtv / rawCac).toFixed(2) + 'x'
    : '—';

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Campaign name is required.';
    }

    if (isCustomChannel && !customChannel.trim()) {
      newErrors.channel = 'Please enter a custom channel name.';
    }

    if (!date) {
      newErrors.date = 'Reporting date is required.';
    }

    const checkNonNegative = (val: string, fieldName: string, label: string) => {
      const n = Number(val);
      if (val === '' || isNaN(n)) {
        newErrors[fieldName] = `${label} must be a valid number.`;
      } else if (n < 0) {
        newErrors[fieldName] = `${label} cannot be negative. Must be 0 or greater.`;
      }
    };

    checkNonNegative(spend, 'spend', 'Ad Spend');
    checkNonNegative(impressions, 'impressions', 'Impressions');
    checkNonNegative(clicks, 'clicks', 'Clicks');
    checkNonNegative(websiteVisits, 'websiteVisits', 'Website Visits');
    checkNonNegative(newCustomers, 'newCustomers', 'New Customers');
    checkNonNegative(attributedRevenue, 'attributedRevenue', 'Attributed Revenue');

    if (emailDelivered !== '') {
      const n = Number(emailDelivered);
      if (isNaN(n) || n < 0) {
        newErrors.emailDelivered = 'Email Delivered must be a non-negative number.';
      }
    }

    if (emailOpens !== '') {
      const n = Number(emailOpens);
      if (isNaN(n) || n < 0) {
        newErrors.emailOpens = 'Email Opens must be a non-negative number.';
      } else if (emailDelivered !== '' && n > Number(emailDelivered)) {
        newErrors.emailOpens = 'Email Opens cannot exceed Email Delivered.';
      }
    }

    if (estimatedLtv !== '') {
      const n = Number(estimatedLtv);
      if (isNaN(n) || n < 0) {
        newErrors.estimatedLtv = 'Estimated LTV must be a non-negative number.';
      }
    }

    if (Number(clicks) > Number(impressions) && Number(impressions) > 0) {
      newErrors.clicks = 'Clicks cannot exceed Impressions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalChannel = isCustomChannel ? customChannel.trim() : channel;

    const campaign: UserCampaign = {
      id: initialCampaign ? initialCampaign.id : `user-cmp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      channel: finalChannel,
      date,
      spend: Number(spend),
      impressions: Number(impressions),
      clicks: Number(clicks),
      websiteVisits: Number(websiteVisits),
      newCustomers: Number(newCustomers),
      attributedRevenue: Number(attributedRevenue),
      emailDelivered: emailDelivered !== '' ? Number(emailDelivered) : undefined,
      emailOpens: emailOpens !== '' ? Number(emailOpens) : undefined,
      estimatedLtv: estimatedLtv !== '' ? Number(estimatedLtv) : undefined,
      targetSegment: targetSegment.trim() || 'General Audience',
      product,
      status,
      createdAt: initialCampaign?.createdAt || new Date().toISOString(),
      isDraft: initialCampaign?.isDraft || false,
      draftStatus: initialCampaign?.draftStatus,
      draftContent: initialCampaign?.draftContent,
      writingMode: initialCampaign?.writingMode,
      hasPerformanceData: true,
      source: initialCampaign?.source || 'manual',
    };

    onSave(campaign);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white border border-[#D8E2EA] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2EA] bg-white">
          <div>
            <h2 className="text-base font-bold text-[#202938]">
              {initialCampaign ? 'Edit Campaign Data' : 'Add Campaign Data'}
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Enter campaign performance figures. Key ratios and metrics are calculated automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#202938] rounded-md hover:bg-[#F8FAFC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* General Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
              Campaign Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Campaign Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 Runway Extension - LinkedIn B2B"
                  className={`w-full bg-[#F8FAFC] border ${
                    errors.name ? 'border-red-400 focus:ring-red-400' : 'border-[#D8E2EA] focus:ring-[#426A8C]'
                  } rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:bg-white transition`}
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Channel <span className="text-red-500">*</span>
                </label>
                <select
                  value={isCustomChannel ? 'Other' : channel}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setIsCustomChannel(true);
                    } else {
                      setIsCustomChannel(false);
                      setChannel(e.target.value);
                    }
                  }}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white transition"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                  <option value="Other">Custom / Other Channel...</option>
                </select>
                {isCustomChannel && (
                  <input
                    type="text"
                    value={customChannel}
                    onChange={(e) => setCustomChannel(e.target.value)}
                    placeholder="Enter custom channel..."
                    className="w-full mt-2 bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-1.5 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                  />
                )}
                {errors.channel && <p className="text-[11px] text-red-500 mt-1">{errors.channel}</p>}
              </div>

              {/* Reporting Date */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Reporting Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white transition"
                />
                {errors.date && <p className="text-[11px] text-red-500 mt-1">{errors.date}</p>}
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  placeholder="e.g. Seed Founders, SaaS CFOs"
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white transition"
                />
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  FinTech Product
                </label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white transition"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Performance Figures */}
          <div className="space-y-3 pt-3 border-t border-[#D8E2EA]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
              Core Performance Figures (Non-Negative)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Ad Spend */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Ad Spend ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-[#667085]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md pl-6 pr-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                  />
                </div>
                {errors.spend && <p className="text-[11px] text-red-500 mt-1">{errors.spend}</p>}
              </div>

              {/* Impressions */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Impressions <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                />
                {errors.impressions && <p className="text-[11px] text-red-500 mt-1">{errors.impressions}</p>}
              </div>

              {/* Clicks */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Clicks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={clicks}
                  onChange={(e) => setClicks(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                />
                {errors.clicks && <p className="text-[11px] text-red-500 mt-1">{errors.clicks}</p>}
              </div>

              {/* Website Visits */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Website Visits <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={websiteVisits}
                  onChange={(e) => setWebsiteVisits(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                />
                {errors.websiteVisits && <p className="text-[11px] text-red-500 mt-1">{errors.websiteVisits}</p>}
              </div>

              {/* New Customers Acquired */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  New Customers Acquired <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newCustomers}
                  onChange={(e) => setNewCustomers(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                />
                {errors.newCustomers && <p className="text-[11px] text-red-500 mt-1">{errors.newCustomers}</p>}
              </div>

              {/* Attributed Revenue */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Attributed Revenue ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-[#667085]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={attributedRevenue}
                    onChange={(e) => setAttributedRevenue(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md pl-6 pr-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                  />
                </div>
                {errors.attributedRevenue && <p className="text-[11px] text-red-500 mt-1">{errors.attributedRevenue}</p>}
              </div>
            </div>
          </div>

          {/* Optional Metrics: Email & LTV */}
          <div className="space-y-3 pt-3 border-t border-[#D8E2EA]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085]">
              Optional Email &amp; Customer LTV Metrics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Email Delivered */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Email Delivered <span className="text-[#667085] font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={emailDelivered}
                  onChange={(e) => setEmailDelivered(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                />
                {errors.emailDelivered && <p className="text-[11px] text-red-500 mt-1">{errors.emailDelivered}</p>}
              </div>

              {/* Email Opens */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Email Opens <span className="text-[#667085] font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={emailOpens}
                  onChange={(e) => setEmailOpens(e.target.value)}
                  placeholder="e.g. 4200"
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                />
                {errors.emailOpens && <p className="text-[11px] text-red-500 mt-1">{errors.emailOpens}</p>}
              </div>

              {/* Estimated LTV */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Estimated Customer LTV ($) <span className="text-[#667085] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-[#667085]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={estimatedLtv}
                    onChange={(e) => setEstimatedLtv(e.target.value)}
                    placeholder="e.g. 2400"
                    className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md pl-6 pr-3 py-2 text-xs text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
                  />
                </div>
                {errors.estimatedLtv && <p className="text-[11px] text-red-500 mt-1">{errors.estimatedLtv}</p>}
              </div>
            </div>
          </div>

          {/* Live Calculated Metrics Preview */}
          <div className="p-4 bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#202938] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#426A8C]" />
                Live Metric Calculation Preview
              </span>
              <span className="text-[11px] text-[#667085]">
                Calculated automatically from inputs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-center">
              <div className="p-2 bg-white rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#667085] font-medium">CTR (Clicks ÷ Imp)</div>
                <div className="text-xs font-bold text-[#202938] mt-0.5">{calcCtr}</div>
              </div>
              <div className="p-2 bg-white rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#667085] font-medium">Conv Rate (Cust ÷ Visits)</div>
                <div className="text-xs font-bold text-[#202938] mt-0.5">{calcConversionRate}</div>
              </div>
              <div className="p-2 bg-white rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#667085] font-medium">CAC (Spend ÷ Cust)</div>
                <div className="text-xs font-bold text-[#202938] mt-0.5">{calcCac}</div>
              </div>
              <div className="p-2 bg-white rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#667085] font-medium">ROAS (Rev ÷ Spend)</div>
                <div className="text-xs font-bold text-[#426A8C] mt-0.5">{calcRoas}</div>
              </div>
              <div className="p-2 bg-white rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#667085] font-medium">Email Open Rate</div>
                <div className="text-xs font-bold text-[#202938] mt-0.5">{calcEmailOpenRate}</div>
              </div>
              <div className="p-2 bg-white rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#667085] font-medium">LTV:CAC (LTV ÷ CAC)</div>
                <div className="text-xs font-bold text-[#202938] mt-0.5">{calcLtvCac}</div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#D8E2EA] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-[11px] text-[#667085]">
            💾 Data is stored in your local browser storage.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#667085] hover:text-[#202938] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialCampaign ? 'Save Changes' : 'Add Campaign'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
