import React from 'react';
import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
  onQualify: (id: string) => void;
  onDiscard: (id: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onQualify, onDiscard }) => {
  const isHighIntent = lead.intentScore > 75;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${isHighIntent ? 'bg-gradient-to-br from-brand-500 to-emerald-600' : 'bg-slate-400'}`}>
            {lead.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">{lead.name}</h3>
            <p className="text-xs text-slate-500 flex items-center">
              <i className="fab fa-facebook-square mr-1 flex-shrink-0"></i> 
              <span className="truncate">{lead.sourceGroup}</span>
              {lead.sourceLink && (
                <a 
                    href={lead.sourceLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 flex-shrink-0"
                    title="View original post"
                    onClick={(e) => e.stopPropagation()}
                >
                    <i className="fas fa-external-link-alt text-[10px]"></i> View
                </a>
              )}
            </p>
          </div>
        </div>
        <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${isHighIntent ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
          {lead.intentScore}% Intent
        </div>
      </div>
      
      <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p className="text-sm text-slate-600 italic">"{lead.painPoint}"</p>
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={() => onDiscard(lead.id)}
          className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Discard
        </button>
        <button 
          onClick={() => onQualify(lead.id)}
          className="flex-1 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm shadow-brand-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <i className="fas fa-magic"></i> Generate Pitch
        </button>
      </div>
    </div>
  );
};