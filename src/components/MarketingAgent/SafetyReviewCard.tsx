import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Headphones, 
  Info,
  ExternalLink
} from 'lucide-react';
import { SafetyReviewResult, RiskLevel } from '../../types';
import { getRiskLevelBadge } from '../../utils/safetyAuditor';

interface SafetyReviewCardProps {
  review: SafetyReviewResult;
  modeLabel?: string;
  onOpenDetailsModal?: () => void;
}

export const SafetyReviewCard: React.FC<SafetyReviewCardProps> = ({
  review,
  modeLabel,
  onOpenDetailsModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const badge = getRiskLevelBadge(review.riskLevel);

  return (
    <div className={`mt-3.5 pt-3.5 border-t border-[#D8E2EA] rounded-md p-3.5 ${
      review.riskLevel === 'critical'
        ? 'bg-red-50/50 border-red-200'
        : review.riskLevel === 'high'
        ? 'bg-orange-50/40 border-orange-200'
        : review.riskLevel === 'moderate'
        ? 'bg-amber-50/40 border-amber-200'
        : 'bg-[#F8FAFC] border-[#D8E2EA]'
    }`}>
      {/* Prominent OTP / Credential Alert Banner */}
      {review.hasCredentialRisk && (
        <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-md text-red-900 text-xs flex items-start gap-2.5 shadow-2xs animate-fade-in">
          <Lock className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-red-800">
              Never share verification codes or account credentials.
            </div>
            <div className="text-[11px] text-red-700 leading-relaxed">
              VeloFin automated assistants and staff will never request your one-time passcode (OTP), password, or full card details. Sensitive values are safely masked and omitted from responses.
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Human Escalation Recommendation */}
      {review.requiresHumanEscalation && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span className="font-medium text-[11px]">
              Sensitive account issue: Escalation to an accredited human specialist is recommended.
            </span>
          </div>
          <span className="px-2 py-0.5 bg-white border border-rose-200 text-rose-700 rounded text-[10px] font-semibold shrink-0">
            Human Handoff
          </span>
        </div>
      )}

      {/* Main Review Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            {review.riskLevel === 'low' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : review.riskLevel === 'moderate' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs font-bold text-[#202938]">Safety Review:</span>
          </div>

          {/* Safety Score Meter (Higher score = lower detected risk) */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#D8E2EA] rounded text-xs">
            <span className="text-[11px] text-[#667085]">Score:</span>
            <span className="font-bold font-mono text-[#202938]">{review.score}</span>
            <span className="text-[10px] text-[#667085]">/ 100</span>
          </div>

          {/* Risk Level Badge */}
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.badgeBg} ${badge.borderClass}`}>
            {badge.label}
          </span>

          {modeLabel && (
            <span className="text-[11px] text-[#667085] hidden md:inline">
              · Mode: <span className="font-medium text-[#202938]">{modeLabel}</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenDetailsModal && (
            <button
              onClick={onOpenDetailsModal}
              className="text-[11px] font-medium text-[#426A8C] hover:underline flex items-center gap-1 transition"
            >
              <span>Full Audit</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-[#667085] hover:text-[#202938] bg-white border border-[#D8E2EA] px-2 py-1 rounded transition shadow-2xs"
          >
            <span>{isExpanded ? 'Hide Details' : 'Review Details'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Brief Score Factor Explanation */}
      <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
        {review.summary}
      </p>

      {/* Expandable Review Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#D8E2EA]/80 space-y-3">
          {/* Flagged Issues */}
          {review.flaggedIssues.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                Detected Flags &amp; Recommendations ({review.flaggedIssues.length}):
              </div>
              <div className="space-y-1.5">
                {review.flaggedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-2.5 bg-white border border-[#D8E2EA] rounded text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#202938]">{issue.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        issue.severity === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : issue.severity === 'high'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {issue.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#667085]">{issue.explanation}</div>
                    {issue.flaggedPhrase && (
                      <div className="text-[10px] font-mono bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#D8E2EA] text-[#667085] inline-block">
                        Flagged Phrase: <span className="text-red-600 font-semibold">{issue.flaggedPhrase}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-[#426A8C] pt-0.5">
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>No critical policy violations or unauthorized credential requests detected in this draft.</span>
            </div>
          )}

          {/* Core Checks List */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-[#667085] mb-1">
              Standard Compliance Validations:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              {review.checks.map((chk, idx) => (
                <div key={idx} className="flex items-start gap-1.5 p-1.5 bg-white border border-[#D8E2EA] rounded">
                  {chk.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-[#202938]">{chk.name}</div>
                    <div className="text-[10px] text-[#667085]">{chk.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal / Risk Disclaimer Note */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#667085] pt-1">
            <Info className="w-3 h-3 text-[#426A8C] shrink-0" />
            <span>
              The safety score is an automated risk indicator for guidance only, not a legal approval or guarantee that content is safe.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
