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
      <span className={`inline-flex items-center font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Confirmed</span>
      </span>
    );
  }

  if (status === 'reviewed') {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 ${sizeClasses}`}>
        <Eye className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Reviewed</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 ${sizeClasses}`}>
      <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>Pending Review</span>
    </span>
  );
};

