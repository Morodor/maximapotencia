import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const Notification = () => {
  const { notification } = useApp();

  if (!notification) return null;

  const isError = notification.isError;

  return (
    <div className={`fixed bottom-16 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
      isError 
        ? 'bg-red-600 text-white border border-red-500' 
        : 'bg-emerald-600 text-white border border-emerald-500'
    }`}>
      {isError ? (
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
      )}
      <span>{notification.message}</span>
    </div>
  );
};
