
import React, { useState } from 'react';
import { X, Mail, Check, UserPlus } from 'lucide-react';

interface ShareModalProps {
  clientName: string;
  currentEmail?: string;
  onShare: (email: string) => void;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ clientName, currentEmail, onShare, onClose }) => {
  const [email, setEmail] = useState(currentEmail || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onShare(email);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <UserPlus className="text-emerald-500" size={20}/>
                שיתוף גישה לתיק
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
        </div>
        
        <div className="p-6">
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                הענקת גישה לתיק של <strong>{clientName}</strong>. 
                <br/>
                הלקוח יוכל להתחבר למערכת עם כתובת האימייל הזו ולצפות/לערוך את הנתונים בדאשבורד שלו.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">כתובת אימייל של הלקוח</label>
                    <div className="relative">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 pl-10 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition"
                            placeholder="client@example.com"
                            autoFocus
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition">
                        <Check size={18}/>
                        שמור גישה
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
