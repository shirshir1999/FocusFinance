
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TabId } from '../types';

export interface TourStep {
  id: string;
  targetId?: string; 
  title: string;
  content: React.ReactNode;
  view: TabId; 
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: TabId) => void;
  onStepChange?: (stepId: string) => void; 
}

const STEPS: TourStep[] = [
  {
    id: 'intro',
    title: 'סיור מודרך במערכת',
    content: 'בואו נלמד תוך כדי תנועה! בסיור הזה אנחנו ממש ניצור נכס פנסיוני לדוגמה, נראה איך הוא מופיע במערכת, ואז נלמד איך לערוך ולעדכן אותו.',
    view: 'dashboard',
    position: 'center'
  },
  {
    id: 'dashboard-explanation',
    targetId: 'tour-stats-area',
    title: 'דאשבורד ראשי',
    content: 'כאן רואים את השורה התחתונה. כרגע הגרף אולי ריק, אבל תכף נוסיף נתונים ותראו איך הוא מתעורר לחיים.',
    view: 'dashboard',
    position: 'bottom'
  },
  {
    id: 'nav-pension',
    title: 'מעבר לפנסיה וגמל',
    content: 'המערכת מחולקת לפי נושאים. בואו נעבור למסך "פנסיה וגמל" כדי להדגים הוספה של קרן פנסיה.',
    view: 'pension', 
    position: 'center'
  },
  {
    id: 'pension-add-btn',
    targetId: 'tour-add-pension-btn',
    title: 'הוספת נכס חדש',
    content: 'הנה הכפתור הקבוע להוספה. בכל מסך (השקעות, נדל"ן וכו\') הוא נמצא כאן למעלה. בואו נלחץ עליו ונפתח את הטופס.',
    view: 'pension',
    position: 'bottom'
  },
  {
    id: 'pension-form-fill',
    targetId: 'tour-pension-form',
    title: 'מילוי פרטים (הדגמה)',
    content: 'נניח שיש לנו קרן פנסיה ב"מנורה מבטחים" עם צבירה של 185,000 ש"ח. המערכת תמלא כרגע את הנתונים בשבילכם לצורך ההדגמה.',
    view: 'pension',
    position: 'top'
  },
  {
    id: 'pension-item-show',
    targetId: 'tour-pension-item-demo',
    title: 'הנכס נוסף בהצלחה!',
    content: 'זהו, הנכס בפנים. שימו לב איך הוא מציג את היתרה העדכנית, דמי הניהול וההפקדה החודשית. כל הנתונים במקום אחד.',
    view: 'pension',
    position: 'bottom'
  },
  {
    id: 'pension-item-edit',
    targetId: 'tour-pension-item-demo',
    title: 'עריכה ועדכון חודשי',
    content: 'עבר חודש? קיבלתם דוח רבעוני? לחצו על הקוביה כדי לפתוח את מסך העריכה וההיסטוריה.',
    view: 'pension',
    position: 'top'
  },
  {
    id: 'modal-update',
    targetId: 'tour-modal-update-area',
    title: 'עדכון שווי שוטף',
    content: 'זה המסך החשוב ביותר. כאן פשוט מקלידים את הסכום העדכני ולוחצים "שמור". המערכת תשמור את ההיסטוריה ותבנה לכם גרף תשואה לאורך זמן.',
    view: 'pension',
    position: 'bottom'
  },
  {
    id: 'finish',
    title: 'סיימנו!',
    content: 'מחקנו את נתוני ההדגמה. עכשיו התור שלכם - התחילו להזין את הנכסים האמיתיים שלכם וקחו שליטה על העתיד הכלכלי.',
    view: 'dashboard',
    position: 'center'
  }
];

const TourOverlay: React.FC<TourOverlayProps> = ({ isOpen, onClose, onNavigate, onStepChange }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  
  const step = STEPS[currentStepIndex];

  useLayoutEffect(() => {
    if (!isOpen) return;

    if (onStepChange) {
        onStepChange(step.id);
    }

    onNavigate(step.view);

    const timer = setTimeout(() => {
        const updatePositions = () => {
            // Default center styles (for steps without target)
            const centerStyles: React.CSSProperties = {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                position: 'fixed',
                width: Math.min(400, window.innerWidth - 32),
                zIndex: 202
            };

            if (!step.targetId || step.position === 'center') {
                setHighlightStyle({ display: 'none' }); 
                setPopoverStyle(centerStyles);
                return;
            }

            const element = document.getElementById(step.targetId);
            if (!element) {
                setHighlightStyle({ display: 'none' });
                setPopoverStyle(centerStyles);
                return;
            }

            // Scroll element into view if needed
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const rect = element.getBoundingClientRect();
            const padding = 4;

            // Highlight Box (Fixed positioned)
            setHighlightStyle({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2),
                position: 'fixed',
                display: 'block',
                borderRadius: '12px'
            });

            // Popover Position Logic (Fixed position relative to viewport)
            const viewportHeight = window.innerHeight;
            const elementCenterY = rect.top + (rect.height / 2);
            
            let newPopoverStyle: React.CSSProperties = {
                position: 'fixed',
                left: '50%',
                transform: 'translateX(-50%)',
                width: Math.min(400, window.innerWidth - 32),
                zIndex: 202
            };

            // Decide whether to put the card at Top or Bottom based on element position
            // If element is in the top half -> Put card at bottom
            // If element is in the bottom half -> Put card at top
            if (elementCenterY < viewportHeight / 2) {
                newPopoverStyle.bottom = '40px';
                newPopoverStyle.top = 'auto';
            } else {
                newPopoverStyle.top = '80px'; // Below header
                newPopoverStyle.bottom = 'auto';
            }

            setPopoverStyle(newPopoverStyle);
        };

        updatePositions();
        window.addEventListener('resize', updatePositions);
        // Use capture:true to detect scroll events on internal elements (divs), not just window
        window.addEventListener('scroll', updatePositions, true);

        return () => {
            window.removeEventListener('resize', updatePositions);
            window.removeEventListener('scroll', updatePositions, true);
        };

    }, 300);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isOpen, step.view, step.targetId, onNavigate, step.position, onStepChange, step.id]);

  if (!isOpen) return null;

  const handleNext = () => {
      if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
      } else {
          onClose();
          setCurrentStepIndex(0);
      }
  };

  const handlePrev = () => {
      if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 transition-all duration-500"></div>

        {/* Highlight Cutout Border */}
        <div 
            className="transition-all duration-300 ease-out pointer-events-none border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] z-[201] animate-pulse"
            style={highlightStyle}
        />

        {/* Popover */}
        <div 
            className="fixed z-[202] transition-all duration-500 ease-out"
            style={popoverStyle}
        >
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-fade-in relative mx-auto">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-black text-slate-800">{step.title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1"><X size={20}/></button>
                </div>
                
                <div className="text-slate-600 text-sm leading-relaxed mb-6">
                    {step.content}
                </div>

                <div className="flex justify-between items-center mt-auto">
                    <div className="flex gap-1.5">
                        {STEPS.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentStepIndex ? 'bg-cyan-500 w-6' : 'bg-slate-200 w-2'}`}></div>
                        ))}
                    </div>
                    
                    <div className="flex gap-3">
                        {currentStepIndex > 0 && (
                            <button onClick={handlePrev} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition">
                                <ChevronRight size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-lg text-sm"
                        >
                            {currentStepIndex === STEPS.length - 1 ? 'סיום' : 'הבא'}
                            {currentStepIndex < STEPS.length - 1 && <ChevronLeft size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TourOverlay;
