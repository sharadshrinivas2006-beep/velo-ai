import React, { useState } from 'react';
import { 
  X, 
  RotateCw, 
  Copy, 
  Check, 
  Download, 
  Send
} from 'lucide-react';
import { requestMarketingAgent, requestSafeguardAudit } from '../../services/api';
import { SafeguardAuditResult } from '../../types';

interface DraftEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  title?: string;
  channel?: string;
  onSave?: (newContent: string) => void;
}

export const DraftEditorModal: React.FC<DraftEditorModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  title = 'Edit Campaign Draft',
  channel = 'Email Campaign',
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customRefinement, setCustomRefinement] = useState('');
  const [auditResult, setAuditResult] = useState<SafeguardAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/\s+/g, '-')}-draft.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRegenerateWithModifier = async (modifier: string) => {
    setIsRegenerating(true);
    try {
      const response = await requestMarketingAgent({
        type: 'refine',
        prompt: `Here is the current draft:\n${content}\n\nPlease regenerate and refine this draft with this directive: ${modifier}. Maintain accurate FinTech compliance and disclaimers.`,
        parameters: { channel },
      });

      if (response && response.content) {
        const newHistory = [...history.slice(0, historyIndex + 1), response.content];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setContent(response.content);
        if (response.safeguardAudit) {
          setAuditResult(response.safeguardAudit);
        }
      }
    } catch (err) {
      console.error('Refine failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await requestSafeguardAudit(content);
      setAuditResult(result);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRevert = (index: number) => {
    setHistoryIndex(index);
    setContent(history[index]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white border border-[#D8E2EA] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2EA] bg-white">
          <div>
            <h3 className="text-sm font-semibold text-[#202938] flex items-center gap-2">
              {title}
              <span className="text-xs text-[#667085] font-normal">· {channel}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-[#667085] mr-2">
                <span>Version {historyIndex + 1} of {history.length}</span>
                <div className="flex gap-1">
                  {history.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleRevert(i)}
                      className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-medium ${
                        i === historyIndex
                          ? 'bg-[#426A8C] text-white'
                          : 'bg-[#EAF0F5] text-[#202938] hover:bg-[#D8E2EA]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] transition"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#426A8C]" /> : <Copy className="w-3.5 h-3.5 text-[#667085]" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#202938] bg-[#F8FAFC] hover:bg-[#EAF0F5] border border-[#D8E2EA] transition"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5 text-[#667085]" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#667085] hover:text-[#202938] rounded-md hover:bg-[#F8FAFC] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Refinements Toolbar */}
        <div className="px-6 py-2 border-b border-[#D8E2EA] bg-[#F8FAFC] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#667085] font-medium text-xs">Quick edits:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              disabled={isRegenerating}
              onClick={() => handleRegenerateWithModifier('Make this draft more concise and direct while retaining essential points.')}
              className="px-2 py-1 rounded bg-white hover:bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA] text-xs transition disabled:opacity-50"
            >
              Shorten
            </button>
            <button
              disabled={isRegenerating}
              onClick={() => handleRegenerateWithModifier('Reinforce compliance disclaimers and clearly identify variable APY terms.')}
              className="px-2 py-1 rounded bg-white hover:bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA] text-xs transition disabled:opacity-50"
            >
              Strengthen Disclaimers
            </button>
            <button
              disabled={isRegenerating}
              onClick={() => handleRegenerateWithModifier('Adopt an analytical, data-focused tone emphasizing cash runway.')}
              className="px-2 py-1 rounded bg-white hover:bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA] text-xs transition disabled:opacity-50"
            >
              Data-Driven Tone
            </button>
            <button
              disabled={isRegenerating}
              onClick={() => handleRegenerateWithModifier('Clarify the call to action with simple next steps.')}
              className="px-2 py-1 rounded bg-white hover:bg-[#EAF0F5] text-[#202938] border border-[#D8E2EA] text-xs transition disabled:opacity-50"
            >
              Clearer CTA
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#202938]">
                Draft Content
              </label>
              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="text-xs text-[#426A8C] hover:underline font-medium transition"
              >
                {isAuditing ? 'Checking...' : 'Check Safeguards'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg p-3 text-xs sm:text-sm text-[#202938] font-sans focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white transition leading-relaxed resize-y"
            />
          </div>

          {/* Formatted Preview Box */}
          <div className="p-4 rounded-lg bg-white border border-[#D8E2EA]">
            <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
              Preview
            </div>
            <div className="text-[#202938] text-xs sm:text-sm leading-relaxed">
              {content.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-2" />;
                if (trimmed.startsWith('#')) {
                  const heading = trimmed.replace(/^#+\s*/, '').replace(/^[🛡️📈💡🎯✉️📝📱📊⚠️]\s*/, '');
                  return <h3 key={lIdx} className="text-sm font-semibold text-[#202938] mt-2 mb-1">{heading}</h3>;
                }
                if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                  return (
                    <li key={lIdx} className="ml-4 list-disc text-[#202938] text-xs sm:text-sm my-0.5">
                      {trimmed.replace(/^[-•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                    </li>
                  );
                }
                return (
                  <p key={lIdx} className="my-1 text-xs sm:text-sm text-[#202938]">
                    {trimmed.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Compliance Audit Feedback Panel */}
          {auditResult && (
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#D8E2EA] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#202938]">
                  Safeguards Review: {auditResult.score}/100
                </span>
                <span className="text-xs text-[#667085]">
                  {auditResult.passed ? 'Meets guidelines' : 'Review flags below'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {auditResult.checks.map((check, idx) => (
                  <div key={idx} className="p-2 rounded bg-white border border-[#D8E2EA]">
                    <div className="flex items-center justify-between font-medium text-[#202938] text-[11px]">
                      <span>{check.name}</span>
                      <span className={check.passed ? 'text-[#426A8C]' : 'text-amber-700'}>
                        {check.passed ? 'Passed' : 'Flagged'}
                      </span>
                    </div>
                    <div className="text-[#667085] text-[10px] mt-0.5">{check.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Instruction Box */}
          <div>
            <label className="block text-xs font-medium text-[#667085] mb-1">
              Custom adjustment:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customRefinement}
                onChange={(e) => setCustomRefinement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customRefinement.trim()) {
                    handleRegenerateWithModifier(customRefinement);
                    setCustomRefinement('');
                  }
                }}
                placeholder="e.g. Highlight multi-bank sweep coverage..."
                className="flex-1 bg-white border border-[#D8E2EA] rounded-md px-3 py-1.5 text-xs text-[#202938] placeholder-[#667085] focus:outline-none focus:ring-1 focus:ring-[#426A8C]"
              />
              <button
                disabled={isRegenerating || !customRefinement.trim()}
                onClick={() => {
                  if (customRefinement.trim()) {
                    handleRegenerateWithModifier(customRefinement);
                    setCustomRefinement('');
                  }
                }}
                className="px-3.5 py-1.5 bg-[#426A8C] hover:bg-[#355571] disabled:opacity-50 text-white font-medium rounded-md text-xs flex items-center gap-1 transition"
              >
                {isRegenerating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#D8E2EA] bg-[#F8FAFC] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#667085] hover:text-[#202938] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onSave) onSave(content);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#426A8C] hover:bg-[#355571] rounded-md transition shadow-sm"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
};
