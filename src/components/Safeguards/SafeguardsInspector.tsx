import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { requestSafeguardAudit } from '../../services/api';
import { SafeguardAuditResult } from '../../types';

const TEST_SCENARIOS = [
  {
    name: 'Guaranteed 14% Return Claim',
    text: 'Put your startup treasury into our VeloYield account for a guaranteed 14% risk-free return with surefire profits and zero loss risk!',
    note: 'Tests detection of prohibited return guarantees.',
  },
  {
    name: 'Individual Financial & Tax Advice',
    text: 'You should personally invest 80% of your remaining runway into municipal bonds and reduce your corporate tax liability immediately.',
    note: 'Tests prevention of personalized financial advice.',
  },
  {
    name: 'Sensitive PII Credentials',
    text: 'To verify your identity for this promotional yield, please reply with your SSN: 042-55-9182 and card number 4111 2222 3333 4444.',
    note: 'Tests detection of personal identifiable information.',
  },
  {
    name: 'Urgent Fraud Inquiry (Routing)',
    text: 'A customer says their account was frozen and card stolen. Our bot tells them: "Don\'t worry, our system never makes mistakes, please wait 30 days."',
    note: 'Tests requirement for human escalation in sensitive cases.',
  },
  {
    name: 'Compliant Yield Marketing Copy',
    text: 'Earn an illustrative 4.85% variable APY with automated sweep across FDIC-member partner banks up to $5M. Rates fluctuate with market conditions. Subject to program terms.',
    note: 'Tests compliant product copy with variable disclaimers.',
  },
];

export const SafeguardsInspector: React.FC = () => {
  const [inputText, setInputText] = useState(TEST_SCENARIOS[4].text);
  const [auditResult, setAuditResult] = useState<SafeguardAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = async (textToAudit: string) => {
    setIsAuditing(true);
    try {
      const res = await requestSafeguardAudit(textToAudit);
      setAuditResult(res);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    runAudit(inputText);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-[#202938]">Financial Content Safeguards</h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Validation rules enforced across all generated marketing content and customer responses.
        </p>
      </div>

      {/* 5 Safeguard Policies Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-[#D8E2EA] shadow-2xs">
          <div className="font-semibold text-[#202938] text-xs">1. No Guaranteed Yields</div>
          <p className="text-xs text-[#667085] mt-1 leading-normal">
            Prohibits promises of fixed high returns or risk-free gains. All rates must be identified as variable.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-[#D8E2EA] shadow-2xs">
          <div className="font-semibold text-[#202938] text-xs">2. No Personalized Advice</div>
          <p className="text-xs text-[#667085] mt-1 leading-normal">
            Restricts individual tax or investment counsel. Encourages independent professional advisory review.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-[#D8E2EA] shadow-2xs">
          <div className="font-semibold text-[#202938] text-xs">3. Privacy &amp; PII Shield</div>
          <p className="text-xs text-[#667085] mt-1 leading-normal">
            Filters out Social Security Numbers, unmasked credit card numbers, and private credentials.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-[#D8E2EA] shadow-2xs">
          <div className="font-semibold text-[#202938] text-xs">4. Safe Human Routing</div>
          <p className="text-xs text-[#667085] mt-1 leading-normal">
            Sensitive inquiries (disputes, fraud, frozen funds) provide clear escalation to human representatives.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-[#D8E2EA] shadow-2xs">
          <div className="font-semibold text-[#202938] text-xs">5. Clear Disclosures</div>
          <p className="text-xs text-[#667085] mt-1 leading-normal">
            Labels terms, sweep coverage limitations, and variable benchmark APY parameters transparently.
          </p>
        </div>
      </div>

      {/* Interactive Testing Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Test Presets */}
        <div className="lg:col-span-7 bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#202938]">
              Content Safeguards Reviewer
            </label>
            <span className="text-xs text-[#667085]">
              Enter text or pick a test scenario
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            placeholder="Enter promotional copy or customer support message to inspect safeguards..."
            className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md p-3 text-xs sm:text-sm text-[#202938] placeholder-[#667085] focus:outline-none focus:ring-1 focus:ring-[#426A8C] leading-relaxed font-mono"
          />

          <div className="flex justify-end">
            <button
              onClick={() => runAudit(inputText)}
              disabled={isAuditing || !inputText.trim()}
              className="px-4 py-2 bg-[#426A8C] hover:bg-[#355571] disabled:opacity-50 text-white font-medium rounded-md text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              {isAuditing ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Run Safeguard Audit</span>
            </button>
          </div>

          {/* Test Presets */}
          <div className="pt-3 border-t border-[#D8E2EA] space-y-2">
            <div className="text-xs font-medium text-[#667085]">
              Test Scenarios:
            </div>
            <div className="space-y-1.5">
              {TEST_SCENARIOS.map((scen, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(scen.text);
                    runAudit(scen.text);
                  }}
                  className="w-full text-left p-2.5 rounded-md bg-white hover:bg-[#F3F7FA] border border-[#D8E2EA] text-xs transition flex items-center justify-between shadow-2xs"
                >
                  <div className="pr-3">
                    <div className="font-medium text-[#202938]">
                      {scen.name}
                    </div>
                    <div className="text-[11px] text-[#667085] mt-0.5">
                      {scen.note}
                    </div>
                  </div>
                  <span className="text-xs text-[#426A8C] font-semibold shrink-0">
                    Test →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scorecard & Checks */}
        <div className="lg:col-span-5 bg-white border border-[#D8E2EA] rounded-lg p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E2EA]">
              <h3 className="text-sm font-semibold text-[#202938]">Compliance Assessment</h3>
              {auditResult && (
                <span className="text-xs font-semibold text-[#426A8C]">
                  Score: {auditResult.score}/100
                </span>
              )}
            </div>

            {auditResult ? (
              <div className="mt-3 space-y-2.5">
                {auditResult.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md border border-[#D8E2EA] bg-[#F8FAFC] text-xs"
                  >
                    <div className="flex items-center justify-between font-medium">
                      <div className="flex items-center gap-1.5 text-[#202938]">
                        {check.passed ? (
                          <Check className="w-3.5 h-3.5 text-[#426A8C] shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        )}
                        <span>{check.name}</span>
                      </div>
                      <span className={`text-[11px] font-semibold ${
                        check.passed ? 'text-[#426A8C]' : 'text-amber-700'
                      }`}>
                        {check.passed ? 'Passed' : 'Flagged'}
                      </span>
                    </div>
                    <div className="text-[#667085] text-[11px] mt-1 pl-5">
                      {check.explanation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[#667085] text-xs">
                Auditing content...
              </div>
            )}
          </div>

          <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#D8E2EA] text-[11px] text-[#667085] leading-normal">
            Content generated across campaigns automatically attaches relevant disclosures regarding variable APY terms, FDIC partner coverage limits, and liquidity rules.
          </div>
        </div>
      </div>
    </div>
  );
};
