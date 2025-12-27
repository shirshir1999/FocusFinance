
import React from 'react';
import { Shield, AlertTriangle, Lock, FileText, Check } from 'lucide-react';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 text-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FileText size={32} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">ברוכים הבאים לפוקוס פיננסי</h2>
            <p className="text-slate-500 text-sm">לפני שמתחילים, אנא אשרו את תנאי השימוש</p>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1 text-right">
            
            <div className="flex gap-4">
                <div className="shrink-0 mt-1"><AlertTriangle className="text-amber-500" size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">הבהרה משפטית חשובה</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        המערכת מהווה כלי עזר לניהול ומעקב אישי בלבד. 
                        <strong> המידע המוצג אינו מהווה ייעוץ השקעות, ייעוץ פנסיוני, ייעוץ מס או תחליף לייעוץ מקצועי </strong> 
                        המתחשב בצרכים המיוחדים של כל אדם. כל פעולה שתבצעו על סמך המידע היא באחריותכם הבלעדית.
                    </p>
                </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div className="flex gap-4">
                <div className="shrink-0 mt-1"><Shield className="text-emerald-500" size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">פרטיות המידע</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        המידע הפיננסי שאתם מזינים הוא שלכם בלבד. איננו סוחרים במידע, לא מעבירים אותו לצד שלישי ולא משתמשים בו לצרכים מסחריים.
                    </p>
                </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div className="flex gap-4">
                <div className="shrink-0 mt-1"><Lock className="text-blue-500" size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">אבטחת מידע</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        המערכת פועלת על תשתית ענן מאובטחת. המידע נשמר באופן מוצפן והגישה אליו מתאפשרת אך ורק באמצעות חשבון הגוגל האישי שלכם.
                    </p>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
            <button 
                onClick={onAccept}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
                <Check size={20} />
                קראתי ואני מאשר/ת
            </button>
        </div>

      </div>
    </div>
  );
};

export default TermsModal;
