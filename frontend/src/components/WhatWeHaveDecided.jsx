import React, { useState, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  Download,
  Copy,
  Check,
  FileText,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Sliders,
  Flame,
  Network,
  Info,
  ChevronRight,
  HelpCircle,
  Clock,
  Users
} from 'lucide-react';

export default function WhatWeHaveDecided({
  reasoningMap,
  questions = [],
  userAnswers = {},
  confidenceScore = 8,
  setConfidenceScore,
  t,
  language = 'en',
  onNavigate,
  onReset
}) {
  // Chosen Option selection state
  const options = reasoningMap?.options || [];
  const [selectedOption, setSelectedOption] = useState(() => {
    return options.length > 0 ? options[0].name : 'Option A';
  });
  
  // Custom rationale input
  const [calibratedRationale, setCalibratedRationale] = useState(() => {
    try {
      const saved = localStorage.getItem('dm_calibrated_rationale');
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return '';
  });

  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Pillar 1: Evidence calculation (Facts vs Feelings vs Guesses)
  const evidenceStats = useMemo(() => {
    let facts = 0;
    let feelings = 0;
    let guesses = 0;
    const factItems = [];

    if (reasoningMap?.options) {
      reasoningMap.options.forEach((opt) => {
        (opt.reasons || []).forEach((r) => {
          if (r.type === 'fact') {
            facts++;
            factItems.push({ text: r.text, option: opt.name });
          } else if (r.type === 'feeling') {
            feelings++;
          } else if (r.type === 'guess') {
            guesses++;
          }
        });
      });
    }

    const total = facts + feelings + guesses || 1;
    const factPct = Math.round((facts / total) * 100);
    const feelPct = Math.round((feelings / total) * 100);
    const guessPct = Math.round((guesses / total) * 100);

    return {
      facts,
      feelings,
      guesses,
      total: facts + feelings + guesses,
      factPct,
      feelPct,
      guessPct,
      factItems
    };
  }, [reasoningMap]);

  // Pillar 2: Assumptions audit
  const assumptions = reasoningMap?.assumptions || [];
  const checkedAssumptions = assumptions.filter((a) => a.status === 'checked');
  const uncheckedAssumptions = assumptions.filter((a) => a.status !== 'checked' && a.status !== 'unverifiable');
  const unverifiableAssumptions = assumptions.filter((a) => a.status === 'unverifiable');

  // Pillar 3: Premortem & Downside response from user answers
  const premortemData = useMemo(() => {
    // Find question targeting premortem or worst-case
    let qIdx = questions.findIndex(
      (q) => q.method === 'premortem' || q.gap_name?.toLowerCase().includes('worst')
    );
    if (qIdx === -1 && questions.length > 2) {
      qIdx = 2; // Default 3rd Socratic inquiry question is premortem
    }

    const questionObj = qIdx !== -1 ? questions[qIdx] : null;
    const answerText = qIdx !== -1 ? userAnswers[qIdx] : null;

    return {
      question: questionObj ? questionObj.question : 'What worst-case failure mode was evaluated?',
      answer: answerText || (language === 'hi' ? 'कोई आपातकालीन उत्तर दर्ज नहीं किया गया।' : 'No worst-case contingency recorded yet.'),
      hasAnswer: Boolean(answerText && answerText.trim().length > 3)
    };
  }, [questions, userAnswers, language]);

  // Handle rationale save
  const handleRationaleChange = (val) => {
    setCalibratedRationale(val);
    try {
      localStorage.setItem('dm_calibrated_rationale', val);
    } catch (e) {
      // ignore
    }
  };

  // Generate markdown export content
  const generateExportText = () => {
    const dateStr = new Date().toLocaleDateString();
    return `# DECISION RECORD: ${reasoningMap?.decision_summary || 'Calibrated Decision'}
Date: ${dateStr}
Evaluation Framework: Decision Mirror Socratic Reflection Engine
Clarity & Confidence Score: ${confidenceScore}/10

---

## 1. CORE DILEMMA & EVALUATED OPTIONS
- Dilemma: ${reasoningMap?.decision_summary || 'N/A'}
- Timeframe: ${reasoningMap?.timeframe || 'Not specified'}
- Stakeholders: ${(reasoningMap?.stakeholders || []).join(', ') || 'Self'}
- Evaluated Options:
${options.map((o, idx) => `  ${idx + 1}. ${o.name}`).join('\n')}

---

## 2. CHOSEN PATH & CALIBRATED RATIONALE
- Selected Path: ${selectedOption}
- Calibrated Rationale:
${calibratedRationale || 'Rationale based on verified evidence and stress-tested blind spots.'}

---

## 3. PILLAR 1: VERIFIED EVIDENCE BALANCE
- Grounded Facts: ${evidenceStats.facts} (${evidenceStats.factPct}%)
- Emotional Drivers: ${evidenceStats.feelings} (${evidenceStats.feelPct}%)
- Unverified Guesses: ${evidenceStats.guesses} (${evidenceStats.guessPct}%)

Key Confirmed Facts:
${evidenceStats.factItems.map((f) => `- [${f.option}] ${f.text}`).join('\n') || '- None specifically tagged as fact.'}

---

## 4. PILLAR 2: ASSUMPTION AUDIT
- Total Extracted Assumptions: ${assumptions.length}
- Verified / Checked: ${checkedAssumptions.length}
- Unchecked / Speculative: ${uncheckedAssumptions.length}

Audited Items:
${assumptions.map((a) => `- [${a.status.toUpperCase()}] ${a.statement} ${a.evidence ? `(Evidence: ${a.evidence})` : ''}`).join('\n') || '- No explicit assumptions logged.'}

---

## 5. PILLAR 3: PREMORTEM & DOWNSIDE RESILIENCE
- Failure Mode Inquiry: "${premortemData.question}"
- Tested Contingency / Answer:
"${premortemData.answer}"

---
*Notice: Decision Mirror is an introspective cognitive companion. This record reflects your verified synthesis and does not constitute unsolicited prescriptive advice.*
`;
  };

  const handleCopy = () => {
    const text = generateExportText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decision-record-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="flex-1 w-full bg-slate-50/60 overflow-y-auto flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-6">

        {/* ── HEADER & CONTEXT CARD ──────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Stage 5
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• Calibrated Synthesis</span>
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {t.stage5Title}
                </h1>
              </div>
            </div>

            {/* Quick Export / Copy Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                title="Copy markdown decision record to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? (language === 'hi' ? 'कॉपी हो गया!' : 'Copied!') : t.copySummary}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20 cursor-pointer"
                title="Download decision record as Markdown"
              >
                {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloadSuccess ? (language === 'hi' ? 'सहेजा गया!' : 'Downloaded!') : t.exportSummary}</span>
              </button>
            </div>
          </div>

          {/* Dilemma Summary & Evaluated Options */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {language === 'hi' ? 'मूल दुविधा और संदर्भ' : 'Evaluated Dilemma & Context'}
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold leading-relaxed">
              "{reasoningMap?.decision_summary || 'No decision entered yet. Please complete Stage 1 to analyze your dilemma.'}"
            </div>

            {/* Options Badges & Metadata */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                {language === 'hi' ? 'मूल्यांकित विकल्प:' : 'Evaluated Options:'}
              </span>
              {options.length > 0 ? (
                options.map((opt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    {opt.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Option A vs Option B</span>
              )}

              {reasoningMap?.timeframe && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium ml-auto">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {reasoningMap.timeframe}
                </span>
              )}
            </div>
          </div>

          {/* Advice Guard Policy Banner */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>{language === 'hi' ? 'एडवाइस गार्ड सक्रिय:' : 'Advice Guard Active:'}</strong>{' '}
              {t.adviceGuardNotice}
            </div>
          </div>
        </div>

        {/* ── 4 CORE PILLARS GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── PILLAR 1: VERIFIED EVIDENCE BALANCE ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                <Scale className="w-4 h-4 text-teal-600" />
                <span>{t.pillar1Title}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {t.pillar1Sub}
              </p>
            </div>

            {/* Evidence Ratio Visual Bar */}
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Facts ({evidenceStats.factPct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Feelings ({evidenceStats.feelPct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Guesses ({evidenceStats.guessPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200">
                <div
                  style={{ width: `${Math.max(evidenceStats.factPct, 5)}%` }}
                  className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                  title={`Facts: ${evidenceStats.facts}`}
                />
                <div
                  style={{ width: `${Math.max(evidenceStats.feelPct, 5)}%` }}
                  className="h-full bg-amber-500 transition-all duration-500"
                  title={`Feelings: ${evidenceStats.feelings}`}
                />
                <div
                  style={{ width: `${Math.max(evidenceStats.guessPct, 5)}%` }}
                  className="h-full rounded-r-full bg-purple-500 transition-all duration-500"
                  title={`Guesses: ${evidenceStats.guesses}`}
                />
              </div>
            </div>

            {/* Confirmed Grounded Facts */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>{language === 'hi' ? 'पुष्ट आधारभूत तथ्य:' : 'Key Confirmed Facts:'}</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                  {evidenceStats.facts} Verified
                </span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {evidenceStats.factItems.length > 0 ? (
                  evidenceStats.factItems.map((f, idx) => (
                    <div key={idx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">{f.option}:</strong> {f.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {language === 'hi'
                      ? 'पूछताछ चरण में अपने उत्तरों के साथ सत्यापित डेटा बिंदु जोड़ें।'
                      : 'Add verified numerical data points in Stage 2 to elevate grounded facts.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── PILLAR 2: ASSUMPTION AUDIT STATUS ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{t.pillar2Title}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {t.pillar2Sub}
              </p>
            </div>

            {/* Status Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-center">
                <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'जांची गई मान्यताएं' : 'Checked Hypotheses'}
                </span>
                <div className="text-lg font-black text-teal-900 mt-0.5">
                  {checkedAssumptions.length} / {assumptions.length}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-center">
                <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wide">
                  {language === 'hi' ? 'असत्यापित अटकलें' : 'Unconfirmed Speculations'}
                </span>
                <div className="text-lg font-black text-rose-900 mt-0.5">
                  {uncheckedAssumptions.length}
                </div>
              </div>
            </div>

            {/* Assumptions List */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700">
                {language === 'hi' ? 'मान्यता परीक्षा परिणाम:' : 'Audit Breakdown:'}
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {assumptions.length > 0 ? (
                  assumptions.map((a, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                        a.status === 'checked'
                          ? 'bg-teal-50/50 border-teal-200 text-teal-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          a.status === 'checked' ? 'bg-teal-600' : 'bg-rose-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1 leading-snug">
                        <span className="font-semibold">{a.statement}</span>
                        {a.evidence && (
                          <div className="text-[10px] text-teal-700 font-medium mt-0.5">
                            Data: {a.evidence}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase shrink-0 text-slate-400">
                        {a.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No assumptions registered yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── PILLAR 3: PREMORTEM & DOWNSIDE RESILIENCE ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                <Flame className="w-4 h-4 text-teal-600" />
                <span>{t.pillar3Title}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {t.pillar3Sub}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {language === 'hi' ? 'जांचा गया विफलता प्रश्न:' : 'Stress-Tested Failure Mode:'}
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                "{premortemData.question}"
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-1.5">
              <div className="text-[10px] font-bold text-teal-900 uppercase tracking-wide flex items-center justify-between">
                <span>{language === 'hi' ? 'सत्यापित बैकअप व सहिष्णुता:' : 'Verified Contingency & Risk Tolerance:'}</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                  {premortemData.hasAnswer ? 'Recorded' : 'Awaiting Input'}
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                "{premortemData.answer}"
              </p>
            </div>
          </div>

          {/* ── PILLAR 4: CALIBRATED DECISION SELECTION & RATIONALE ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                  <ClipboardCheck className="w-4 h-4 text-teal-600" />
                  <span>{t.pillar4Title}</span>
                </div>
                {/* Clarity score badge */}
                <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-extrabold text-xs font-mono border border-teal-300 shadow-2xs">
                  {confidenceScore} / 10 Clarity
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {t.pillar4Sub}
              </p>
            </div>

            {/* Interactive Decision Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {t.selectChosenOption}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(opt.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                      selectedOption === opt.name
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {selectedOption === opt.name && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedOption('Synthesized / Third Way')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedOption === 'Synthesized / Third Way'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="truncate">{language === 'hi' ? 'संश्लेषित तीसरा मार्ग' : 'Synthesized / Third Way'}</span>
                  {selectedOption === 'Synthesized / Third Way' && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              </div>
            </div>

            {/* Calibrated Rationale Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {language === 'hi' ? 'कैलिब्रेटेड तर्क और निष्कर्ष:' : 'Calibrated Rationale:'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'स्वतः सहेजा गया' : 'Auto-saved'}
                </span>
              </div>
              <textarea
                rows={3}
                value={calibratedRationale}
                onChange={(e) => handleRationaleChange(e.target.value)}
                placeholder={t.rationalePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAVIGATION & ACTIONS ────────────────────────────────── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('reflect')}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              ← 3. {t.stage3Title}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('graph')}
              className="py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Network className="w-3.5 h-3.5 text-teal-600" />
              <span>4. {t.stage4Title}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onReset}
              className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.startNewDecision}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'hi' ? 'निर्णय दस्तावेज़ निर्यात करें' : 'Export Decision Document'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
