
import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  onStartTour: () => void; // New prop
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, onStartTour }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'faq'>('guide');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "האם המידע שלי מאובטח?",
      answer: "המערכת מבוססת על תשתית Supabase ומיישמת מדיניות אבטחה ברמת השורה (RLS), המבטיחה הפרדה מוחלטת בין משתמשים. המידע שלכם מוצפן בתקנים מחמירים (AES-256 במנוחה ו-TLS במעבר), וגישה אליו מתאפשרת אך ורק לאחר אימות זהותכם ובכפוף להרשאות הגישה האישיות שלכם."
    },
    {
      question: "האם המידע משותף עם גורמים אחרים?",
      answer: "לא. המידע הפיננסי שלכם הוא שלכם בלבד. איננו מוכרים, משתפים או מעבירים מידע לאף גורם מסחרי, בנקים או גופי פרסום."
    },
    {
      question: "איך מוסיפים משתמש נוסף?",
      answer: "ניתן ללחוץ על כפתור החלפת הפרופיל (ליד השם שלכם למעלה) ואז לבחור ב'הוסף פרופיל'. לאחר בחירת שם, יפתח דאשבורד חדש ונקי עבור המשתמש הנוסף."
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <HelpCircle className="text-emerald-500" />
                מרכז עזרה ותמיכה
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'guide' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <BookOpen size={18} />
                מדריך למשתמש
            </button>
            <button 
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'faq' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <ShieldCheck size={18} />
                שאלות ותשובות (אבטחה)
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
            {activeTab === 'guide' ? (
                <div className="space-y-8 pb-8">
                    <section>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">👋 ברוכים הבאים לפוקוס פיננסי</h3>
                        <p className="text-slate-600 leading-relaxed">
                            המערכת מאפשרת לכם לקבל תמונת מצב מלאה על הנכסים, ההתחייבויות והתזרים שלכם במקום אחד.
                            המטרה היא לעזור לכם לקבל החלטות מושכלות ולצמוח כלכלית.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h4 className="font-bold text-slate-800">הוספת נכסים</h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    עברו בין הטאבים השונים (עו"ש, פנסיה, השקעות, נדל"ן) והוסיפו את הנכסים שלכם. 
                                    אל תשכחו לעדכן שווי מדי פעם כדי לראות גרף התקדמות.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h4 className="font-bold text-slate-800">ניהול תזרים</h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    במסך "תזרים מזומנים" הזינו את ההכנסות וההוצאות החודשיות. המערכת תחשב עבורכם כמה נשאר בסוף החודש ("נטו תזרים") לאחר קיזוז החזרי הלוואות אוטומטי.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h4 className="font-bold text-slate-800">סימולציות ותחזיות</h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    השתמשו במחשבונים המתקדמים (פרישה, דמי ניהול, ריבית דריבית) כדי לתכנן את העתיד ולחסוך בעלויות.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <button 
                            onClick={() => { onClose(); onStartTour(); }}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition transform hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            <PlayCircle size={24} />
                            הפעל הדרכה אינטראקטיבית על המערכת
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-2">ההדרכה תיקח אתכם צעד צעד דרך מסכי המערכת</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                            <button 
                                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition text-right font-bold text-slate-700"
                            >
                                <span>{faq.question}</span>
                                {openFaqIndex === idx ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </button>
                            {openFaqIndex === idx && (
                                <div className="p-4 bg-white text-slate-600 text-sm leading-relaxed border-t border-slate-100 animate-fade-in">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                        <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
                        <h4 className="font-bold text-emerald-800">פרטיות מובטחת</h4>
                        <p className="text-xs text-emerald-600 mt-1">המידע נשמר מוצפן ופרטי לחלוטין.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
