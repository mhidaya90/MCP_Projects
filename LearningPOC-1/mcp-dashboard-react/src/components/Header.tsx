
export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="bg-white/95 rounded-card px-6 py-5 shadow-card border border-white/70">
        <h1 className="text-2xl font-bold">🚀 {title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
       </div>
  );
}