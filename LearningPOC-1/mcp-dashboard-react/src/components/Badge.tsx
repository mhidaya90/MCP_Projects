
import clsx from 'clsx';

export function Badge({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  const toneMap = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger:  'bg-red-100 text-red-700 border-red-200',
    info:    'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs',
      toneMap[tone]
    )}>
           {text}
    </span>
  );
}