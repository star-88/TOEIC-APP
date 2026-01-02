import React, { useState, useEffect, useCallback } from 'react';
import { Word, GrammarNote, ViewState } from './types';
import { generateWordDetails } from './services/geminiService';
import { IconBook, IconPencilSquare, IconPlus, IconChevronLeft, IconSpeakerWave, IconSparkles } from './components/Icons';

// --- Helper Components ---

const Button = ({ onClick, children, className, variant = 'primary', disabled = false }: any) => {
  const baseStyle = "px-4 py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50",
    ghost: "text-blue-600 hover:bg-blue-50",
    icon: "p-2 rounded-full hover:bg-slate-100 text-slate-500"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar'>('vocab');
  const [view, setView] = useState<ViewState>('GROUPS');
  
  // Data State
  const [words, setWords] = useState<Word[]>([]);
  const [grammarNotes, setGrammarNotes] = useState<GrammarNote[]>([]);
  
  // Selection State
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedNote, setSelectedNote] = useState<GrammarNote | null>(null);

  // Form State
  const [newWordTerm, setNewWordTerm] = useState('');
  const [newWordMeaning, setNewWordMeaning] = useState('');
  const [newWordExample, setNewWordExample] = useState('');
  const [newWordGroup, setNewWordGroup] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Grammar Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Initial Load
  useEffect(() => {
    const savedWords = localStorage.getItem('lumi_words');
    const savedNotes = localStorage.getItem('lumi_notes');
    if (savedWords) setWords(JSON.parse(savedWords));
    if (savedNotes) setGrammarNotes(JSON.parse(savedNotes));
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('lumi_words', JSON.stringify(words));
  }, [words]);

  useEffect(() => {
    localStorage.setItem('lumi_notes', JSON.stringify(grammarNotes));
  }, [grammarNotes]);

  // Derived Data
  const groups = Array.from(new Set(words.map(w => w.group))).sort();

  // Actions
  const handleSpeak = (text: string, lang: 'en-US' | 'fr-FR') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const handleAIAutoFill = async () => {
    if (!newWordTerm) return;
    setIsGenerating(true);
    const suggestion = await generateWordDetails(newWordTerm);
    if (suggestion) {
      setNewWordMeaning(suggestion.meaning);
      setNewWordExample(suggestion.example);
    }
    setIsGenerating(false);
  };

  const handleAddWord = () => {
    if (!newWordTerm || !newWordGroup) return;
    const newWord: Word = {
      id: Date.now().toString(),
      term: newWordTerm,
      meaning: newWordMeaning,
      example: newWordExample,
      group: newWordGroup,
      createdAt: Date.now(),
    };
    setWords([newWord, ...words]);
    resetWordForm();
    setView('GROUPS');
  };

  const resetWordForm = () => {
    setNewWordTerm('');
    setNewWordMeaning('');
    setNewWordExample('');
    setNewWordGroup('');
  };

  const handleSaveNote = () => {
    if (selectedNote) {
      // Update
      const updatedNotes = grammarNotes.map(n => 
        n.id === selectedNote.id 
          ? { ...n, title: noteTitle, content: noteContent, lastEdited: Date.now() } 
          : n
      );
      setGrammarNotes(updatedNotes);
    } else {
      // Create
      const newNote: GrammarNote = {
        id: Date.now().toString(),
        title: noteTitle || 'New Note',
        content: noteContent,
        lastEdited: Date.now(),
      };
      setGrammarNotes([newNote, ...grammarNotes]);
    }
    setView('GRAMMAR_LIST');
  };

  // --- Views ---

  const renderHeader = (title: string, backAction?: () => void, rightAction?: React.ReactNode) => (
    <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200/50">
      <div className="flex items-center gap-3">
        {backAction && (
          <button onClick={backAction} className="p-1 -ml-2 rounded-full hover:bg-slate-200/50">
            <IconChevronLeft className="w-6 h-6 text-blue-600" />
          </button>
        )}
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>
      {rightAction}
    </div>
  );

  const renderGroups = () => (
    <div className="p-4 pb-24">
      {renderHeader("Vocabulary Sets", undefined, 
        <Button variant="ghost" className="!p-1" onClick={() => { resetWordForm(); setView('ADD_WORD'); }}>
          <IconPlus className="w-6 h-6" />
        </Button>
      )}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {groups.length === 0 ? (
          <div className="col-span-2 text-center py-20 opacity-50">
            <p>No words yet. Click + to add.</p>
          </div>
        ) : (
          groups.map(group => {
            const count = words.filter(w => w.group === group).length;
            return (
              <Card key={group} onClick={() => { setSelectedGroup(group); setView('GROUP_DETAIL'); }} className="h-32 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50 hover:to-blue-50/50">
                <div className="font-bold text-lg text-slate-800 truncate">{group}</div>
                <div className="text-sm text-blue-500 font-medium">{count} words</div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderGroupDetail = () => {
    const groupWords = words.filter(w => w.group === selectedGroup);
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        {renderHeader(selectedGroup || 'Group', () => setView('GROUPS'))}
        <div className="p-4 space-y-4">
          {groupWords.map(word => (
            <Card key={word.id} onClick={() => { setSelectedWord(word); setView('WORD_DETAIL'); }}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900">{word.term}</h3>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="icon" onClick={() => handleSpeak(word.term, 'en-US')} className="!p-1.5 bg-blue-50 text-blue-600">
                    <span className="text-[10px] font-bold mr-1">EN</span>
                    <IconSpeakerWave className="w-4 h-4" />
                  </Button>
                  <Button variant="icon" onClick={() => handleSpeak(word.term, 'fr-FR')} className="!p-1.5 bg-indigo-50 text-indigo-600">
                    <span className="text-[10px] font-bold mr-1">FR</span>
                    <IconSpeakerWave className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-slate-600 mb-1">{word.meaning}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderWordDetail = () => {
    if (!selectedWord) return null;
    return (
      <div className="min-h-screen bg-white pb-24">
        {renderHeader(selectedWord.term, () => setView('GROUP_DETAIL'))}
        <div className="p-6 space-y-8">
          
          <div className="space-y-2">
             <div className="flex gap-4 mb-4">
                <button 
                  onClick={() => handleSpeak(selectedWord.term, 'en-US')}
                  className="flex-1 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <IconSpeakerWave className="w-5 h-5" /> English
                </button>
                <button 
                  onClick={() => handleSpeak(selectedWord.term, 'fr-FR')}
                  className="flex-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                   <IconSpeakerWave className="w-5 h-5" /> French
                </button>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meaning</label>
            <p className="text-2xl font-serif text-slate-800">{selectedWord.meaning}</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-2">Example</label>
            <p className="text-lg text-slate-700 leading-relaxed italic">"{selectedWord.example}"</p>
          </div>

          <div className="pt-8 text-center text-slate-400 text-sm">
            Added to {selectedWord.group}
          </div>
        </div>
      </div>
    );
  };

  const renderAddWord = () => (
    <div className="min-h-screen bg-slate-50 pb-24">
      {renderHeader("Add New Word", () => setView('GROUPS'))}
      <div className="p-6 space-y-6">
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 ml-1">Group</label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
             <button 
                onClick={() => setNewWordGroup('')}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${newWordGroup === '' && !groups.includes(newWordGroup) ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
             >
               + New Group
             </button>
             {groups.map(g => (
               <button 
                key={g}
                onClick={() => setNewWordGroup(g)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${newWordGroup === g ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
               >
                 {g}
               </button>
             ))}
          </div>
          {(!newWordGroup || !groups.includes(newWordGroup)) && (
             <input
             type="text"
             placeholder="Enter group name (e.g. Business, Travel)"
             value={newWordGroup}
             onChange={(e) => setNewWordGroup(e.target.value)}
             className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none input-transition"
           />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 ml-1">Word</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter English word"
              value={newWordTerm}
              onChange={(e) => setNewWordTerm(e.target.value)}
              className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg font-bold text-slate-800 input-transition"
            />
            {newWordTerm && (
              <button 
                onClick={handleAIAutoFill}
                disabled={isGenerating}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                 {isGenerating ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <IconSparkles className="w-6 h-6" />}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 ml-1">Tip: Click the sparkle to auto-fill meaning & example.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 ml-1">Meaning (Chinese)</label>
          <input
            type="text"
            placeholder="中文解釋"
            value={newWordMeaning}
            onChange={(e) => setNewWordMeaning(e.target.value)}
            className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none input-transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 ml-1">Example Sentence</label>
          <textarea
            placeholder="Enter an example sentence..."
            value={newWordExample}
            onChange={(e) => setNewWordExample(e.target.value)}
            rows={3}
            className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none input-transition resize-none"
          />
        </div>

        <Button onClick={handleAddWord} className="w-full shadow-xl shadow-blue-200/50 mt-8">
          Save Word
        </Button>
      </div>
    </div>
  );

  const renderGrammarList = () => (
    <div className="p-4 pb-24">
       {renderHeader("Grammar Notes", undefined, 
        <Button variant="ghost" className="!p-1" onClick={() => { 
          setSelectedNote(null); 
          setNoteTitle(''); 
          setNoteContent(''); 
          setView('GRAMMAR_EDIT'); 
        }}>
          <IconPlus className="w-6 h-6" />
        </Button>
      )}
      <div className="space-y-4 mt-4">
        {grammarNotes.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <p>No notes yet.</p>
          </div>
        ) : (
          grammarNotes.map(note => (
            <Card key={note.id} onClick={() => { 
              setSelectedNote(note); 
              setNoteTitle(note.title); 
              setNoteContent(note.content); 
              setView('GRAMMAR_EDIT'); 
            }}>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{note.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2">{note.content || 'No content'}</p>
              <p className="text-xs text-slate-400 mt-3">{new Date(note.lastEdited).toLocaleDateString()}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderGrammarEdit = () => (
    <div className="min-h-screen bg-white flex flex-col z-30 fixed inset-0">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <button onClick={() => setView('GRAMMAR_LIST')} className="flex items-center text-blue-600 font-medium">
          <IconChevronLeft className="w-5 h-5 mr-1" /> Grammar
        </button>
        <button onClick={handleSaveNote} className="font-bold text-blue-600">Done</button>
      </div>
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <input
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Title"
          className="text-3xl font-bold text-slate-900 placeholder:text-slate-300 outline-none bg-transparent mb-4"
        />
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Start typing..."
          className="flex-1 text-lg text-slate-700 placeholder:text-slate-300 outline-none bg-transparent resize-none leading-relaxed"
        />
      </div>
    </div>
  );

  // --- Main Render Switch ---

  const renderContent = () => {
    if (activeTab === 'vocab') {
      switch (view) {
        case 'GROUPS': return renderGroups();
        case 'GROUP_DETAIL': return renderGroupDetail();
        case 'WORD_DETAIL': return renderWordDetail();
        case 'ADD_WORD': return renderAddWord();
        default: return renderGroups();
      }
    } else {
      switch (view) {
        case 'GRAMMAR_LIST': return renderGrammarList();
        case 'GRAMMAR_EDIT': return renderGrammarEdit();
        default: return renderGrammarList();
      }
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-2xl relative">
      {/* Content Area */}
      {renderContent()}

      {/* Bottom Navigation */}
      {(view === 'GROUPS' || view === 'GRAMMAR_LIST') && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around p-2 pb-6 z-10">
          <button 
            onClick={() => { setActiveTab('vocab'); setView('GROUPS'); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors ${activeTab === 'vocab' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <IconBook className="w-6 h-6" />
            <span className="text-[10px] font-bold">Vocab</span>
          </button>
          <button 
            onClick={() => { setActiveTab('grammar'); setView('GRAMMAR_LIST'); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors ${activeTab === 'grammar' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <IconPencilSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold">Grammar</span>
          </button>
        </div>
      )}
    </div>
  );
}