import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Wand2, Copy, Check, Info, FileText, Layers, ArrowLeft } from 'lucide-react';

interface TextInspectorProps {
  currentText: string;
  onChangeText: (text: string) => void;
  rawText: string;
  reelsVersion: string;
  formalVersion: string;
  phoneticVersion: string;
  corrections: { original: string; fixed: string; explanation: string }[];
  pronunciationTips: { term: string; phoneticFa: string; tip: string }[];
  wordCount: number;
  estimatedDuration: number;
  isRefining: boolean;
  onTriggerAiRefine: () => void;
}

export const TextInspector: React.FC<TextInspectorProps> = ({
  currentText,
  onChangeText,
  rawText,
  reelsVersion,
  formalVersion,
  phoneticVersion,
  corrections,
  pronunciationTips,
  wordCount,
  estimatedDuration,
  isRefining,
  onTriggerAiRefine,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'raw' | 'formal' | 'phonetic'>('current');
  const [isCopied, setIsCopied] = useState(false);
  const [showCorrectionsDetails, setShowCorrectionsDetails] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const selectVersion = (version: string, tab: 'current' | 'raw' | 'formal' | 'phonetic') => {
    setActiveTab(tab);
    onChangeText(version);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto flex-nowrap max-w-full">
          <button
            type="button"
            onClick={() => selectVersion(reelsVersion || currentText, 'current')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'current'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            متن روان (بدون غلط و تپق)
          </button>

          <button
            type="button"
            onClick={() => selectVersion(formalVersion, 'formal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'formal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            نسخه رسمی
          </button>

          <button
            type="button"
            onClick={() => selectVersion(phoneticVersion, 'phonetic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'phonetic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            اعراب‌گذاری تلفظی
          </button>

          <button
            type="button"
            onClick={() => selectVersion(rawText, 'raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === 'raw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            متن اولیه
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTriggerAiRefine}
            disabled={isRefining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition disabled:opacity-50"
            title="بررسی دوباره متن با هوش مصنوعی Gemini 3.8 Flash"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isRefining ? 'animate-spin' : ''}`} />
            {isRefining ? 'در حال تحلیل...' : 'اصلاح هوشمند مجدد'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title="کپی متن"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'کپی شد' : 'کپی'}
          </button>
        </div>
      </div>

      {/* Editable Text Area */}
      <div className="relative mb-3">
        <textarea
          rows={7}
          value={currentText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="متن فارسی خود را اینجا تایپ کنید یا تغییر دهید..."
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-slate-100 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-['Vazirmatn'] transition shadow-inner resize-y"
        />
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-2 px-1">
          <div className="flex items-center gap-4">
            <span>تعداد کلمات: <strong className="text-slate-200">{wordCount}</strong></span>
            <span>تخمین زمان گویندگی: <strong className="text-indigo-300">{estimatedDuration} ثانیه</strong></span>
          </div>
          <span className="text-[11px] text-slate-500">
            برای تبدیل به صوت، متن بالا به عنوان ورودی مدل ارسال می‌شود
          </span>
        </div>
      </div>

      {/* Corrections and Pronunciation Guidance Section */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200">
              اصلاحات و نکات تلفظی کشف‌شده برای خوانش روان
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              {corrections.length} مورد اصلاح شده
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowCorrectionsDetails(!showCorrectionsDetails)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
          >
            {showCorrectionsDetails ? 'پنهان کردن جزئیات' : 'نمایش جزئیات اصلاحات'}
          </button>
        </div>

        {showCorrectionsDetails && (
          <div className="space-y-3">
            {/* Corrections Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {corrections.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="line-through text-rose-400 font-semibold text-[11px] bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-800/40">
                      «{item.original}»
                    </span>
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-emerald-300 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      «{item.fixed}»
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>

            {/* Pronunciation tips for tech terms */}
            {pronunciationTips.length > 0 && (
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 mt-2">
                <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 mb-2">
                  <Info className="w-3.5 h-3.5" />
                  راهنمای تلفظ واژگان تخصصی و انگلیسی در متن فارسی:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pronunciationTips.map((tip, i) => (
                    <div key={i} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 text-[11px]">
                      <div className="font-bold text-slate-100">{tip.term}</div>
                      <div className="text-indigo-300 text-[11px] font-medium mt-0.5">{tip.phoneticFa}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{tip.tip}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
