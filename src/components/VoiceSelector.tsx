import React from 'react';
import { Mic, Radio, Sparkles, UserCheck, Flame, BookOpen, Volume2 } from 'lucide-react';

export interface VoiceOption {
  id: string;
  nameFa: string;
  persona: string;
  gender: 'female' | 'male';
  bestFor: string;
  tag: string;
}

export const VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    nameFa: 'کُورِه (Kore)',
    persona: 'شیوا، رسا و واضح با لحن دلنشین و گویندگی استاندارد',
    gender: 'female',
    bestFor: 'بهترین انتخاب برای محتوای آموزشی، اینستاگرام و معرفی ابزار',
    tag: 'پیش‌نهاد طلایی',
  },
  {
    id: 'Puck',
    nameFa: 'پاک (Puck)',
    persona: 'پرانرژی، پویا، جوان و با انگیزه',
    gender: 'male',
    bestFor: 'عالی برای ویدیوهای ریلز، تیک‌تاک و اکسپلور با سرعت بالا',
    tag: 'مخصوص ریلز',
  },
  {
    id: 'Fenrir',
    nameFa: 'فِنریر (Fenrir)',
    persona: 'عمیق، مقتدر، جدی و با طنین بم و حرفه‌ای',
    gender: 'male',
    bestFor: 'مناسب معرفی رسمی ابزارهای فنی، امنیت و شبکه',
    tag: 'رسمی و فنی',
  },
  {
    id: 'Zephyr',
    nameFa: 'زِفیر (Zephyr)',
    persona: 'دوستانه، صمیمی، آرام و دلنشین',
    gender: 'female',
    bestFor: 'مناسب پادکست‌های کوتاه، وبینار و آموزش‌های دوستانه',
    tag: 'صمیمی',
  },
  {
    id: 'Charon',
    nameFa: 'کارون (Charon)',
    persona: 'متین، فاخر، رادیویی و کلاسیک',
    gender: 'male',
    bestFor: 'گویندگی نریشن و مستندهای تکنولوژی',
    tag: 'نریشن',
  },
];

export interface StyleOption {
  id: 'reels_colloquial' | 'educational' | 'formal' | 'friendly';
  titleFa: string;
  descFa: string;
  icon: typeof Flame;
}

export const STYLES: StyleOption[] = [
  {
    id: 'reels_colloquial',
    titleFa: 'ریلز و اینستاگرام (محاوره‌ای روان)',
    descFa: 'بیان جذاب، سریع و بدون تپق برای جذب مخاطب در شبکه‌های اجتماعی',
    icon: Flame,
  },
  {
    id: 'educational',
    titleFa: 'آموزشی و گام‌به‌گام',
    descFa: 'تأکید دقیق روی مراحل نصب و جستجوی متن در فایرفاکس',
    icon: BookOpen,
  },
  {
    id: 'formal',
    titleFa: 'رسمی و گویندگی رادیو',
    descFa: 'بیان فاخر و واژگان معیار مناسب پلتفرم‌های رسمی',
    icon: Radio,
  },
  {
    id: 'friendly',
    titleFa: 'دوستانه و صمیمی',
    descFa: 'لحن خودمانی و انتقال تجربه کاربری ساده',
    icon: UserCheck,
  },
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  selectedStyle: 'reels_colloquial' | 'educational' | 'formal' | 'friendly';
  onSelectStyle: (style: 'reels_colloquial' | 'educational' | 'formal' | 'friendly') => void;
  onInsertTag?: (tag: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedStyle,
  onSelectStyle,
  onInsertTag,
}) => {
  return (
    <div className="space-y-5">
      {/* Voice selection */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-indigo-400" />
          انتخاب گوینده هوش مصنوعی (مدل صوتی Gemini 3.8 Flash TTS)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {VOICES.map((v) => {
            const isSelected = selectedVoice === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVoice(v.id)}
                className={`relative text-right p-3 rounded-xl border transition text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Volume2 className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {v.nameFa}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {v.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">
                    {v.persona}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  {v.bestFor}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Style & Tone selection */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          لحن و نحوه ادای کلمات
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STYLES.map((st) => {
            const Icon = st.icon;
            const isSelected = selectedStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStyle(st.id)}
                className={`p-2.5 rounded-xl border text-right transition ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-slate-200">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{st.titleFa}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {st.descFa}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vocal burst tags inserter supported by Gemini 3.8 Flash TTS */}
      {onInsertTag && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            افزودن برچسب‌های تنفس و مکث صوتی جمینای:
          </span>
          <button
            type="button"
            onClick={() => onInsertTag('<breath>')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
            title="افزودن صدای نفس کشیدن طبیعی"
          >
            + &lt;breath&gt;
          </button>
          <button
            type="button"
            onClick={() => onInsertTag('<pause>')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
            title="افزودن مکث کوتاه بین جملات"
          >
            + &lt;pause&gt;
          </button>
          <button
            type="button"
            onClick={() => onInsertTag('<laugh>')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
            title="افزودن لحن لبخند یا خنده ملایم"
          >
            + &lt;laugh&gt;
          </button>
        </div>
      )}
    </div>
  );
};
