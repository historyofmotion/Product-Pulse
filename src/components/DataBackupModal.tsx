import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Project, Accomplishment, WeekRecord } from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  accomplishments: Accomplishment[];
  weekRecords: WeekRecord[];
  onImportData: (data: { projects: Project[]; accomplishments: Accomplishment[]; weekRecords?: WeekRecord[] }) => void;
  onResetToSampleData: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  projects,
  accomplishments,
  weekRecords,
  onImportData,
  onResetToSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects,
      accomplishments,
      weekRecords,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `weekly_status_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects && json.accomplishments) {
          onImportData({
            projects: json.projects,
            accomplishments: json.accomplishments,
            weekRecords: json.weekRecords || [],
          });
          setImportStatus('Successfully imported status data!');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus('Invalid JSON backup file structure.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Backup & Data Portability
              </h2>
              <p className="text-xs text-slate-400">
                Export or restore your weekly status records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {importStatus && (
            <div className="p-3 bg-indigo-950/50 border border-indigo-500/50 text-indigo-200 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Export JSON */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-200">Export Backup (JSON)</h3>
            <p className="text-xs text-slate-400">
              Download your entire history of projects and accomplishments as a portable JSON file.
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full mt-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-200">Import Data</h3>
            <p className="text-xs text-slate-400">
              Restore previously exported JSON backup files into your workspace.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Upload Backup File</span>
            </button>
          </div>

          {/* Load Sample Demo Data */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-200">Demo Sample Data</h3>
            <p className="text-xs text-slate-400">
              Populate workspace with sample active projects and pre-loaded weekly accomplishments.
            </p>
            <button
              onClick={() => {
                onResetToSampleData();
                onClose();
              }}
              className="w-full mt-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Load Sample Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
