export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-black"></div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Đang tải...</p>
      </div>
    </div>
  );
}
