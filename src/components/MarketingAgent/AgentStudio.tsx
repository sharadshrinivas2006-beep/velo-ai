import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  Edit3, 
  RotateCw, 
  SlidersHorizontal
} from 'lucide-react';
import { requestMarketingAgent } from '../../services/api';
import { ChatMessage } from '../../types';
import { DraftEditorModal } from './DraftEditorModal';
import { FormattedContent } from '../FormattedContent';

const PRESET_PROMPTS = [
  {
    category: 'Campaign',
    title: 'Treasury Yield Email Campaign',
    channel: 'Email Campaign',
    audience: 'Startup Founders',
    goal: 'Treasury account activations',
    tone: 'Data-Driven & Concise',
    product: 'VeloYield Treasury (4.85% APY sweep)',
    prompt: 'Create an email campaign sequence introducing VeloYield Treasury to startup founders holding idle cash in commercial checking accounts.',
  },
  {
    category: 'Advertising',
    title: 'Corporate Card Ad Copy',
    channel: 'Paid Ad Copy (LinkedIn & Search)',
    audience: 'Finance Directors & CFOs',
    goal: 'Demo bookings',
    tone: 'Professional & Direct',
    product: 'VeloCard Corporate (1.5% Cashback)',
    prompt: 'Write LinkedIn Sponsored Content and Google Search ad copy focusing on 1.5% software cashback and zero personal liability for corporate cards.',
  },
  {
    category: 'Customer Support',
    title: 'Disputed Charge Response',
    channel: 'Customer Support FAQ',
    audience: 'Account Holder',
    goal: 'Reassurance & human escalation',
    tone: 'Direct & Empathetic',
    product: 'VeloCard Security',
    prompt: 'A customer says: "I see an unauthorized charge of $4,200 on our virtual card that nobody approved. Was our account hacked?!" Draft a safe FinTech response.',
  },
  {
    category: 'Customer Support',
    title: 'Yield Inquiry Response',
    channel: 'Customer Support FAQ',
    audience: 'Prospective Treasurer',
    goal: 'Terms clarification',
    tone: 'Factual & Transparent',
    product: 'VeloYield Treasury',
    prompt: 'A prospective client asks: "Can you guarantee that your 4.85% APY yield will stay fixed for 12 months with zero risk?" Draft our official answer.',
  },
  {
    category: 'Product Matching',
    title: 'Segment Recommendations',
    channel: 'Product Recommendation',
    audience: 'E-commerce & SaaS Companies',
    goal: 'Needs assessment',
    tone: 'Advisory',
    product: 'VeloFin Suite',
    prompt: 'Recommend which VeloFin products best fit a growing e-commerce merchant with $3M annual sales versus an early-stage SaaS startup.',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `### Marketing Content Assistant

I can help generate campaigns, draft customer support responses, and outline product recommendations across customer segments.

**Capabilities:**
- Multi-channel campaigns (Email, Search, LinkedIn, Content)
- Customer support responses with proper safety guidelines and human routing
- Segment-based product recommendations

Select a prompt preset below or enter custom campaign details to begin.`,
    timestamp: 'Just now',
  },
];

export const AgentStudio: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputPrompt, setInputPrompt] = useState('');
  const [channel, setChannel] = useState('Email Campaign');
  const [targetAudience, setTargetAudience] = useState('Startup Founders');
  const [goal, setGoal] = useState('Product Activation');
  const [tone, setTone] = useState('Data-Driven & Concise');
  const [product, setProduct] = useState('VeloYield Treasury (4.85% APY sweep)');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Draft Editor Modal State
  const [editingDraft, setEditingDraft] = useState<{ content: string; title: string; channel: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string, overrideParams?: any) => {
    const promptText = textToSend || inputPrompt;
    if (!promptText.trim() || isLoading) return;

    const currentChannel = overrideParams?.channel || channel;
    const currentAudience = overrideParams?.audience || targetAudience;
    const currentGoal = overrideParams?.goal || goal;
    const currentTone = overrideParams?.tone || tone;
    const currentProduct = overrideParams?.product || product;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      parameters: {
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
        type: 'campaign',
        prompt: promptText,
        parameters: {
          channel: currentChannel,
          targetAudience: currentAudience,
          goal: currentGoal,
          tone: currentTone,
          product: currentProduct,
        },
      });

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parameters: {
          channel: currentChannel,
          targetAudience: currentAudience,
          goal: currentGoal,
          tone: currentTone,
          product: currentProduct,
        },
        safeguardAudit: response.safeguardAudit,
        isSimulated: response.isSimulated,
        modelUsed: response.modelUsed,
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
    setChannel(preset.channel);
    setTargetAudience(preset.audience);
    setGoal(preset.goal);
    setTone(preset.tone);
    setProduct(preset.product);
    handleSendMessage(preset.prompt, {
      channel: preset.channel,
      audience: preset.audience,
      goal: preset.goal,
      tone: preset.tone,
      product: preset.product,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Parameter Controls Bar */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#202938]">Campaign Parameters</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              {channel} · {targetAudience} · {product}
            </p>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md transition self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#667085]" />
            <span>{showConfig ? 'Hide Parameters' : 'Adjust Parameters'}</span>
          </button>
        </div>

        {/* Collapsible Parameter Selectors */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-[#D8E2EA] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[#667085] font-medium mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              >
                <option value="Email Campaign">Email Campaign</option>
                <option value="Paid Ad Copy (LinkedIn & Search)">Paid Search &amp; Social</option>
                <option value="Blog Post Draft">Blog Post Draft</option>
                <option value="Social Media Suite">Social Media Post</option>
                <option value="Customer Support FAQ">Customer Support FAQ</option>
                <option value="Product Recommendation">Product Recommendation</option>
              </select>
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
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md px-2.5 py-1.5 text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white"
              >
                <option value="Data-Driven & Concise">Data-Driven &amp; Concise</option>
                <option value="Conversational & Clear">Conversational &amp; Clear</option>
                <option value="Institutional & Direct">Institutional &amp; Direct</option>
              </select>
            </div>

            <div>
              <label className="block text-[#667085] font-medium mb-1">Campaign Goal</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Schedule Demo"
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
            className="px-2.5 py-1 bg-white hover:bg-[#F3F7FA] text-[#202938] border border-[#D8E2EA] rounded-md transition shrink-0 shadow-2xs"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main Conversation & Output View */}
      <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Messages Stream */}
        <div className="p-6 space-y-6 max-h-[620px] overflow-y-auto">
          {messages.map((message) => (
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
                <span>·</span>
                <span>{message.timestamp}</span>
              </div>

              {/* Message Container */}
              <div
                className={`max-w-3xl rounded-lg p-5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA]'
                    : 'bg-white text-[#202938] border border-[#D8E2EA] w-full shadow-2xs'
                }`}
              >
                {/* User Parameters note if applicable */}
                {message.role === 'user' && message.parameters && (
                  <div className="text-xs text-[#667085] mb-2 pb-2 border-b border-[#D8E2EA] flex flex-wrap gap-2">
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

                {/* Response Actions */}
                {message.role === 'assistant' && message.id !== 'msg-welcome' && (
                  <div className="mt-4 pt-3 border-t border-[#D8E2EA] flex items-center justify-between text-xs text-[#667085]">
                    <span className="text-[11px]">
                      Reviewed against FinTech marketing safeguards.
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
                            title: 'Refine Draft',
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
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg text-xs text-[#667085]">
              <RotateCw className="w-4 h-4 animate-spin text-[#426A8C]" />
              <span className="text-[#202938] font-medium">Generating compliant FinTech draft...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
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
                placeholder="Describe the content you need (e.g., 'Draft LinkedIn ad copy for startup founders highlighting 4.85% variable yield')..."
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
              <span>Channel: {channel} · Audience: {targetAudience}</span>
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
    </div>
  );
};
