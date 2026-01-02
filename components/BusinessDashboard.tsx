
import React, { useState } from 'react';
import { ManagedClient } from '../types';
import { Plus, Users, Search, ChevronLeft, Briefcase, UserCircle, Share2, LayoutDashboard, Trash2, AlertCircle } from 'lucide-react';
import ShareModal from './ShareModal';

interface BusinessDashboardProps {
  clients: ManagedClient[];
  onSelectClient: (clientId: string) => void;
  onAddClient: (name: string, email: string) => void;
  onShareClient: (clientId: string, email: string) => void;
  onDeleteClient: (clientId: string) => void; // New Prop
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ clients, onSelectClient, onAddClient, onShareClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  
  // Sharing state
  const [shareModalClient, setShareModalClient] = useState<ManagedClient | null>(null);
  
  // Delete State
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<ManagedClient | null>(null);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Email is now mandatory to ensure linking works
      if(newClientName && newClientEmail) {
          onAddClient(newClientName, newClientEmail);
          setNewClientName('');
          setNewClientEmail('');
          setIsAddOpen(false);
      }
  };

  const handleConfirmDelete = () => {
      if (deleteConfirmClient) {
          onDeleteClient(deleteConfirmClient.id);
          setDeleteConfirmClient(null);
      }
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in pb-20 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <Briefcase className="text-slate-800" size={32} />
                    פורטל יועצים
                </h1>
                <p className="text-slate-500 mt-1">ניהול תיקי לקוחות ומשתמשים</p>
            </div>
            
            <button 
                onClick={() => setIsAddOpen(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition transform hover:-translate-y-1"
            >
                <Plus size={20}/>
                הקמת לקוח חדש
            </button>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center px-4">
                <Search className="text-slate-400 ml-3" size={20}/>
                <input 
                    type="text" 
                    placeholder="חיפוש לקוח לפי שם..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent outline-none py-2 text-slate-700 font-medium"
                />
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-600 flex items-center gap-2"><Users size={18}/> סה"כ לקוחות</span>
                <span className="text-xl font-black text-slate-800">{clients.length}</span>
            </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isAddOpen && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl animate-fade-in shadow-md">
                    <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="bg-emerald-200 rounded-full p-0.5"/> 
                        פרטי לקוח חדש
                    </h3>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-emerald-700 mb-1">שם הלקוח</label>
                            <input 
                                type="text" 
                                autoFocus
                                required
                                value={newClientName} 
                                onChange={(e) => setNewClientName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="ישראל ישראלי"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-emerald-700 mb-1">אימייל (חובה לחיבור התיק)</label>
                            <input 
                                type="email" 
                                required
                                value={newClientEmail} 
                                onChange={(e) => setNewClientEmail(e.target.value)}
                                className="w-full p-3 rounded-xl border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="client@gmail.com"
                            />
                            <p className="text-[10px] text-emerald-600 mt-1">התיק יקושר אוטומטית לחשבון הגוגל של הלקוח עם אימייל זה.</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-2 text-slate-500 font-bold bg-white rounded-xl border border-slate-200 hover:bg-slate-50">ביטול</button>
                            <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md">צור תיק</button>
                        </div>
                    </form>
                </div>
            )}

            {filteredClients.map(client => (
                <div key={client.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group flex flex-col justify-between min-h-[180px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xl group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                {client.name[0]}
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setShareModalClient(client)}
                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 transition"
                                    title="הגדרות שיתוף"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button 
                                    onClick={() => setDeleteConfirmClient(client)}
                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition"
                                    title="מחיקת לקוח"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{client.name}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1.5 mb-4">
                            <UserCircle size={14}/> 
                            {client.email || 'לא הוגדר אימייל'}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => onSelectClient(client.id)}
                        className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition group-hover:shadow-md"
                    >
                        <LayoutDashboard size={18}/>
                        כניסה לדאשבורד
                        <ChevronLeft size={16} className="opacity-60"/>
                    </button>
                </div>
            ))}
            
            {filteredClients.length === 0 && !isAddOpen && (
                <div className="col-span-full py-12 text-center text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-30"/>
                    <p>לא נמצאו לקוחות. צור את הלקוח הראשון שלך!</p>
                </div>
            )}
        </div>

        {shareModalClient && (
            <ShareModal 
                clientName={shareModalClient.name}
                currentEmail={shareModalClient.email}
                onShare={(email) => {
                    onShareClient(shareModalClient.id, email);
                    setShareModalClient(null);
                }}
                onClose={() => setShareModalClient(null)}
            />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmClient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfirmClient(null)}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="font-black text-2xl text-slate-800 mb-2">מחיקת לקוח</h3>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        האם אתם בטוחים שברצונכם למחוק את <strong>{deleteConfirmClient.name}</strong>? 
                        <br/>
                        הפעולה תמחק את כל הנתונים הפיננסיים המשויכים לתיק זה ולא ניתנת לשחזור.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setDeleteConfirmClient(null)} 
                            className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
                        >
                            ביטול
                        </button>
                        <button 
                            onClick={handleConfirmDelete} 
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition"
                        >
                            כן, מחק
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BusinessDashboard;
