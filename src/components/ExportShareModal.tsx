import { useState } from 'react';
import { Share2, Printer, FileText, Download, Check, Copy, X } from 'lucide-react';
import { Plan } from '../types';

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  plans: Plan[];
}

export const ExportShareModal = ({
  isOpen,
  onClose,
  selectedDate,
  plans,
}: ExportShareModalProps) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  if (!isOpen) return null;

  const dayPlans = plans.filter((p) => p.date === selectedDate);
  const shareableUrl = `${window.location.origin}?date=${selectedDate}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const generateMarkdown = () => {
    let md = `# Collaborative Schedule for ${selectedDate}\n\n`;
    if (dayPlans.length === 0) {
      md += `*No plans scheduled for this day.*\n`;
    } else {
      dayPlans.forEach((plan, idx) => {
        md += `## ${idx + 1}. ${plan.title}\n`;
        md += `- **Time**: ${plan.timeStart || 'All Day'} - ${plan.timeEnd || ''}\n`;
        md += `- **Tags**: ${plan.tags.join(', ') || 'None'}\n`;
        md += `- **Created By**: ${plan.createdBy.name}\n`;
        md += `- **Last Edited By**: ${plan.lastEditedBy.name}\n\n`;

        plan.blocks.forEach((block) => {
          if (block.type === 'text') {
            md += `### ${block.title || 'Notes'}\n${block.content}\n\n`;
          } else if (block.type === 'checklist') {
            md += `### ${block.title || 'Checklist'}\n`;
            block.items.forEach((item) => {
              md += `- [${item.done ? 'x' : ' '}] ${item.text}\n`;
            });
            md += `\n`;
          } else if (block.type === 'link') {
            md += `🔗 [${block.title}](${block.url})\n\n`;
          } else if (block.type === 'image') {
            md += `![${block.alt || 'Image'}](${block.url})\n*${block.caption || ''}*\n\n`;
          } else if (block.type === 'video') {
            md += `📹 Video: ${block.url}\n\n`;
          }
        });
        md += `---\n\n`;
      });
    }
    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dayPlans, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `schedule-${selectedDate}.json`);
    dlAnchorElem.click();
  };

  return (
    <div id="export-share-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display text-base">Share & Export Schedule</h3>
              <p className="text-xs text-slate-500">Date: {selectedDate} • {dayPlans.length} plans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Shareable Link Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Workspace Shareable Link</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 select-all focus:outline-none"
              />
              <button
                id="copy-share-link-btn"
                onClick={handleCopyLink}
                className="px-3 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Invited members with this link will open this exact date in real-time.</p>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Print as PDF */}
            <button
              id="export-pdf-btn"
              onClick={handlePrintPdf}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/20 text-left transition-all group flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-lg bg-indigo-50 text-indigo-600 mb-2">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">Print or Save as PDF</span>
                <span className="text-[11px] text-slate-500">Opens browser print dialog configured with clean printable schedule layout.</span>
              </div>
            </button>

            {/* Copy Markdown */}
            <button
              id="export-markdown-btn"
              onClick={handleCopyMarkdown}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/20 text-left transition-all group flex flex-col justify-between"
            >
              <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-600 mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-600">
                  {copiedMd ? 'Copied to Clipboard!' : 'Copy as Markdown'}
                </span>
                <span className="text-[11px] text-slate-500">Formatted headings, notes, and task checkboxes for Notion, Slack, or GitHub.</span>
              </div>
            </button>
          </div>

          {/* Download JSON backup */}
          <div className="pt-2">
            <button
              id="export-json-btn"
              onClick={handleDownloadJson}
              className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Raw Schedule JSON Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
