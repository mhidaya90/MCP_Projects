
// import type { ReactNode } from 'react';
// import clsx from 'clsx';

// export function Card({ title, children }: { title: string; children: ReactNode }) {
//   return (
//     <div className={clsx('bg-card rounded-xl shadow-card p-5', 'backdrop-blur-sm')}>
//       <div className="text-gray-800 font-semibold mb-3">{title}</div>
//       <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
//     </div>
//    );
// }


import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={clsx(
      'bg-white rounded-card shadow-card',
      'p-5 border border-white/70'
    )}>
      <div className="text-gray-800 font-semibold mb-3">{title}</div>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}
