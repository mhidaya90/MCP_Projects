
export function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1">
      {/* Small subtle bullet/dot */}
      <span className="mt-1 h-2 w-2 rounded-full bg-gray-300 inline-block" />
      <span className="text-sm text-gray-700">{children}</span>
       </div>
  );
}
