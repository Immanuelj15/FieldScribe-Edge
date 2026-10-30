import React from 'react';
import { Clock, Eye, CheckCircle2 } from 'lucide-react';

interface Props {
  status: 'pending' | 'reviewed' | 'confirmed';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5';

  if (status === 'confirmed') {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Confirmed</span>
      </span>
    );
  }

  if (status === 'reviewed') {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
        <Eye className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Reviewed</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
      <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>Pending Review</span>
    </span>
  );
};

