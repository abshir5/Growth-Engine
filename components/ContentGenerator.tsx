
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedContent } from '../types';
import { generatePostImage } from '../services/geminiService';

interface ContentGeneratorProps {
  content: GeneratedContent;
  onUpdate: (id: string, updates: Partial<GeneratedContent>) => void;
  onSaveTemplate: (content: GeneratedContent) => void;
}

const POPULAR_EMOJIS = ["🔥", "🚀", "💰", "📈", "👉", "✨", "🛑", "😱", "✅", "🤝"];

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({ content, onUpdate, onSaveTemplate }) => {
  const [image, setImage] = useState<string | undefined>(content.imageUrl);
  const [loadingImg, setLoadingImg] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Editor State
  const [editForm, setEditForm] = useState({ headline: content.headline, body: content.body });
  const [savedAsTemplate, setSavedAsTemplate] = useState(false);
  const [previewMode, setPreviewMode] = useState<'post' | 'dm'>('post');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setImage(content.imageUrl);
    setEditForm({ headline: content.headline, body: content.body });
    setSavedAsTemplate(false);
  }, [content]);

  const handleGenerateImage = async () => {
    setLoadingImg(true);
    const newImage = await generatePostImage(editForm.headline);
    if (newImage) {
        setImage(newImage);
        onUpdate(content.id, { imageUrl: newImage });
    }
    setLoadingImg(false);
  };

  const handleCopy = () => {
    const fullPost = `${editForm.headline}\n\n${editForm.body}`;
    navigator.clipboard.writeText(fullPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdate(content.id, { headline: editForm.headline, body: editForm.body });
  };

  const handleTemplateSave = () => {
    onSaveTemplate({ ...content, headline: editForm.headline, body: editForm.body });
    setSavedAsTemplate(true);
    setTimeout(() => setSavedAsTemplate(false), 3000);
  };

  const insertAtCursor = (textToInsert: string) => {
    if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentVal = editForm.body;
        const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
        setEditForm(prev => ({ ...prev, body: newVal }));
        
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }, 0);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row h-full">
      
      {/* LEFT PANE: LIVE PREVIEW */}
      <div className="lg:w-5/12 bg-slate-100 p-4 border-r border-slate-200 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-4 px-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</h4>
            <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setPreviewMode('post')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'post' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fas fa-newspaper mr-1"></i> Feed
                </button>
                <button 
                    onClick={() => setPreviewMode('dm')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'dm' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fas fa-comment-alt mr-1"></i> DM
                </button>
            </div>
        </div>

        <div className="flex-grow flex flex-col items-center">
            {/* PREVIEW CONTAINER */}
            <div className={`bg-white w-full max-w-sm mx-auto shadow-sm border border-slate-200 flex-shrink-0 transition-all ${previewMode === 'post' ? 'rounded-xl' : 'rounded-2xl p-4'}`}>
                
                {previewMode === 'post' && (
                    <>
                        {/* Fake FB Header */}
                        <div className="p-3 flex items-center gap-2 border-b border-slate-50">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
                            <div className="min-w-0 flex-1">
                                <div className="h-2.5 w-24 bg-slate-800 rounded mb-1 opacity-20"></div>
                                <div className="h-2 w-16 bg-slate-400 rounded opacity-20"></div>
                            </div>
                            <i className="fas fa-ellipsis-h text-slate-300"></i>
                        </div>
                        
                        {/* Content */}
                        <div className="px-4 py-3">
                            {editForm.headline && <div className="font-bold text-slate-900 mb-2">{editForm.headline}</div>}
                            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {editForm.body || <span className="text-slate-300 italic">Start typing...</span>}
                            </div>
                        </div>

                        {/* Image Area */}
                        <div className="bg-slate-50 w-full min-h-[200px] border-y border-slate-100 relative group overflow-hidden">
                             {loadingImg ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <span className="text-xs">Generating Visuals...</span>
                                </div>
                             ) : image ? (
                                <img src={image} alt="Post Visual" className="w-full h-auto object-cover" />
                             ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                                  <i className="far fa-image text-3xl opacity-50"></i>
                                  <span className="text-xs">No image generated</span>
                                </div>
                             )}
                        </div>

                        {/* Fake Actions */}
                        <div className="px-4 py-2 flex justify-between text-slate-400 text-sm border-t border-slate-100">
                             <span><i className="far fa-thumbs-up mr-1"></i> Like</span>
                             <span><i className="far fa-comment mr-1"></i> Comment</span>
                             <span><i className="far fa-share-square mr-1"></i> Share</span>
                        </div>
                    </>
                )}

                {previewMode === 'dm' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 items-end">
                             <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 mb-1"></div>
                             <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-2 text-sm text-slate-800 max-w-[85%] whitespace-pre-wrap">
                                 {editForm.headline && <p className="font-bold mb-1">{editForm.headline}</p>}
                                 {editForm.body || "..."}
                             </div>
                        </div>
                        {image && (
                            <div className="ml-10 max-w-[70%]">
                                <img src={image} className="rounded-xl border border-slate-100 shadow-sm" alt="Attachment" />
                            </div>
                        )}
                        <div className="text-[10px] text-slate-400 ml-10">Sent just now</div>
                    </div>
                )}
            </div>
            
            <div className="mt-6 text-center px-6">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Pro Tip</div>
                <p className="text-xs text-slate-500 italic">
                    "Posts with emojis and line breaks get 34% more engagement. Use the toolbar to spice up your copy."
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT PANE: EDITOR WORKSHOP */}
      <div className="lg:w-7/12 bg-white flex flex-col h-full">
         <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <i className="fas fa-edit text-brand-500"></i> Content Workshop
            </h3>

            {/* Headline Editor */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Hook / Headline
                </label>
                <input 
                    type="text" 
                    value={editForm.headline}
                    onChange={(e) => {
                        setEditForm({...editForm, headline: e.target.value});
                        handleSave(); // Auto-commit to main state logic loosely or relies on final save
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:font-normal"
                    placeholder="Grab their attention..."
                />
            </div>

            {/* Body Editor with Toolbar */}
            <div className="mb-6 flex flex-col h-[400px]">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Message Body</span>
                    <span className={`${editForm.body.length > 2000 ? 'text-red-500' : 'text-slate-400'} font-normal normal-case`}>
                        {editForm.body.length} chars
                    </span>
                </label>
                
                <div className="flex-1 flex flex-col border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all shadow-sm">
                    {/* Toolbar */}
                    <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 items-center">
                        <div className="flex bg-white rounded border border-slate-200 shadow-sm mr-2">
                            {POPULAR_EMOJIS.map(emoji => (
                                <button 
                                    key={emoji}
                                    onClick={() => insertAtCursor(emoji)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-sm transition-colors"
                                    title="Insert Emoji"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                        <button 
                            onClick={() => insertAtCursor(content.affiliateLink)}
                            className="px-3 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-colors flex items-center gap-1"
                            title="Insert Affiliate Link"
                        >
                            <i className="fas fa-link"></i> Insert Link
                        </button>
                    </div>

                    {/* Textarea */}
                    <textarea 
                        ref={textareaRef}
                        value={editForm.body}
                        onChange={(e) => setEditForm({...editForm, body: e.target.value})}
                        className="flex-1 w-full p-4 outline-none resize-none text-slate-700 text-sm leading-relaxed"
                        placeholder="Write your persuasive content here..."
                    />
                    
                    {/* Footer */}
                    <div className="bg-slate-50 px-3 py-1 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
                        <span>Markdown supported</span>
                        <span className="text-brand-600 font-medium">Auto-saving locally</span>
                    </div>
                </div>
            </div>
         </div>

         {/* Bottom Action Bar */}
         <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
             <button 
                onClick={handleGenerateImage}
                disabled={loadingImg}
                className="flex-1 py-3 px-4 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2"
             >
                {loadingImg ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
                {image ? 'New Image' : 'Create Image'}
             </button>

             <button 
                onClick={handleTemplateSave}
                disabled={savedAsTemplate}
                className={`flex-1 py-3 px-4 border font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ${savedAsTemplate ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
             >
                {savedAsTemplate ? <i className="fas fa-check"></i> : <i className="fas fa-bookmark"></i>}
                {savedAsTemplate ? 'Saved' : 'Save Template'}
             </button>

             <button 
                onClick={() => {
                    handleSave();
                    handleCopy();
                }}
                className="flex-[2] py-3 px-4 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 transform active:scale-95"
             >
                {copied ? <i className="fas fa-check-double"></i> : <i className="fas fa-paper-plane"></i>}
                {copied ? 'Copied!' : 'Finalize & Copy'}
             </button>
         </div>
      </div>
    </div>
  );
};
