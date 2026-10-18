import React from 'react';
import { X, Bell, CheckCircle2, Clock, FileText } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Dean Student Affairs Review Requested',
      description: 'Permission Letter - Seminar Hall has been submitted for administrative review.',
      time: '1 hour ago',
      unread: true,
      type: 'review',
    },
    {
      id: 2,
      title: 'Event Proposal Approved',
      description: 'Web Development Workshop - Event Proposal was approved by Dr. M. A. Zaveri.',
      time: '1 day ago',
      unread: false,
      type: 'approved',
    },
    {
      id: 3,
      title: 'Budget Threshold Notice',
      description: 'Workshop budget estimate ₹18,500 conforms to student activity fund guidelines.',
      time: '2 days ago',
      unread: false,
      type: 'info',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-400" />
            <h3 className="font-bold text-base">Club Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className="py-3 px-2 flex items-start gap-3 hover:bg-slate-50 rounded-xl">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'approved'
                    ? 'bg-emerald-50 text-emerald-600'
                    : n.type === 'review'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {n.type === 'approved' ? (
                  <CheckCircle2 size={15} />
                ) : n.type === 'review' ? (
                  <Clock size={15} />
                ) : (
                  <FileText size={15} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.description}</p>
                <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};
