import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { UserCampaign } from '../../types';
import { 
  exportCampaignsToCSV, 
  parseCampaignsFromCSV, 
  CSV_TEMPLATE_CONTENT 
} from '../../utils/analyticsCalculations';

interface CsvImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: UserCampaign[];
  onImport: (newCampaigns: UserCampaign[], mode: 'append' | 'replace') => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'template' | 'export'>('import');
  const [csvText, setCsvText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [copied, setCopied] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedPreview, setParsedPreview] = useState<UserCampaign[] | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      const res = parseCampaignsFromCSV(content);
      setParsedPreview(res.campaigns);
      setParseErrors(res.errors);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    if (text.trim().length > 10) {
      const res = parseCampaignsFromCSV(text);
      setParsedPreview(res.campaigns);
      setParseErrors(res.errors);
    } else {
      setParsedPreview(null);
      setParseErrors([]);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'velofin-campaign-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportData = () => {
    const csvData = exportCampaignsToCSV(campaigns);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `velofin-campaigns-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(CSV_TEMPLATE_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    onImport(parsedPreview, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white border border-[#D8E2EA] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2EA] bg-white">
          <div>
            <h2 className="text-base font-bold text-[#202938]">
              CSV Import &amp; Export
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Bulk import or export campaign performance figures via comma-separated values.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#202938] rounded-md hover:bg-[#F8FAFC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#D8E2EA] bg-[#F8FAFC] flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-[#426A8C] text-[#426A8C] font-semibold'
                : 'border-transparent text-[#667085] hover:text-[#202938]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'border-[#426A8C] text-[#426A8C] font-semibold'
                : 'border-transparent text-[#667085] hover:text-[#202938]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Format &amp; Template</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#426A8C] text-[#426A8C] font-semibold'
                : 'border-transparent text-[#667085] hover:text-[#202938]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ({campaigns.length} campaigns)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* File upload box */}
              <div className="border-2 border-dashed border-[#D8E2EA] hover:border-[#426A8C] rounded-lg p-5 text-center transition bg-[#F8FAFC] cursor-pointer">
                <input
                  type="file"
                  id="csvFileInput"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="csvFileInput" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-[#426A8C] mx-auto mb-1.5" />
                  <div className="text-xs font-semibold text-[#202938]">
                    Click to select a .csv file from your computer
                  </div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    Or paste raw CSV text into the box below
                  </div>
                </label>
              </div>

              {/* Textarea for direct paste */}
              <div>
                <label className="block text-xs font-medium text-[#202938] mb-1">
                  Or paste CSV text directly:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={5}
                  placeholder={`Campaign Name,Channel,Reporting Date,Ad Spend,Impressions,Clicks,Website Visits,New Customers,Attributed Revenue,Email Delivered,Email Opens,Estimated LTV,Target Audience,Product,Status\n"Search Campaign","Paid Search","2026-09-20",5000,100000,3200,2800,35,22500,,,2400,"FinTech CFOs","VeloYield Treasury","Active"`}
                  className="w-full bg-[#F8FAFC] border border-[#D8E2EA] rounded-md p-2.5 text-xs font-mono text-[#202938] focus:outline-none focus:ring-1 focus:ring-[#426A8C] focus:bg-white leading-relaxed resize-y"
                />
              </div>

              {/* Parsing status & preview */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    Validation Issues ({parseErrors.length})
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                    {parseErrors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li>...and {parseErrors.length - 5} more errors.</li>
                    )}
                  </ul>
                </div>
              )}

              {parsedPreview && parsedPreview.length > 0 && (
                <div className="p-3 bg-[#EAF0F5] border border-[#D8E2EA] rounded-md text-xs text-[#202938] space-y-2">
                  <div className="font-semibold text-[#426A8C] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Ready to import {parsedPreview.length} valid campaign{parsedPreview.length === 1 ? '' : 's'}
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <span className="font-medium text-[#667085]">Import action:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-[#426A8C] focus:ring-[#426A8C]"
                      />
                      <span>Add to existing campaigns</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-[#426A8C] focus:ring-[#426A8C]"
                      />
                      <span>Replace existing campaigns</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEMPLATE & FORMAT SPECIFICATION */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#202938]">Required CSV Column Structure</h3>
                  <p className="text-[11px] text-[#667085]">Column names are case-insensitive. Numeric columns must contain non-negative numbers.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyTemplate}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#202938] bg-white hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#426A8C]" /> : <Copy className="w-3.5 h-3.5 text-[#667085]" />}
                    <span>{copied ? 'Copied' : 'Copy Template'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] rounded-md transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .CSV</span>
                  </button>
                </div>
              </div>

              {/* Specification Table */}
              <div className="overflow-x-auto border border-[#D8E2EA] rounded-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#667085] font-semibold border-b border-[#D8E2EA]">
                    <tr>
                      <th className="px-3 py-2">Column Header</th>
                      <th className="px-2 py-2">Required?</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-3 py-2">Description &amp; Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E2EA] text-[#202938]">
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Campaign Name</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Text</td>
                      <td className="px-3 py-2 text-[#667085]">Title of campaign (e.g. "Q3 Treasury Search Ads")</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Channel</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Text</td>
                      <td className="px-3 py-2 text-[#667085]">Paid Search, LinkedIn B2B, Paid Social, Email Nurture, Content/SEO, Referral</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Reporting Date</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Date (YYYY-MM-DD)</td>
                      <td className="px-3 py-2 text-[#667085]">Date of performance record (e.g. 2026-09-24)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Ad Spend</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Number (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Total advertising expenditure in USD (e.g. 5000)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Impressions</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Integer (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Ad impressions delivered (e.g. 120000)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Clicks</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Integer (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Total link/ad clicks (e.g. 3800)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Website Visits</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Integer (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Visits landing on the site (e.g. 3400)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">New Customers</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Integer (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Activated/funded accounts acquired (e.g. 42)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Attributed Revenue</td>
                      <td className="px-2 py-2 text-red-600 font-medium">Required</td>
                      <td className="px-2 py-2 text-[#667085]">Number (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Attributed gross revenue in USD (e.g. 28000)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Email Delivered</td>
                      <td className="px-2 py-2 text-[#667085]">Optional</td>
                      <td className="px-2 py-2 text-[#667085]">Integer (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Emails successfully delivered (e.g. 10000)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Email Opens</td>
                      <td className="px-2 py-2 text-[#667085]">Optional</td>
                      <td className="px-2 py-2 text-[#667085]">Integer (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Email unique opens (e.g. 2850)</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#426A8C]">Estimated LTV</td>
                      <td className="px-2 py-2 text-[#667085]">Optional</td>
                      <td className="px-2 py-2 text-[#667085]">Number (≥ 0)</td>
                      <td className="px-3 py-2 text-[#667085]">Estimated Customer Lifetime Value in USD (e.g. 2400)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sample preview box */}
              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1">
                  Sample CSV Data Preview:
                </label>
                <pre className="p-3 bg-[#F8FAFC] border border-[#D8E2EA] rounded-md text-[11px] font-mono text-[#202938] overflow-x-auto whitespace-pre">
                  {CSV_TEMPLATE_CONTENT}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#202938]">Export Current Campaigns</h3>
                <p className="text-[11px] text-[#667085]">Download all currently entered campaign figures as a standard CSV spreadsheet file.</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#D8E2EA] rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#202938]">
                    {campaigns.length} Campaign Record{campaigns.length === 1 ? '' : 's'}
                  </div>
                  <div className="text-[11px] text-[#667085] mt-0.5">
                    Includes all entered spend, conversion, traffic, and revenue figures.
                  </div>
                </div>

                <button
                  onClick={handleExportData}
                  disabled={campaigns.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] disabled:opacity-50 rounded-md transition shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#D8E2EA] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-[11px] text-[#667085]">
            Campaign data is processed securely client-side in your browser.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#667085] hover:text-[#202938] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-md transition"
            >
              Close
            </button>
            {activeTab === 'import' && (
              <button
                onClick={executeImport}
                disabled={!parsedPreview || parsedPreview.length === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#426A8C] hover:bg-[#355571] disabled:opacity-50 rounded-md shadow-sm transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import {parsedPreview?.length || 0} Campaign{parsedPreview?.length === 1 ? '' : 's'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
