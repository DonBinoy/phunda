export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-onyx-700 border-t-sea-500" />
      <p className="text-sm text-onyx-500">{label}</p>
    </div>
  );
}
