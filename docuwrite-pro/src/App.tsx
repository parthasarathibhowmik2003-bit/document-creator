/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Wand2, 
  Bold, 
  Italic, 
  List, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Undo, 
  Redo, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Settings,
  Type,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Square,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from './lib/utils';
import { exportToDocx } from './services/exportService';

export default function App() {
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('<h1>Welcome to DocuWrite Pro</h1><p>Start writing your masterpiece here...</p>');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [selectedTheme, setSelectedTheme] = useState<'modern' | 'classic' | 'technical'>('modern');
  const [activeTab, setActiveTab] = useState<'home' | 'layout'>('home');
  const [pageColor, setPageColor] = useState('#ffffff');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    // Autosave local draft
    const saved = localStorage.getItem('docuwrite_draft');
    if (saved) {
      const { title: t, content: c } = JSON.parse(saved);
      setTitle(t);
      setContent(c);
      if (editorRef.current) {
        editorRef.current.innerHTML = c;
      }
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem('docuwrite_draft', JSON.stringify({ title, content }));
    setLastSaved(new Date());
  };

  const handleCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleAiAssist = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I am writing a document titled "${title}". Help me with the following request: ${prompt}. Please provide the response in clean HTML format suitable for a Word document (using <h1>, <h2>, <p>, <ul>, <li> tags). Do not use markdown backticks, just the HTML.`,
      });

      const aiText = response.text || '';
      const cleanHtml = aiText.replace(/```html|```/g, '').trim();

      if (editorRef.current) {
        editorRef.current.innerHTML += cleanHtml;
        setContent(editorRef.current.innerHTML);
        setPrompt('');
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGenerating(false);
      setIsAiOpen(false);
    }
  };

  const handleExport = async () => {
    await exportToDocx(title, content);
  };

  const handleExportPdf = async () => {
    if (!editorRef.current) return;
    
    const canvas = await html2canvas(editorRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: pageColor
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title}.pdf`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        const imgTag = `<img src="${imgUrl}" style="max-width: 100%; height: auto; margin: 10px 0;" referrerPolicy="no-referrer" />`;
        handleCommand('insertHTML', imgTag);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertShape = (type: 'rect' | 'circle') => {
    const shapeHtml = type === 'rect' 
      ? '<div style="width: 100px; height: 100px; background: #3b82f6; margin: 10px 0; display: inline-block;"></div>'
      : '<div style="width: 100px; height: 100px; background: #ef4444; border-radius: 50%; margin: 10px 0; display: inline-block;"></div>';
    handleCommand('insertHTML', shapeHtml);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans text-gray-800" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Top Navigation Bar */}
      <header className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-20 shrink-0 text-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded text-white font-bold text-xs shrink-0">
            W
          </div>
          <div className="flex flex-col text-left">
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveDraft}
              className="text-sm font-semibold leading-none bg-transparent focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-blue-500 transition-all px-1 text-white"
            />
            <span className="text-[10px] text-gray-400 px-1">
              Saved to local · Edited {Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)}m ago
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">Editing</span>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              title="Export as Word"
              className="px-3 py-1 text-xs border border-gray-700 rounded hover:bg-gray-800 transition-colors font-medium text-gray-300"
            >
              Word
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPdf}
              title="Export as PDF"
              className="px-3 py-1 text-xs border border-gray-700 rounded bg-blue-600 hover:bg-blue-700 transition-colors font-medium text-white"
            >
              PDF
            </motion.button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
              AI
            </div>
          </div>
        </div>
      </header>
      {/* Ribbon Style Menu */}
      <nav className="bg-gray-800 border-b border-gray-700 shadow-sm z-10 shrink-0 text-gray-300">
        <div className="px-6 pt-2 flex space-x-6 text-[11px] font-medium text-gray-400">
          <button 
            className={cn("hover:text-white pb-1", activeTab === 'home' && "text-white border-b-2 border-blue-500")}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button className="hover:text-white pb-1" onClick={() => setIsAiOpen(true)}>AI Assistant</button>
          <button 
            className={cn("hover:text-white pb-1", activeTab === 'layout' && "text-white border-b-2 border-blue-500")}
            onClick={() => setActiveTab('layout')}
          >
            Layout
          </button>
          <button className="hover:text-white pb-1">Review</button>
          <button className="hover:text-white pb-1">Help</button>
        </div>
        
        <div className="h-10 px-6 flex items-center gap-2 py-1 overflow-x-auto no-scrollbar">
          {activeTab === 'home' ? (
            <>
              <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
                <RibbonButton onClick={() => handleCommand('undo')} icon={<Undo size={14} />} title="Undo" />
                <RibbonButton onClick={() => handleCommand('redo')} icon={<Redo size={14} />} title="Redo" />
              </div>

              <div className="flex items-center gap-2 border-r border-gray-700 pr-3">
                <select 
                  onChange={(e) => handleCommand('fontName', e.target.value)}
                  className="text-[11px] border border-gray-700 rounded px-2 py-0.5 outline-none bg-gray-900 text-gray-200"
                >
                  <option value="Inter">Inter (Body)</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>
                <select 
                  onChange={(e) => handleCommand('fontSize', e.target.value)}
                  className="text-[11px] border border-gray-700 rounded px-2 py-0.5 outline-none bg-gray-900 text-gray-200 w-12"
                >
                  <option value="3">11</option>
                  <option value="4">12</option>
                  <option value="5">14</option>
                  <option value="6">18</option>
                </select>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
                <ToolbarButton onClick={() => handleCommand('bold')} label="B" bold title="Bold" />
                <ToolbarButton onClick={() => handleCommand('italic')} label="I" italic title="Italic" />
                <ToolbarButton onClick={() => handleCommand('underline')} label="U" underline title="Underline" />
                <div className="relative group ml-1">
                  <div className="w-5 h-5 rounded overflow-hidden border border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-700">
                    <Palette size={12} />
                    <input 
                      type="color" 
                      onChange={(e) => handleCommand('foreColor', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title="Font Color"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
                <RibbonButton onClick={() => handleCommand('justifyLeft')} icon={<AlignLeft size={14} />} title="Align Left" />
                <RibbonButton onClick={() => handleCommand('justifyCenter')} icon={<AlignCenter size={14} />} title="Align Center" />
                <RibbonButton onClick={() => handleCommand('justifyRight')} icon={<AlignRight size={14} />} title="Align Right" />
              </div>

              <div className="flex items-center gap-1 pr-3">
                <RibbonButton onClick={() => handleCommand('insertUnorderedList')} icon={<List size={14} />} title="Bullets" />
                <RibbonButton 
                  onClick={() => {
                    if (confirm('Clear document?')) {
                      if (editorRef.current) editorRef.current.innerHTML = '<p><br></p>';
                      setContent('<p><br></p>');
                      saveDraft();
                    }
                  }} 
                  icon={<Trash2 size={14} className="text-gray-500 hover:text-red-400" />} 
                  title="Clear" 
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 pr-3 border-r border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Page Color</span>
                  <input 
                    type="color" 
                    value={pageColor}
                    onChange={(e) => setPageColor(e.target.value)}
                    className="w-6 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                <RibbonButton onClick={() => fileInputRef.current?.click()} icon={<ImageIcon size={14} />} title="Insert Image" />
              </div>
              <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
                <RibbonButton onClick={() => insertShape('rect')} icon={<Square size={14} />} title="Insert Rectangle" />
                <RibbonButton onClick={() => insertShape('circle')} icon={<div className="w-3 h-3 rounded-full border-2 border-gray-400" />} title="Insert Circle" />
              </div>
              <div className="flex items-center gap-1 pr-3">
                <RibbonButton onClick={handleExportPdf} icon={<FileDown size={14} className="text-blue-400" />} title="Fast Export PDF" />
              </div>
            </>
          )}
        </div>
      </nav>


      {/* Main Content Area with Sidebar */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex w-56 bg-gray-900 border-r border-gray-800 p-4 flex-col space-y-6 overflow-y-auto shrink-0 text-gray-300">
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 text-left">Navigation</h3>
            <ul className="space-y-2 text-[11px] text-left">
              <li className="font-semibold text-blue-400 cursor-pointer">Project Content</li>
              <li className="text-gray-400 hover:text-white cursor-pointer" onClick={() => setIsAiOpen(true)}>AI Generation</li>
              <li className="text-gray-400 hover:text-white cursor-pointer">Draft History</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 text-left">Typography</h3>
            <div className="flex bg-gray-800 rounded border border-gray-700 p-1">
              <ThemeToggle active={selectedTheme === 'modern'} onClick={() => setSelectedTheme('modern')} label="Inter" />
              <ThemeToggle active={selectedTheme === 'classic'} onClick={() => setSelectedTheme('classic')} label="Serif" />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 text-left">Document Info</h3>
            <div className="bg-gray-800 p-3 rounded border border-gray-700 shadow-sm space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Words</span>
                <span className="text-[10px] text-gray-500">{content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight text-left">Drafting professional documents made easy with DocuWrite Pro.</p>
            </div>
          </div>
        </aside>

        {/* Document Canvas */}
        <div className="flex-1 flex justify-center bg-gray-200 p-8 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "document-page outline-none",
              selectedTheme === 'modern' ? 'font-sans' : selectedTheme === 'classic' ? 'font-serif' : 'font-mono'
            )}
            contentEditable
            ref={editorRef}
            onInput={(e) => {
              setContent(e.currentTarget.innerHTML);
              saveDraft();
            }}
            style={{ 
              minHeight: '1056px', 
              height: 'fit-content',
              backgroundColor: pageColor
            }}
            suppressContentEditableWarning
          />
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-blue-800 text-white flex items-center justify-between px-4 text-[10px] font-medium shrink-0">
        <div className="flex items-center gap-4">
          <span>Page 1 of 1</span>
          <span>{content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} words</span>
          <span className="opacity-70 italic">English (United States)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">Accessibility: Good to go</span>
          <div className="flex items-center gap-2">
            <span className="opacity-70">Focus</span>
            <div className="w-24 h-1 bg-white/20 rounded">
              <div className="w-full h-full bg-white rounded"></div>
            </div>
            <span className="opacity-70">100%</span>
          </div>
        </div>
      </footer>

      {/* AI Assistant Modal Overlay */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-white rounded-3xl shadow-2xl z-[40] overflow-hidden border border-slate-200"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Sparkles size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-800">AI Writing Assistant</h3>
                    <p className="text-sm text-slate-500">Transform your ideas into polished drafts.</p>
                  </div>
                </div>
                
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Write a formal cover letter for a software engineer role at Google..."
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none mb-6"
                />

                <div className="flex items-center justify-between gap-4">
                  <button 
                    onClick={() => setIsAiOpen(false)}
                    className="text-slate-400 font-semibold hover:text-slate-600 px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAiAssist}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Content
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Powered by Gemini 3 Flash
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function RibbonButton({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) {
  return (
    <button 
      onClick={onClick} 
      title={title}
      className="p-1 hover:bg-gray-700 rounded text-gray-300 transition-colors flex items-center justify-center min-w-[28px]"
    >
      {icon}
    </button>
  );
}

function ToolbarButton({ onClick, label, bold, italic, underline, title }: { onClick: () => void, label: string, bold?: boolean, italic?: boolean, underline?: boolean, title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "w-6 h-6 hover:bg-gray-700 rounded text-sm flex items-center justify-center transition-colors font-medium text-gray-300",
        bold && "font-bold",
        italic && "italic",
        underline && "underline"
      )}
    >
      {label}
    </button>
  );
}

function ThemeToggle({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all",
        active ? "bg-blue-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {label}
    </button>
  );
}
