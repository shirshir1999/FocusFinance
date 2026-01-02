
import React, { useState } from 'react';
import { X, Users, Trash2, Shield, UserCheck } from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorizedEmails: string[];
  ownerId: string;
  currentUserId: string;
  onRevoke: (email: string) => void;
  onAdd?: (email: string) => void; // Optional future feature
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ 
    isOpen, onClose, authorizedEmails, ownerId, currentUserId, onRevoke 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <Shield className="text-emerald-500" size={20}/>
                    ניהול הרשאות גישה
                </h3>
                <p className="text-xs text-slate-500 mt-1">מי יכול לצפות ולערוך את התיק הזה?</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
        </div>
        
        <div className="p-6">
            <div className="space-y-3">
                {authorizedEmails.length === 0 ? (
                    <div className="text-center text-slate-400 py-4 text-sm">
                        רק הבעלים של התיק מורשים לצפות בו.
                    </div>
                ) : (
                    authorizedEmails.map((email) => (
                        <div key={email} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <UserCheck size={16}/>
                                </div>
                                <span className="text-sm font-bold text-slate-700">{email}</span>
                            </div>
                            
                            {/* Allow revocation only if viewing user is NOT the one being removed (can't remove self here) */}
                            {/* In a real app, logic might differ, but typically client removes advisor */}
                            <button 
                                onClick={() => onRevoke(email)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="הסר גישה"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-xs rounded-xl leading-relaxed border border-blue-100">
                <strong>שים לב:</strong> הסרת משתמש מהרשימה תחסום את גישתו לתיק זה באופן מיידי.
                אם זהו התיק שלכם, ואתם מסירים את היועץ, הוא לא יוכל יותר לראות או לעדכן נתונים עבורכם.
            </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;
