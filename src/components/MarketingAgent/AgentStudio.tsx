import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  Edit3, 
  RotateCw, 
  SlidersHorizontal,
  Lock,
  Headphones,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { requestMarketingAgent } from '../../services/api';
import { ChatMessage, WritingMode, SafetyReviewResult } from '../../types';
import { DraftEditorModal } from './DraftEditorModal';
import { FormattedContent } from '../FormattedContent';
import { WritingModeSelector } from './WritingModeSelector';
import { SafetyReviewCard } from './SafetyReviewCard';
import { SafetyReviewModal } from './SafetyReviewModal';
import { 
  WRITING_MODES, 
  performComprehensiveSafetyReview, 
  addSafetyHistoryRecord,
  maskSensitiveSecrets
} from '../../utils/safetyAuditor';
import { createDraftCampaignFromAgent } from '../../utils/analyticsCalculations';

const PRESET_PROMPTS = [
  {
    mode: 'email' as WritingMode,
    category: 'Email Campaign',
    title: 'Treasury Yield Email Campaign',
    channel: 'Email Campaign',
    audience: 'Startup Founders',
    goal: 'Treasury account activations',
    tone: 'Data-Driven & Concise',
    product: 'VeloYield Treasury (4.85% APY sweep)',
    prompt: 'Create an email campaign sequence introducing VeloYield Treasury to startup founders holding idle cash in commercial checking accounts.',
  },
  {
    mode: 'advertisement' as WritingMode,
    category: 'Advertising',
    title: 'Corporate Card Ad Copy',
    channel: 'Paid Ad Copy (LinkedIn & Search)',
    audience: 'Finance Directors & CFOs',
    goal: 'Demo bookings',
    tone: 'Direct & Action-Oriented',
    product: 'VeloCard Corporate (1.5% Cashback)',
    prompt: 'Write LinkedIn Sponsored Content and Google Search ad copy focusing on 1.5% software cashback and zero personal liability for corporate cards.',
  },
  {
    mode: 'blog' as WritingMode,
    category: 'Blog Post',
    title: 'Runway Optimization Guide',
    channel: 'Blog Post Draft',
    audience: 'Startup Founders & CFOs',
    goal: 'Organic SEO & Thought Leadership',
    tone: 'Authoritative & Educational',
    product: 'VeloYield Treasury & VeloCard',
    prompt: 'Draft an educational blog post on how high-growth startups preserve runway through cash sweep accounts and working capital credit lines without dilution.',
  },
  {
    mode: 'social_media' as WritingMode,
    category: 'Social Media',
    title: 'Founder Cash Management Post',
    channel: 'Social Media Suite',
    audience: 'Founders & Angel Investors',
    goal: 'Engagement & Inbound Discussion',
    tone: 'Conversational & Engaging',
    product: 'VeloYield Treasury',
    prompt: 'Create a thought-provoking LinkedIn & X post about why founders overlook treasury returns on seed funding while obsessing over SaaS discounts.',
  },
  {
    mode: 'customer_support' as WritingMode,
    category: 'Customer Support',
    title: 'Disputed Charge Response',
    channel: 'Customer Support FAQ',
    audience: 'Account Holder',
    goal: 'Reassurance & human escalation',
    tone: 'Empathetic, Transparent & De-escalating',
    product: 'VeloCard Security',
    prompt: 'A customer says: "I see an unauthorized charge of $4,200 on our virtual card that nobody approved. Was our account hacked?!" Draft a safe FinTech response.',
  },
  {
    mode: 'product_recommendation' as WritingMode,
    category: 'Product Matching',
    title: 'Segment Recommendations',
    channel: 'Product Recommendation',
    audience: 'E-commerce & SaaS Companies',
    goal: 'Needs assessment',
    tone: 'Consultative & Objective',
    product: 'VeloFin Suite',
    prompt: 'Recommend which VeloFin products best fit a growing e-commerce merchant with $3M annual sales versus an early-stage SaaS startup.',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `### Marketing Agent & Compliance Studio

Select a writing mode above to tailor content structure and tone. Every generated result is automatically evaluated by automated safety and compliance safeguards.

**Supported Writing Modes:**
- **Blog:** Long-form thought leadership, SEO educational guides, benchmark deep dives.
- **Email:** Direct outbound sequences, founder onboarding drips, product newsletters.
- **Advertisement:** Google Search headlines, LinkedIn sponsored copy, high-intent display text.
- **Social Media:** Executive X/LinkedIn posts, founder insights, milestone updates.
- **Customer Support Response:** FAQ replies, account security concerns, dispute routing, de-escalation.
- **Product Recommendation:** Needs-based product matching across treasury, credit lines, cards, and FX.

Select a preset below or enter a custom request to generate compliant copy.`,
    timestamp: 'Just now',
  },
];

interface AgentStudioProps {
  draftToLoad?: { content: string; title: string; channel: string; mode?: WritingMode } | null;
  onClearDraftToLoad?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const AgentStudio: React.FC<AgentStudioProps> = ({
  draftToLoad,
  onClearDraftToLoad,
  onNavigateToAnalytics,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [selectedMode, setSelectedMode] = useState<WritingMode>('email');
  const [inputPrompt, setInputPrompt] = useState('');
  
  // Parameter State
  const [channel, setChannel] = useState(WRITING_MODES.email.defaultChannel);
  const [targetAudience, setTargetAudience] = useState('Startup Founders');
  const [goal, setGoal] = useState(WRITING_MODES.email.defaultGoal);
  const [tone, setTone] = useState(WRITING_MODES.email.defaultTone);
  const [product, setProduct] = useState('VeloYield Treasury (4.85% APY sweep)');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Draft Editor Modal State
  const [editingDraft, setEditingDraft] = useState<{ content: string; title: string; channel: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Safety Details Modal State
  const [inspectingReview, setInspectingReview] = useState<{
    review: SafetyReviewResult;
    mode: WritingMode;
    dateStr: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-open draft editor if navigated from Analytics
  useEffect(() => {
    if (draftToLoad) {
      if (draftToLoad.mode && WRITING_MODES[draftToLoad.mode]) {
        setSelectedMode(draftToLoad.mode);
      }
      setEditingDraft({
        content: draftToLoad.content,
        title: draftToLoad.title || 'Edit Draft Campaign',
        channel: draftToLoad.channel || 'Marketing Campaign',
      });
      if (onClearDraftToLoad) {
        onClearDraftToLoad();
      }
    }
  }, [draftToLoad, onClearDraftToLoad]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Mode change handler: updates mode and applies appropriate defaults
  const handleSelectMode = (mode: WritingMode) => {
    setSelectedMode(mode);
    const cfg = WRITING_MODES[mode];
    setChannel(cfg.defaultChannel);
    setGoal(cfg.defaultGoal);
    setTone(cfg.defaultTone);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string, overrideParams?: any) => {
    const promptText = textToSend || inputPrompt;
    if (!promptText.trim() || isLoading) return;

    const currentMode = overrideParams?.writingMode || selectedMode;
    const currentChannel = overrideParams?.channel || channel;
    const currentAudience = overrideParams?.audience || targetAudience;
    const currentGoal = overrideParams?.goal || goal;
    const currentTone = overrideParams?.tone || tone;
    const currentProduct = overrideParams?.product || product;

    // Check for sensitive credential input in user prompt and mask for clean display
    const maskedUserDisplayPrompt = maskSensitiveSecrets(promptText);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: maskedUserDisplayPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      parameters: {
        writingMode: currentMode,
        channel: currentChannel,
        targetAudience: currentAudience,
        goal: currentGoal,
        tone: currentTone,
        product: currentProduct,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await requestMarketingAgent({
        type: currentMode === 'customer_support' ? 'support_faq' : currentMode === 'product_recommendation' ? 'recommendation' : 'campaign',
        prompt: promptText,
        parameters: {
          writingMode: currentMode,
          channel: currentChannel,
          targetAudience: currentAudience,
          goal: currentGoal,
          tone: currentTone,
          product: currentProduct,
        },
      });

      // Perform comprehensive safety evaluation
      const safetyReview: SafetyReviewResult = performComprehensiveSafetyReview(
        promptText,
        response.content,
        currentMode
      );

      // Automatically record in Safety History
      addSafetyHistoryRecord({
        id: `safe-rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        formattedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: currentMode,
        modeLabel: WRITING_MODES[currentMode].label,
        score: safetyReview.score,
        riskLevel: safetyReview.riskLevel,
        flaggedCategories: safetyReview.flaggedIssues.map((i) => i.category),
        maskedExcerpt: safetyReview.maskedResponseExcerpt,
        review: safetyReview,
        isSample: false,
      });

      // Automatically link generated marketing draft to Analytics as a campaign record
      const linkedDraftCampaign = createDraftCampaignFromAgent({
        channel: currentChannel,
        content: response.content,
        targetAudience: currentAudience,
        product: currentProduct,
        writingMode: currentMode,
      });

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parameters: {
          writingMode: currentMode,
          channel: currentChannel,
          targetAudience: currentAudience,
          goal: currentGoal,
          tone: currentTone,
          product: currentProduct,
        },
        safeguardAudit: response.safeguardAudit,
        safetyReview,
        isSimulated: response.isSimulated,
        modelUsed: response.modelUsed,
        linkedCampaignId: linkedDraftCampaign.id,
        linkedCampaignName: linkedDraftCampaign.name,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Agent message failed:', err);
      const errorMessage: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        role: 'assistant',
        content: `An issue occurred while generating the content. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setSelectedMode(preset.mode);
    setChannel(preset.channel);
    setTargetAudience(preset.audience);
    setGoal(preset.goal);
    setTone(preset.tone);
    setProduct(preset.product);
    handleSendMessage(preset.prompt, {
      writingMode: preset.mode,
      channel: preset.channel,
      audience: preset.audience,
      goal: preset.goal,
      tone: preset.tone,
      product: preset.product,
    });
  };

  const activeModeConfig = WRITING_MODES[selectedMode];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* 1. Clear Writing Modes Selector */}
      <WritingModeSelector
        selectedMode={selectedMode}
        onSelectMode={handleSelectMode}
      />

      {/* 2. Parameter Controls Bar */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#202938]">Campaign Parameters</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${activeModeConfig.tagClass}`}>
                {activeModeConfig.label} Mode
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              {channel} · {targetAudience} · {product}
            </p>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md transition self-start sm:self-auto shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#667085]" />
            <span>{showConfig ? 'Hide Parameters' : 'Adjust Parameters'}</span>
          </button>
        </div>

        {/* Collapsible Parameter Selectors */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-[#D8E2EA] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[#667085] font-medium mb-1">Channel Format</label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[#667085] font-medium mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              >
                <option value="Startup Founders">Startup Founders</option>
                <option value="Finance Directors & CFOs">Finance Directors &amp; CFOs</option>
                <option value="E-Commerce Merchants">E-Commerce Merchants</option>
                <option value="Agencies & Collectives">Agencies &amp; Collectives</option>
              </select>
            </div>

            <div>
              <label className="block text-[#667085] font-medium mb-1">Product</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              >
                <option value="VeloYield Treasury (4.85% APY sweep)">VeloYield Treasury</option>
                <option value="VeloCard Corporate (1.5% Cashback)">VeloCard Corporate</option>
                <option value="VeloGrowth Credit Line">VeloGrowth Credit Line</option>
                <option value="VeloPay Global FX">VeloPay Global FX</option>
              </select>
            </div>

            <div>
              <label className="block text-[#667085] font-medium mb-1">Tone</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[#667085] font-medium mb-1">Goal</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preset Suggestions Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#667085] font-medium shrink-0">Sample prompts:</span>
        {PRESET_PROMPTS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            className="px-2.5 py-1 bg-white hover:bg-[#F3F7FA] text-[#202938] border border-[#D8E2EA] rounded-md transition shrink-0 shadow-2xs flex items-center gap-1.5"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: WRITING_MODES[preset.mode].hex }}
            />
            <span>{preset.title}</span>
          </button>
        ))}
      </div>

      {/* Main Conversation & Output View */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Messages Stream */}
        <div className="p-6 space-y-6 max-h-[640px] overflow-y-auto">
          {messages.map((message) => {
            const msgMode = message.parameters?.writingMode || selectedMode;
            const modeCfg = WRITING_MODES[msgMode];

            return (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 text-xs text-[#667085]">
                  <span className="font-semibold text-[#202938]">
                    {message.role === 'assistant' ? 'VeloFin Agent' : 'You'}
                  </span>
                  {message.role === 'assistant' && modeCfg && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${modeCfg.tagClass}`}>
                      {modeCfg.label}
                    </span>
                  )}
                  {message.role === 'assistant' && message.id !== 'msg-welcome' && (
                    <>
                      {message.isSimulated ? (
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300"
                          title="Simulated FinTech engine - active when live Gemini key is not configured or offline fallback"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Simulated Engine
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          title="Generated live by Gemini 3.8 Flash model"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Gemini 3.8 Flash (Live)
                        </span>
                      )}
                    </>
                  )}
                  <span>·</span>
                  <span>{message.timestamp}</span>
                </div>

                {/* Message Container with Subtle Mode Color Accent */}
                <div
                  className={`max-w-3xl rounded-lg p-5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA]'
                      : 'bg-white text-[#202938] border border-[#D8E2EA] w-full shadow-2xs'
                  }`}
                  style={
                    message.role === 'assistant' && modeCfg
                      ? { borderLeftWidth: '4px', borderLeftColor: modeCfg.hex }
                      : undefined
                  }
                >
                  {/* User Parameters note if applicable */}
                  {message.role === 'user' && message.parameters && (
                    <div className="text-xs text-[#667085] mb-2 pb-2 border-b border-[#D8E2EA] flex flex-wrap gap-2">
                      <span>Mode: {WRITING_MODES[message.parameters.writingMode || 'email']?.label}</span>
                      <span>·</span>
                      <span>Channel: {message.parameters.channel}</span>
                      <span>·</span>
                      <span>Audience: {message.parameters.targetAudience}</span>
                    </div>
                  )}

                  {/* Render Clean UI formatted content */}
                  {message.role === 'assistant' ? (
                    <FormattedContent content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}

                  {/* Linked Analytics Campaign Banner */}
                  {message.role === 'assistant' && message.linkedCampaignId && (
                    <div className="mt-3.5 p-3 bg-[#F8FAFC] border border-[#D8E2EA] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#EAF0F5] text-[#426A8C] font-mono text-[11px] font-bold">
                          {message.linkedCampaignId}
                        </span>
                        <div className="text-xs text-[#202938]">
                          <span className="font-semibold">{message.linkedCampaignName}</span>
                          <span className="text-[#667085] ml-1.5 font-normal">automatically linked as Analytics campaign row</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          Draft
                        </span>
                      </div>

                      {onNavigateToAnalytics && (
                        <button
                          onClick={onNavigateToAnalytics}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-[#EAF0F5] text-[#426A8C] border border-[#D8E2EA] text-xs font-semibold transition shrink-0 self-start sm:self-auto"
                        >
                          <span>View in Analytics</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Response Actions & Safety Review Card */}
                  {message.role === 'assistant' && message.id !== 'msg-welcome' && (
                    <>
                      {/* Safety Review for Each Generated Result */}
                      {message.safetyReview && (
                        <SafetyReviewCard
                          review={message.safetyReview}
                          modeLabel={modeCfg?.label}
                          onOpenDetailsModal={() =>
                            setInspectingReview({
                              review: message.safetyReview!,
                              mode: msgMode,
                              dateStr: message.timestamp,
                            })
                          }
                        />
                      )}

                      <div className="mt-4 pt-3 border-t border-[#D8E2EA] flex items-center justify-between text-xs text-[#667085]">
                        <span className="text-[11px]">
                          Automated evaluation against FinTech marketing safeguards.
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#F8FAFC] hover:bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA] transition"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-[#426A8C]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#667085]" />
                            )}
                            <span>{copiedId === message.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() =>
                              setEditingDraft({
                                content: message.content,
                                title: `Refine ${modeCfg?.label || 'Draft'}`,
                                channel: message.parameters?.channel || channel,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#EAF0F5] hover:bg-[#DFE9F2] text-[#426A8C] border border-[#D8E2EA] font-medium transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit &amp; Regenerate</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg text-xs text-[#667085]">
              <RotateCw className="w-4 h-4 animate-spin text-[#426A8C]" />
              <span className="text-[#202938] font-medium">
                Generating compliant FinTech draft in {activeModeConfig.label} mode...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar with Clear Mode Indicator */}
        <div className="p-4 border-t border-[#D8E2EA] bg-[#F8FAFC]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={`Describe what you want to write in ${activeModeConfig.label} mode (e.g., 'Introduce treasury cash sweep with 4.85% variable yield')...`}
                className="flex-1 bg-white border border-[#D8E2EA] rounded-md px-3.5 py-2.5 text-sm text-[#202938] placeholder-[#667085] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="px-4 py-2.5 bg-[#426A8C] hover:bg-[#355571] disabled:opacity-50 text-white font-medium rounded-md text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm"
              >
                <span>Generate</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-[#667085] flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: activeModeConfig.hex }}
                />
                <span>Active Mode: <strong className="text-[#202938]">{activeModeConfig.label}</strong> ({channel})</span>
              </span>
              <span>Press Enter to generate</span>
            </div>
          </form>
        </div>
      </div>

      {/* Draft Editor Modal */}
      {editingDraft && (
        <DraftEditorModal
          isOpen={!!editingDraft}
          onClose={() => setEditingDraft(null)}
          initialContent={editingDraft.content}
          title={editingDraft.title}
          channel={editingDraft.channel}
          onSave={(newContent) => {
            setMessages((prev) => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === 'assistant') {
                  updated[i] = { ...updated[i], content: newContent };
                  break;
                }
              }
              return updated;
            });
          }}
        />
      )}

      {/* Safety Details Inspection Modal */}
      {inspectingReview && (
        <SafetyReviewModal
          isOpen={!!inspectingReview}
          onClose={() => setInspectingReview(null)}
          review={inspectingReview.review}
          mode={inspectingReview.mode}
          dateStr={inspectingReview.dateStr}
        />
      )}
    </div>
  );
};
