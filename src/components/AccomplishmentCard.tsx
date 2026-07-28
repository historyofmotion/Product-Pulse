import React, { useState } from 'react';
import {
  Trash2,
  Edit2,
  Check,
  X,
  Mic,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Accomplishment, Project } from '../types';
import { formatTimeAgo, formatDateTime, formatSmartDate } from '../utils/dateUtils';

interface AccomplishmentCardProps {
  accomplishment: Accomplishment;
  project?: Project;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
}

export const AccomplishmentCard: React.FC<AccomplishmentCardProps> = ({
  accomplishment,
  project,
  onDelete,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(accomplishment.content);

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(accomplishment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Render text with clickable links
  const renderFormattedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3 shrink-0 inline" />
            <span>{part.replace(/^https?:\/\/(www\.)?/, '')}</span>
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all duration-200 hover:border-slate-700">
      <div className="flex items-start justify-between gap-3 mb-2">
        
        {/* Project Name & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {project && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              {project.name}
            </span>
          )}

          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {accomplishment.tag}
          </span>

          {accomplishment.impact !== 'Standard' && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getImpactBadge(
                accomplishment.impact
              )}`}
            >
              {accomplishment.impact} Impact
            </span>
          )}

          {accomplishment.originalSpeechRaw && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700"
              title="Recorded via Voice input"
            >
              <Mic className="w-3 h-3 text-indigo-400" />
              <span>Voice</span>
            </span>
          )}
        </div>

        {/* Card Action Icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit Note"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onDelete(accomplishment.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Text / Edit Mode */}
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-indigo-500 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-200 leading-relaxed pl-0.5 whitespace-pre-wrap">
          {renderFormattedText(accomplishment.content)}
        </p>
      )}

      {/* Timestamp Footer */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
        <span className="flex items-center gap-1 font-medium text-slate-400">
          <Clock className="w-3 h-3 text-indigo-400" />
          {formatSmartDate(accomplishment.createdAt)}
        </span>
        <span className="hidden sm:inline" title={accomplishment.createdAt}>
          {formatDateTime(accomplishment.createdAt)}
        </span>
      </div>
    </div>
  );
};
