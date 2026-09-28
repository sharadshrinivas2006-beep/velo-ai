import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  Headphones, 
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { SafetyReviewResult, RiskLevel, WritingMode } from '../../types';
import { getRiskLevelBadge, WRITING_MODES } from '../../utils/safetyAuditor';

interface SafetyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: SafetyReviewResult | null;
  mode?: WritingMode;
  dateStr?: string;
}

export const SafetyReviewModal: React.FC<SafetyReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  mode,
  dateStr,
}) => {
  if (!isOpen || !review) return null;

  const badge = getRiskLevelBadge(review.riskLevel);
  const modeConfig = mode ? WRITING_MODES[mode] : undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white border border-[#D8E2EA] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2EA] bg-white">
          <div className="flex items-center gap-2.5">
            {review.riskLevel === 'low' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : review.riskLevel === 'moderate' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h2 className="text-base font-bold text-[#202938]">
                Content Safety Audit Details
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#667085] mt-0.5">
                {modeConfig && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${modeConfig.tagClass}`}>
                    {modeConfig.label}
                  </span>
                )}
                {dateStr && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#202938] rounded-md hover:bg-[#F8FAFC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Prominent Credential Alert */}
          {review.hasCredentialRisk && (
            <div className="p-3.5 bg-red-100 border border-red-300 rounded-lg text-xs text-red-900 space-y-1">
              <div className="font-bold flex items-center gap-2 text-red-800 text-sm">
                <Lock className="w-4 h-4 text-red-700" />
                Never share verification codes or account credentials.
              </div>
              <p className="text-[11px] text-red-700 leading-relaxed pl-6">
                VeloFin staff will never ask for your verification code or login password. Sensitive credentials are automatically masked to safeguard customer security.
              </p>
            </div>
          )}

          {/* Sensitive Human Escalation Alert */}
          {review.requiresHumanEscalation && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2.5">
              <Headphones className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Human Specialist Escalation Required: </span>
                This request or inquiry involves sensitive security, disputes, or account status issues. Automated responses should de-escalate and route directly to accredited human compliance personnel.
              </div>
            </div>
          )}

          {/* Score & Risk Level Metric Summary Card */}
          <div className="p-4 bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-[#667085] font-medium">Automated Safety Score</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-[#202938]">{review.score}</span>
                <span className="text-xs text-[#667085]">/ 100</span>
                <span className="text-xs text-[#667085] ml-1">(Higher score = lower detected risk)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded text-xs font-semibold border ${badge.badgeBg} ${badge.borderClass}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Score Explanation */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#202938]">Score Evaluation Summary</div>
            <p className="text-xs text-[#667085] leading-relaxed">
              {review.summary}
            </p>
          </div>

          {/* Safely Masked Prompt & Excerpt */}
          <div className="space-y-2 pt-2 border-t border-[#D8E2EA]">
            <div className="text-xs font-semibold text-[#202938]">Safely Masked Content Excerpt</div>
            {review.maskedUserPrompt && (
              <div className="p-2.5 bg-[#F8FAFC] border border-[#D8E2EA] rounded text-xs font-mono text-[#202938] leading-relaxed">
                <span className="text-[#667085] font-sans font-semibold block text-[11px] mb-1">Original Prompt (Redacted):</span>
                {review.maskedUserPrompt}
              </div>
            )}
            {review.maskedResponseExcerpt && (
              <div className="p-2.5 bg-white border border-[#D8E2EA] rounded text-xs text-[#202938] leading-relaxed">
                <span className="text-[#667085] font-semibold block text-[11px] mb-1">Generated Output Excerpt:</span>
                {review.maskedResponseExcerpt}
              </div>
            )}
          </div>

          {/* Flagged Issues List */}
          {review.flaggedIssues.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#D8E2EA]">
              <div className="text-xs font-semibold text-[#202938]">
                Detected Flags &amp; Remediation ({review.flaggedIssues.length}):
              </div>
              <div className="space-y-2">
                {review.flaggedIssues.map((issue) => (
                  <div key={issue.id} className="p-3 bg-white border border-[#D8E2EA] rounded-md text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#202938]">{issue.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F8FAFC] border border-[#D8E2EA] text-[#667085]">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085]">{issue.explanation}</p>
                    {issue.flaggedPhrase && (
                      <div className="text-[11px] font-mono bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200">
                        Snippet: {issue.flaggedPhrase}
                      </div>
                    )}
                    <div className="text-[11px] text-[#426A8C]">
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Checks */}
          <div className="space-y-2 pt-2 border-t border-[#D8E2EA]">
            <div className="text-xs font-semibold text-[#202938]">Validation Check Details</div>
            <div className="space-y-1.5">
              {review.checks.map((chk, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-[#F8FAFC] border border-[#D8E2EA] rounded text-xs">
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-[#202938]">{chk.name}</div>
                    <div className="text-[11px] text-[#667085]">{chk.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Transparency Note */}
          <div className="p-3 bg-[#EAF0F5] border border-[#D8E2EA] rounded-md text-[11px] text-[#202938] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#426A8C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#426A8C]">Compliance Guidance Note: </span>
              The safety score is an automated risk indicator for guidance only, not a legal approval or guarantee that content is safe. All marketing content should be reviewed prior to commercial deployment.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#D8E2EA] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
