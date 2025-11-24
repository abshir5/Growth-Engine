
import React, { useState } from 'react';
import { Lead, GeneratedContent, AffiliateProduct, ViewState, ContentTemplate } from './types';
import { findPotentialLeads, generatePersuasivePost } from './services/geminiService';
import { LeadCard } from './components/LeadCard';
import { ContentGenerator } from './components/ContentGenerator';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>('settings');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<AffiliateProduct>({
    name: '',
    description: '',
    link: '',
    niche: '',
    keywords: '',
    negativeKeywords: ''
  });
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');

  // --- Handlers ---

  const handleStartScan = async () => {
    if (!product.niche || !product.name) return;
    setLoading(true);
    // Simulate finding 70 leads by asking for a representative batch of 6 for the UI
    const newLeads = await findPotentialLeads(
      product.niche, 
      product.keywords || "", 
      product.negativeKeywords || "", 
      6
    );
    setLeads(newLeads);
    setLoading(false);
    setView('leads');
  };

  const handleQualifyLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Update status
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'qualified' } : l));
    
    // Generate content
    setLoading(true);
    const contentPartial = await generatePersuasivePost(product, lead);
    setLoading(false);

    if (contentPartial.headline && contentPartial.body) {
      const newContent: GeneratedContent = {
        id: `content-${Date.now()}`,
        headline: contentPartial.headline,
        body: contentPartial.body,
        affiliateLink: product.link,
        targetLeadId: lead.id,
        type: 'post',
        createdAt: Date.now()
      };
      setContents(prev => [newContent, ...prev]);
      setSelectedContentId(newContent.id);
      setView('content');
    }
  };

  const handleDiscardLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  const handleUpdateContent = (id: string, updates: Partial<GeneratedContent>) => {
    setContents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSaveTemplate = (content: GeneratedContent) => {
    const newTemplate: ContentTemplate = {
      id: `tpl-${Date.now()}`,
      name: content.headline.length > 30 ? content.headline.substring(0, 30) + '...' : content.headline,
      headline: content.headline,
      body: content.body,
      createdAt: Date.now()
    };
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleUseTemplate = (template: ContentTemplate) => {
    const newContent: GeneratedContent = {
      id: `content-tpl-${Date.now()}`,
      headline: template.headline,
      body: template.body,
      affiliateLink: product.link,
      type: 'post',
      createdAt: Date.now()
    };
    setContents(prev => [newContent, ...prev]);
    setSelectedContentId(newContent.id);
    setView('content');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const activeContent = contents.find(c => c.id === selectedContentId);

  // --- Render Helpers ---

  const renderSidebar = () => (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">Affiliate<span className="text-brand-500">AI</span></h1>
        <p className="text-xs text-slate-500 mt-1">Growth Engine v1.0</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <button onClick={() => setView('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-chart-line w-5 text-center"></i>
          <span>Dashboard</span>
        </button>
        <button onClick={() => setView('leads')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'leads' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-users w-5 text-center"></i>
          <span className="flex-1 text-left">Leads</span>
          {leads.filter(l => l.status === 'new').length > 0 && (
             <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full">{leads.filter(l => l.status === 'new').length}</span>
          )}
        </button>
        <button onClick={() => setView('content')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'content' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-pen-nib w-5 text-center"></i>
          <span>Content</span>
        </button>
        <button onClick={() => setView('templates')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'templates' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-file-alt w-5 text-center"></i>
          <span>Templates</span>
        </button>
        <button onClick={() => setView('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === 'settings' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-cog w-5 text-center"></i>
          <span>Configuration</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded p-3 text-xs">
          <p className="text-slate-400 mb-1">Active Product</p>
          <p className="text-white font-medium truncate">{product.name || 'Not Configured'}</p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-emerald-700 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Configure Your Campaign</h2>
          <p className="text-brand-100">Tell the AI what you're selling and who needs it.</p>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Affiliate Product Name</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="e.g. ClickFunnels, KetoCustomPlan, Jasper.ai"
              value={product.name}
              onChange={(e) => setProduct({...product, name: e.target.value})}
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Product Description</label>
             <textarea 
               className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none"
               placeholder="Briefly describe what it does and the main benefit..."
               value={product.description}
               onChange={(e) => setProduct({...product, description: e.target.value})}
             />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Affiliate Link</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="https://..."
                  value={product.link}
                  onChange={(e) => setProduct({...product, link: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Niche</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g. Digital Marketing, Dog Training"
                  value={product.niche}
                  onChange={(e) => setProduct({...product, niche: e.target.value})}
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keywords (Optional)</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g. organic, beginner, urgent"
                  value={product.keywords || ''}
                  onChange={(e) => setProduct({...product, keywords: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Negative Keywords (Optional)</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g. free, cheap, job"
                  value={product.negativeKeywords || ''}
                  onChange={(e) => setProduct({...product, negativeKeywords: e.target.value})}
                />
             </div>
          </div>

          <button 
            onClick={handleStartScan}
            disabled={!product.name || !product.niche || loading}
            className={`w-full py-4 text-lg font-bold rounded-lg transition-all shadow-lg ${
                !product.name || !product.niche ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-brand-200/50'
            }`}
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> Initializing AI Scanners...
                </span>
            ) : "Save & Start Scanning"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">Detected Prospects</h2>
           <p className="text-slate-500 mt-1">AI found {leads.length} potential buyers in the "{product.niche}" niche today.</p>
        </div>
        <button 
          onClick={handleStartScan}
          disabled={loading}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
        >
          {loading ? <i className="fas fa-spin fa-spinner"></i> : <i className="fas fa-sync-alt mr-2"></i>}
          Refresh Daily List
        </button>
      </div>

      {loading && (
         <div className="text-center py-20">
             <div className="animate-spin w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-4"></div>
             <p className="text-slate-500">Scanning Facebook Groups & Analyzing Intent...</p>
         </div>
      )}

      {!loading && leads.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
              <i className="fas fa-search text-4xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No leads found yet. Start a scan in settings.</p>
              <button onClick={() => setView('settings')} className="mt-4 text-brand-600 font-bold hover:underline">Go to Settings</button>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.filter(l => l.status === 'new').map(lead => (
            <LeadCard 
                key={lead.id} 
                lead={lead} 
                onQualify={handleQualifyLead} 
                onDiscard={handleDiscardLead} 
            />
        ))}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)]">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Generated Assets</h2>
        <p className="text-slate-500">AI-crafted content ready to convert your leads.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
         {/* List of generated items */}
         <div className="lg:w-1/3 space-y-3 overflow-y-auto pr-2 pb-20">
            {contents.length === 0 && (
                <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                    No content yet. Qualify a lead to generate content or use a template.
                </div>
            )}
            {contents.map(c => (
                <div 
                    key={c.id} 
                    onClick={() => setSelectedContentId(c.id)}
                    className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedContentId === c.id ? 'bg-white border-brand-500 shadow-md' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'}`}
                >
                    <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{c.headline}</h4>
                    <p className="text-xs text-slate-500 truncate">{c.body}</p>
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Facebook Post</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            ))}
         </div>

         {/* Preview Area */}
         <div className="lg:w-2/3 h-full pb-20">
             {activeContent ? (
                 <ContentGenerator 
                    content={activeContent} 
                    onUpdate={handleUpdateContent}
                    onSaveTemplate={handleSaveTemplate}
                 />
             ) : (
                 <div className="h-64 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400">
                     Select an item to view details
                 </div>
             )}
         </div>
      </div>
    </div>
  );

  const renderTemplates = () => {
    // UPDATED: Filtering Logic
    const filteredTemplates = templates.filter(tpl => {
      const term = templateSearch.toLowerCase();
      return (
        tpl.name.toLowerCase().includes(term) ||
        tpl.headline.toLowerCase().includes(term) ||
        tpl.body.toLowerCase().includes(term)
      );
    });

    return (
    <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Saved Templates</h2>
                <p className="text-slate-500">High-converting scripts ready to deploy.</p>
            </div>
            
            {/* UPDATED: Search Input */}
            {templates.length > 0 && (
                <div className="relative w-full md:w-72">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search templates..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all focus:border-brand-500"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                    />
                </div>
            )}
        </div>

        {templates.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <i className="fas fa-file-alt text-2xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No Templates Yet</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Save your best performing generated posts as templates to reuse them later. You can find the "Save as Template" button in the content editor.
                </p>
                <button onClick={() => setView('leads')} className="text-brand-600 font-bold hover:underline">
                    Find Leads & Generate Content
                </button>
            </div>
        )}

        {/* UPDATED: No Search Results State */}
        {templates.length > 0 && filteredTemplates.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                <i className="fas fa-search-minus text-3xl text-slate-300 mb-3"></i>
                <p className="text-slate-600 mb-2">No templates found matching "{templateSearch}"</p>
                <button 
                    onClick={() => setTemplateSearch('')}
                    className="text-brand-600 text-sm font-bold hover:underline"
                >
                    Clear Search
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(tpl => (
                <div key={tpl.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                             <i className="fas fa-bookmark"></i>
                        </div>
                        <button 
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                            title="Delete Template"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 mb-2 truncate" title={tpl.headline}>{tpl.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-grow">{tpl.body}</p>
                    
                    <button 
                        onClick={() => handleUseTemplate(tpl)}
                        className="w-full py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-magic"></i> Use Template
                    </button>
                </div>
            ))}
        </div>
    </div>
  )};

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Campaign Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-sm mb-1 font-medium">Daily Leads Target</div>
                <div className="text-3xl font-bold text-slate-900">70</div>
                <div className="text-xs text-brand-600 mt-2 font-bold"><i className="fas fa-check-circle"></i> On Track</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-sm mb-1 font-medium">Qualified Prospects</div>
                <div className="text-3xl font-bold text-slate-900">{leads.filter(l => l.status === 'qualified').length}</div>
                <div className="text-xs text-emerald-500 mt-2 font-bold">+12% from yesterday</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-500 text-sm mb-1 font-medium">Content Pieces</div>
                <div className="text-3xl font-bold text-slate-900">{contents.length}</div>
                <div className="text-xs text-slate-400 mt-2">Ready to publish</div>
            </div>
            <div className="bg-gradient-to-br from-brand-600 to-emerald-700 p-6 rounded-xl shadow-lg text-white">
                <div className="text-brand-100 text-sm mb-1 font-medium">Est. Potential Earnings</div>
                <div className="text-3xl font-bold">$1,250</div>
                <div className="text-xs text-brand-200 mt-2 opacity-80">Based on avg. conversion</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Lead Quality Distribution</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">High Intent (>75%)</span>
                            <span className="font-bold text-slate-900">42%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Medium Intent (40-75%)</span>
                            <span className="font-bold text-slate-900">35%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Low Intent (&lt;40%)</span>
                            <span className="font-bold text-slate-900">23%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-red-400 h-2 rounded-full" style={{ width: '23%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Recent Activity</h3>
                <ul className="space-y-4">
                    {leads.slice(0, 4).map((lead, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                                <i className="fas fa-user"></i>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">Identified {lead.name}</p>
                                <p className="text-xs text-slate-500">From {lead.sourceGroup}</p>
                            </div>
                            <span className="text-xs text-slate-400">Just now</span>
                        </li>
                    ))}
                    {leads.length === 0 && <p className="text-slate-400 text-sm italic">No recent activity.</p>}
                </ul>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
        {renderSidebar()}
        
        <main className="md:ml-64 p-4 md:p-8">
            {/* Mobile Header */}
            <div className="md:hidden flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-slate-900">Affiliate<span className="text-brand-600">AI</span></h1>
                <button className="text-slate-500"><i className="fas fa-bars"></i></button>
            </div>

            {view === 'settings' && renderSettings()}
            {view === 'dashboard' && renderDashboard()}
            {view === 'leads' && renderLeads()}
            {view === 'content' && renderContent()}
            {view === 'templates' && renderTemplates()}
        </main>

        {/* Floating Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-50">
             <button onClick={() => setView('dashboard')} className={`flex flex-col items-center text-xs ${view === 'dashboard' ? 'text-brand-600' : 'text-slate-400'}`}>
                <i className="fas fa-chart-line text-lg mb-1"></i> Dashboard
             </button>
             <button onClick={() => setView('leads')} className={`flex flex-col items-center text-xs ${view === 'leads' ? 'text-brand-600' : 'text-slate-400'}`}>
                <i className="fas fa-users text-lg mb-1"></i> Leads
             </button>
             <button onClick={() => setView('content')} className={`flex flex-col items-center text-xs ${view === 'content' ? 'text-brand-600' : 'text-slate-400'}`}>
                <i className="fas fa-pen-nib text-lg mb-1"></i> Content
             </button>
             <button onClick={() => setView('templates')} className={`flex flex-col items-center text-xs ${view === 'templates' ? 'text-brand-600' : 'text-slate-400'}`}>
                <i className="fas fa-file-alt text-lg mb-1"></i> Templates
             </button>
        </div>
    </div>
  );
};

export default App;
