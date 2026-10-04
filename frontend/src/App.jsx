import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Flame, 
  Info, 
  Loader2, 
  Plus, 
  Mic, 
  ArrowUp, 
  MessageSquare, 
  BarChart3, 
  Lightbulb, 
  FileQuestion,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Languages,
  Globe,
  Menu,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  LogIn,
  User,
  Lock,
  Mail,
  Network,
  Eye,
  Maximize2,
  ClipboardCheck,
  Scale
} from 'lucide-react';
import GraphCanvas from './components/GraphCanvas';
import WhatWeHaveDecided from './components/WhatWeHaveDecided';
import { analyzeDecision, reflectOnAnswers, loginUser, registerUser } from './services/api';
import { translations } from './utils/translations';

const EXAMPLE_PROMPTS = [
  {
    title: "Job Offer in Pune vs Stable Job",
    category: "Career & Relocation",
    text: "I got a job offer in Pune with a 40% salary hike. My current job is stable, but Pune pays much more. I'm assuming living expenses will be similar to Nagpur, and I have to decide by this Friday."
  },
  {
    title: "Startup Equity vs High Cash",
    category: "Financial & Risk",
    text: "I am choosing between joining an early-stage AI startup with 1.5% equity and lower base pay, or taking an established senior engineering role with high fixed salary and guaranteed bonus."
  },
  {
    title: "Relocating Abroad vs Staying Close to Family",
    category: "Personal & Family",
    text: "I received an internal transfer opportunity to our London office for 2 years. It would boost my career trajectory, but my aging parents prefer me staying in Delhi."
  }
];

export default function App() {
  // Application Stage: 'capture' | 'interrogate' | 'reflect'
  const [stage, setStage] = useState('capture');
  
  // Sidebar Toggle State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Language State: 'en' | 'hi'
  const [language, setLanguage] = useState('en');
  const t = translations[language] || translations.en;

  // Data State
  const [userInput, setUserInput] = useState('');
  const [reasoningMap, setReasoningMap] = useState(null);
  const [originalMap, setOriginalMap] = useState(null);
  const [blindSpots, setBlindSpots] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(6);
  const [isReflected, setIsReflected] = useState(false);
  const textareaRef = useRef(null);

  // Auth & Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dm_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      id: 'usr_demo_01',
      name: 'Demo Explorer',
      email: 'demo@decisionmirror.ai'
    };
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('demo@decisionmirror.ai');
  const [authPassword, setAuthPassword] = useState('demo1234');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authFeedback, setAuthFeedback] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    setCurrentUser(null);
    setIsConfirmLogoutOpen(false);
    setAuthFeedback(language === 'hi' ? 'आप सफलतापूर्वक लॉग आउट हो गए हैं।' : 'Logged out successfully.');
    setTimeout(() => setAuthFeedback(''), 3000);
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await loginUser(authEmail, authPassword);
      setCurrentUser(data.user);
      localStorage.setItem('dm_token', data.token);
      localStorage.setItem('dm_user', JSON.stringify(data.user));
      setIsAuthModalOpen(false);
      setAuthFeedback(language === 'hi' ? 'सफलतापूर्वक लॉग इन हुआ!' : 'Logged in successfully!');
      setTimeout(() => setAuthFeedback(''), 3000);
    } catch (err) {
      setAuthError(err.response?.data?.detail || (language === 'hi' ? 'लॉग इन विफल रहा।' : 'Login failed. Please check credentials.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await registerUser(authName, authEmail, authPassword);
      setCurrentUser(data.user);
      localStorage.setItem('dm_token', data.token);
      localStorage.setItem('dm_user', JSON.stringify(data.user));
      setIsAuthModalOpen(false);
      setAuthFeedback(language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account registered successfully!');
      setTimeout(() => setAuthFeedback(''), 3000);
    } catch (err) {
      setAuthError(err.response?.data?.detail || (language === 'hi' ? 'पंजीकरण विफल रहा।' : 'Registration failed.'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Attachment State
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Close attachment menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setIsAttachMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea in capture mode
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [userInput]);

  // Handle file / photo upload cleanly without touching textarea
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const fileData = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size < 1024 * 1024 
          ? (file.size / 1024).toFixed(1) + ' KB'
          : (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        type: file.type,
        isImage,
        fileObj: file,
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fileData.previewUrl = event.target.result;
          setAttachedFiles((prev) => [...prev, fileData]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles((prev) => [...prev, fileData]);
      }
    });

    setIsAttachMenuOpen(false);
    if (e.target) e.target.value = '';
  };

  const removeAttachedFile = (fileId) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Handle "Analyze Thinking"
  const handleAnalyze = async (inputText) => {
    let textToAnalyze = typeof inputText === 'string' ? inputText.trim() : userInput.trim();
    
    if (attachedFiles.length > 0 && !textToAnalyze) {
      const fileNames = attachedFiles.map(f => f.name).join(', ');
      textToAnalyze = `Evaluate decision context from uploaded document(s): ${fileNames}. Identify core trade-offs, options, and key assumptions.`;
    }

    if (!textToAnalyze || textToAnalyze.length < 5) {
      setErrorMessage(language === 'hi' ? "कृपया विश्लेषण के लिए निर्णय लिखें या फ़ाइल जोड़ें।" : "Please type a dilemma or attach a file to analyze.");
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setLoadingStep(t.processingCognitive);

    try {
      setTimeout(() => setLoadingStep(language === 'hi' ? "संज्ञानात्मक ब्लाइंड स्पॉट्स की जांच की जा रही है..." : "Scanning cognitive blind spots & unverified gaps..."), 800);
      setTimeout(() => setLoadingStep(language === 'hi' ? "सुकराती प्रश्न तैयार किए जा रहे हैं..." : "Formulating targeted Socratic questions..."), 1600);
      setTimeout(() => setLoadingStep(language === 'hi' ? "एडवाइस गार्ड से निष्पक्षता सत्यापित की जा रही है..." : "Verifying through Advice Guard (0 prescriptive bias)..."), 2400);

      const data = await analyzeDecision(textToAnalyze);

      setReasoningMap(data.reasoning_map);
      setOriginalMap(data.reasoning_map);
      setBlindSpots(data.blind_spots);
      setQuestions(data.questions);
      
      const initialAnswers = {};
      data.questions.forEach((q, idx) => {
        initialAnswers[idx] = '';
      });
      setUserAnswers(initialAnswers);

      setStage('interrogate');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || (language === 'hi' ? "विश्लेषण विफल रहा। कृपया सुनिश्चित करें कि बैकएंड चल रहा है।" : "Failed to analyze decision. Please verify the backend is running."));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Submit Reflection"
  const handleReflect = async () => {
    const formattedAnswers = questions.map((q, idx) => ({
      question: q.question,
      answer: userAnswers[idx] || (language === 'hi' ? "कोई उत्तर नहीं दिया गया।" : "No specific answer provided."),
    }));

    setIsLoading(true);
    setLoadingStep(t.updatingCognitive);

    try {
      const data = await reflectOnAnswers(originalMap || reasoningMap, formattedAnswers);
      setReasoningMap(data.updated_map);
      setIsReflected(true);
      setStage('reflect');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || "Failed to update reflection map.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setStage('capture');
    setUserInput('');
    setReasoningMap(null);
    setOriginalMap(null);
    setBlindSpots(null);
    setQuestions([]);
    setUserAnswers({});
    setAttachedFiles([]);
    setErrorMessage('');
    setIsReflected(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((userInput.trim().length >= 5 || attachedFiles.length > 0) && !isLoading) {
        handleAnalyze(userInput);
      }
    }
  };

  const getMethodBadge = (method) => {
    switch (method) {
      case 'premortem':
        return { label: language === 'hi' ? 'प्री-मॉर्टम विश्लेषण' : 'Premortem Scan', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'opposite_view':
        return { label: language === 'hi' ? 'विपरीत दृष्टिकोण' : 'Opposite View', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'base_rate':
        return { label: language === 'hi' ? 'बेस रेट डेटा' : 'Base Rate & Data', color: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'mind_changer':
        return { label: language === 'hi' ? 'माइंड चेंजर' : 'Mind Changer', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: language === 'hi' ? 'सुकराती पूछताछ' : 'Socratic Inquiry', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const checkedCount = reasoningMap?.assumptions?.filter(a => a.status === 'checked').length || 0;
  const totalAssumptions = reasoningMap?.assumptions?.length || 0;
  const totalOptions = reasoningMap?.options?.length || 0;

  return (
    <div className="flex h-screen w-screen bg-[#f0f2f5] text-slate-800 overflow-hidden font-sans">
      
      {/* ── 1. LEFT NAVIGATION SIDEBAR (Collapsible with 3-line menu) ── */}
      <aside className={`bg-white border-r border-slate-300/80 flex flex-col justify-between shrink-0 z-30 shadow-sm transition-all duration-300 ease-in-out overflow-hidden ${
        isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0'
      }`}>
        <div className="w-64">
          {/* Sidebar Top: Three Lines Icon on Left of Logo */}
          <div className="h-16 px-4 border-b border-slate-200 flex items-center gap-3">
            {/* 3 Lines Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
              title="Close sidebar"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none truncate">
                  {t.appTitle}
                </h1>
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                  {t.appSubtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Stages Navigation */}
          <div className="p-4 space-y-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2">
                {t.workflowStages}
              </div>
              <nav className="space-y-1.5">
                
                {/* Stage 1 Option */}
                <button
                  onClick={() => setStage('capture')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    stage === 'capture'
                      ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    stage === 'capture' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    1
                  </span>
                  <div className="flex-1 truncate">
                    <div className="font-bold">{t.stage1Title}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {userInput.trim().length > 0 ? `${userInput.length} chars` : t.stage1Sub}
                    </div>
                  </div>
                  {userInput.trim().length > 10 && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                </button>

                {/* Stage 2 Option */}
                <button
                  onClick={() => setStage('interrogate')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    stage === 'interrogate'
                      ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    stage === 'interrogate' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    2
                  </span>
                  <div className="flex-1 truncate">
                    <div className="font-bold">{t.stage2Title}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {questions.length > 0 ? `${questions.length} ${t.targetedQuestions}` : t.stage2Sub}
                    </div>
                  </div>
                  {isReflected && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                </button>

                {/* Stage 3 Option */}
                <button
                  onClick={() => setStage('reflect')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    stage === 'reflect'
                      ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    stage === 'reflect' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    3
                  </span>
                  <div className="flex-1 truncate">
                    <div className="font-bold">{t.stage3Title}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {isReflected ? (language === 'hi' ? 'संतुलित सारांश' : 'Calibrated summary') : t.stage3Sub}
                    </div>
                  </div>
                </button>

                {/* Stage 4 Option - Reasoning Graph */}
                <button
                  onClick={() => setStage('graph')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group cursor-pointer ${
                    stage === 'graph'
                      ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={t.stage4Title}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    stage === 'graph' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    4
                  </span>
                  <div className="flex-1 truncate">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{t.stage4Title}</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {reasoningMap ? `${reasoningMap.options?.length || 2} ${t.optionsCount}, ${reasoningMap.assumptions?.length || 0} ${t.assumptionsCount}` : t.stage4Sub}
                    </div>
                  </div>
                  <Network className={`w-4 h-4 shrink-0 transition-colors ${
                    stage === 'graph' ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-600'
                  }`} />
                </button>

                {/* Stage 5 Option - What We Have Decided */}
                <button
                  onClick={() => setStage('decision')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group cursor-pointer ${
                    stage === 'decision'
                      ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={t.stage5Title}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    stage === 'decision' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    5
                  </span>
                  <div className="flex-1 truncate">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{t.stage5Title}</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {t.stage5Sub}
                    </div>
                  </div>
                  <ClipboardCheck className={`w-4 h-4 shrink-0 transition-colors ${
                    stage === 'decision' ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-600'
                  }`} />
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="w-64 border-t border-slate-200 bg-slate-50/70">
          {/* User Account / Logout Option (Upper side of Advice Guard Active) */}
          <div className="p-3 border-b border-slate-200/80 bg-white/70">
            {currentUser ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs ring-1 ring-teal-200">
                    {currentUser.name
                      ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'DE'}
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                      {currentUser.name || 'Demo Explorer'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight">
                      {currentUser.email || 'demo@decisionmirror.ai'}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => setIsConfirmLogoutOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg shadow-2xs transition-all shrink-0 group cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                  <span>{t.logout}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-500 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-600 truncate">{t.guestUser}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.login}</span>
                </button>
              </div>
            )}
          </div>

          {/* Advice Guard Active */}
          <div className="p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-teal-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{t.adviceGuardActive}</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              {t.adviceGuardDesc}
            </div>
          </div>
        </div>
      </aside>

      {/* ── 2. MAIN WORKSPACE ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-300/80 bg-white/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            
            {/* 3 Lines Hamburger Menu Button on Top Header when sidebar is closed */}
            {!isSidebarOpen && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Open sidebar"
                >
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>

                {/* Logo & Title on Header when sidebar closed */}
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-teal-600/20">
                    <Compass className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    {t.appTitle}
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide hidden sm:block">
              {t.stageViewPrefix}
            </div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {stage === 'capture' && t.stage1Header}
              {stage === 'interrogate' && t.stage2Header}
              {stage === 'reflect' && t.stage3Header}
              {stage === 'graph' && t.stage4Header}
              {stage === 'decision' && t.stage5Header}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Watch Graph Icon Button */}
            <button
              type="button"
              onClick={() => setStage('graph')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                stage === 'graph'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-teal-600/20'
                  : 'bg-white text-slate-700 hover:text-teal-700 hover:bg-teal-50/60 border-slate-300 hover:border-teal-300'
              }`}
              title="Watch full reasoning graph (Stage 4)"
            >
              <Network className={`w-3.5 h-3.5 ${stage === 'graph' ? 'text-white' : 'text-teal-600'}`} />
              <span className="hidden sm:inline">4. {t.stage4Title}</span>
            </button>

            {reasoningMap && stage !== 'capture' && (
              <div className="hidden lg:flex items-center gap-3 text-xs font-medium text-slate-600 mr-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  {reasoningMap.options?.length || 0} {t.optionsCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {reasoningMap.assumptions?.length || 0} {t.assumptionsCount}
                </span>
              </div>
            )}

            {/* Language Switcher Button (Left of New Decision) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to English"
              >
                <Languages className="w-3.5 h-3.5 text-teal-600" />
                <span>EN</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="हिन्दी में बदलें"
              >
                <span>हिन्दी</span>
              </button>
            </div>

            {/* Top Right "New Decision" Button */}
            <button
              onClick={handleReset}
              className="py-1.5 px-3.5 rounded-xl bg-white border border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 text-slate-700 hover:text-teal-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Clear current state and start a new decision"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.newDecision}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Stage Views */}

        {/* ── STAGE 1: CAPTURE ── */}
        {stage === 'capture' && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-10 max-w-4xl mx-auto w-full overflow-y-auto">
            
            {/* Center Welcome */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto max-w-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                <Compass className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t.whatDecisionTitle}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
                  {t.whatDecisionSub}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isLoading && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-teal-800 font-mono animate-pulse">
                    {loadingStep}
                  </span>
                </div>
              )}
            </div>

            {/* ── Sleek AI Chat Input Bar with File Upload Popup ── */}
            <div className="w-full max-w-3xl pt-4">
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf,.txt,.docx,.csv,.json"
                className="hidden"
              />

              {/* Attached Files / Photos Preview Chips */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-white border border-slate-300 shadow-sm text-xs text-slate-700 animate-fadeIn"
                    >
                      {file.isImage && file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="w-6 h-6 rounded-md object-cover border border-slate-200"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-teal-600" />
                      )}
                      <span className="font-semibold truncate max-w-[140px] text-slate-800">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {file.size}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(file.id)}
                        className="w-5 h-5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Input Capsule */}
              <div className="relative rounded-3xl bg-white border border-slate-300 shadow-lg shadow-slate-200/50 p-2.5 flex items-end gap-2 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all">
                
                {/* Plus Button Container with Popup Menu */}
                <div className="relative" ref={attachMenuRef}>
                  <button 
                    type="button"
                    onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isAttachMenuOpen 
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 rotate-45' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                    title={t.addFilesOrPhotos}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Attachment Popover Menu */}
                  {isAttachMenuOpen && (
                    <div className="absolute bottom-12 left-0 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-300/60 p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      
                      {/* Add files or photos */}
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) fileInputRef.current.click();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                      >
                        <Paperclip className="w-4 h-4 text-slate-600" />
                        <span>{t.addFilesOrPhotos}</span>
                      </button>

                      {/* Quick Dilemma Preset */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserInput(EXAMPLE_PROMPTS[0].text);
                          setIsAttachMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                      >
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>{t.insertSampleDilemma}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Auto-expanding Input Area */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.inputPlaceholder}
                  className="flex-1 bg-transparent border-none text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none py-2 px-1 max-h-36 leading-relaxed"
                />

                {/* Right Action Icons */}
                <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    title={t.voiceInput}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnalyze(userInput)}
                    disabled={(!userInput.trim() && attachedFiles.length === 0) || isLoading}
                    className="w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md shadow-teal-600/20"
                    title={t.analyzeThinking}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400 mt-2.5">
                {t.safetyNoticeSmall}
              </p>
            </div>
          </div>
        )}

        {/* ── STAGE 2 & 3: FOCUSED WORKSPACE (Inquiry & Reflection Mirror) ── */}
        {stage !== 'capture' && stage !== 'graph' && stage !== 'decision' && (
          <div className="flex-1 w-full bg-slate-50/50 overflow-y-auto flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col overflow-hidden my-auto">
              
              {/* Error Banner */}
              {errorMessage && (
                <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 animate-pulse">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{t.updatingCognitive}</h3>
                    <p className="text-xs text-teal-700 font-mono mt-1 font-semibold animate-pulse">
                      {loadingStep}
                    </p>
                  </div>
                </div>
              )}

              {/* ── STAGE 2: INQUIRY (With Empty State if no questions yet) ── */}
              {!isLoading && stage === 'interrogate' && (
                questions.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center h-full space-y-4 my-auto">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
                      <FileQuestion className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h3 className="text-base font-bold text-slate-800">{t.noInquiryQuestions}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t.noInquirySub}
                      </p>
                    </div>
                    <button
                      onClick={() => setStage('capture')}
                      className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.goToDescribe}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col h-full justify-between space-y-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">Stage 2 of 3</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-300">
                            {questions.length} {t.targetedQuestions}
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mt-1">{t.inquiryTitle}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {t.inquirySub}
                        </p>
                      </div>

                      {/* Identified Gaps Summary */}
                      {blindSpots?.identified_gaps && (
                        <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                          <div className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t.cognitiveFriction}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {blindSpots.identified_gaps.map((gap, gIdx) => (
                              <span key={gIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-white text-teal-800 border border-teal-300 font-semibold shadow-xs">
                                {gap.gap_name} ({t.severity} {gap.severity_score}/5)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Question Cards */}
                      <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
                        {questions.map((q, idx) => {
                          const badge = getMethodBadge(q.method);
                          return (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-300 space-y-2.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold font-mono">
                                  Target: {q.gap_name}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                "{q.question}"
                              </p>
                              <textarea
                                rows={2}
                                value={userAnswers[idx] || ''}
                                onChange={(e) => setUserAnswers({ ...userAnswers, [idx]: e.target.value })}
                                placeholder={t.answerPlaceholder}
                                className="w-full bg-[#f8f9fa] border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                      <button
                        onClick={() => setStage('capture')}
                        className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {t.backToInput}
                      </button>
                      <button
                        onClick={handleReflect}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>{t.submitReflection}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage('graph')}
                        className="py-2.5 px-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Watch Reasoning Graph"
                      >
                        <Network className="w-3.5 h-3.5 text-teal-600" />
                        <span className="hidden sm:inline">4. {t.stage4Title}</span>
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* ── STAGE 3: REFLECTION (With Empty State if not reflected yet) ── */}
              {!isLoading && stage === 'reflect' && (
                !isReflected && !reasoningMap ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center h-full space-y-4 my-auto">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
                      <BarChart3 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h3 className="text-base font-bold text-slate-800">{t.reflectionAwaitingData}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t.reflectionAwaitingSub}
                      </p>
                    </div>
                    <button
                      onClick={() => setStage('capture')}
                      className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{t.describeADecision}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col h-full justify-between space-y-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">Stage 3 of 3</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-300">
                            Reasoning Calibrated
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mt-1">{t.reflectionSummaryTitle}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {t.reflectionSummarySub}
                        </p>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-[#f8f9fa] border border-slate-300 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t.assumptionsVerified}</span>
                          <div className="text-base font-extrabold text-teal-700 mt-0.5">
                            {checkedCount} / {totalAssumptions}
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">{t.verifiedTag}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#f8f9fa] border border-slate-300 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t.branchesExplored}</span>
                          <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                            {totalOptions}
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">{t.exploredTag}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#f8f9fa] border border-slate-300 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t.adviceSlips}</span>
                          <div className="text-base font-extrabold text-teal-700 mt-0.5">
                            0
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">{t.neutralTag}</span>
                        </div>
                      </div>

                      {/* Confidence Slider */}
                      <div className="p-4 rounded-xl bg-white border border-slate-300 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t.confidenceRating}</span>
                          </span>
                          <span className="font-extrabold text-teal-800 px-2 py-0.5 rounded bg-teal-100 font-mono">
                            {confidenceScore} / 10
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={confidenceScore}
                          onChange={(e) => setConfidenceScore(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono font-medium">
                          <span>{t.uncertain}</span>
                          <span>{t.balanced}</span>
                          <span>{t.clear}</span>
                        </div>
                      </div>

                      {/* Verified Evidence Highlights */}
                      <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2 max-h-36 overflow-y-auto">
                        <div className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t.calibratedChecklist}</span>
                        </div>
                        <div className="space-y-1.5">
                          {reasoningMap?.assumptions && reasoningMap.assumptions.length > 0 ? (
                            reasoningMap.assumptions.map((a, idx) => (
                              <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${a.status === 'checked' ? 'bg-teal-600' : 'bg-rose-500'}`} />
                                <span>
                                  <strong className="text-slate-900">{a.statement}</strong>: {a.evidence || 'Remains unconfirmed.'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">No assumptions registered yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Safety Disclaimer */}
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[10px] text-slate-600 leading-relaxed flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>{t.safetyNoticeTitle}</strong> {t.safetyNoticeBody}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => setStage('interrogate')}
                        className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {t.editAnswers}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage('graph')}
                        className="py-2.5 px-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Watch Reasoning Graph"
                      >
                        <Network className="w-3.5 h-3.5 text-teal-600" />
                        <span>4. {t.stage4Title}</span>
                      </button>
                      <button
                        onClick={handleReset}
                        className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.startNewDecision}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage('decision')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[200px]"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>{t.proceedToFinalDecision}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ── STAGE 4: DEDICATED FULL REASONING GRAPH WORKSPACE ── */}
        {stage === 'graph' && (
          <div className="flex-1 w-full h-full bg-[#eef1f4] relative overflow-hidden flex flex-col">
            {/* Stage 4 Top Overlay Pill */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/95 border border-slate-300 text-xs font-bold text-slate-800 backdrop-blur-md flex items-center gap-2 shadow-sm">
                <Network className="w-4 h-4 text-teal-600" />
                <span>4. {t.stage4Title}</span>
                {reasoningMap && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-200">
                    {reasoningMap.options?.length || 0} {t.optionsCount} • {reasoningMap.assumptions?.length || 0} {t.assumptionsCount}
                  </span>
                )}
                {isReflected && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-300">
                    <ShieldCheck className="w-3 h-3 text-teal-600" /> {t.verifiedTag}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setStage('decision')}
                  className="ml-1 sm:ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                  title="Proceed to calibrated decision synthesis"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">5. {t.stage5Title}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Stage 4 Content */}
            {!reasoningMap && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-600 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-300 flex items-center justify-center text-teal-600 mb-4 shadow-sm">
                  <Network className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {language === 'hi' ? 'तर्क ग्राफ अभी उत्पन्न नहीं हुआ है' : 'Reasoning Graph Awaiting Dilemma'}
                </h3>
                <p className="text-xs max-w-md text-slate-500 mb-5 leading-relaxed">
                  {language === 'hi'
                    ? 'चरण 1 में अपने निर्णय का वर्णन करें या तर्क ग्राफ को देखने के लिए एक उदाहरण दुविधा लोड करें।'
                    : 'Describe your dilemma in Stage 1 or load a sample dilemma to watch the interactive logic tree in action.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStage('capture')}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    1. {t.stage1Title}
                  </button>
                  <button
                    onClick={() => {
                      setUserInput(EXAMPLE_PROMPTS[0].text);
                      handleAnalyze(EXAMPLE_PROMPTS[0].text);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'उदाहरण दुविधा चलाएं' : 'Load Sample Dilemma Graph'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 w-full h-full relative">
                <GraphCanvas 
                  reasoningMap={reasoningMap} 
                  isReflected={isReflected} 
                />
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 5: WHAT WE HAVE DECIDED ── */}
        {stage === 'decision' && (
          <WhatWeHaveDecided
            reasoningMap={reasoningMap}
            questions={questions}
            userAnswers={userAnswers}
            confidenceScore={confidenceScore}
            setConfidenceScore={setConfidenceScore}
            t={t}
            language={language}
            onNavigate={setStage}
            onReset={handleReset}
            isReflected={isReflected}
          />
        )}
      </div>
      {/* ── Logout Confirmation Dialog ─────────────────────────── */}
      {isConfirmLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'hi' ? 'लॉग आउट की पुष्टि करें' : 'Log out of Decision Mirror?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi'
                    ? 'आप अतिथि मोड में जारी रख सकते हैं या बाद में पुनः लॉग इन कर सकते हैं।'
                    : 'You can continue exploring as guest or log back in anytime.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmLogoutOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Modal (Sign In / Register) ─────────────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative space-y-5">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {authMode === 'login' 
                    ? (language === 'hi' ? 'डिसीजन मिरर में लॉग इन करें' : 'Sign in to Decision Mirror') 
                    : (language === 'hi' ? 'नया खाता बनाएं' : 'Create an Account')}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'सटीक सोच और तर्क विश्लेषण के लिए' : 'Your socratic thinking companion'}
                </p>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'hi' ? 'लॉग इन' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'hi' ? 'रजिस्टर करें' : 'Register'}
              </button>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Alex Sharma"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'ईमेल' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {authMode === 'login' && (
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="text-slate-400">
                    {language === 'hi' ? 'डेमो पासवर्ड: demo1234' : 'Demo password: demo1234'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail('demo@decisionmirror.ai');
                      setAuthPassword('demo1234');
                    }}
                    className="text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
                  >
                    {language === 'hi' ? 'डेमो क्रेडेंशियल भरें' : 'Use Demo Account'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : authMode === 'login' ? (
                  <LogIn className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {authMode === 'login' 
                    ? (language === 'hi' ? 'लॉग इन करें' : 'Sign In') 
                    : (language === 'hi' ? 'खाता बनाएं' : 'Create Account')}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast notification for auth feedback ─────────────────── */}
      {authFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{authFeedback}</span>
        </div>
      )}
    </div>
  );
}
