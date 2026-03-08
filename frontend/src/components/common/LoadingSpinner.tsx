export default function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${s} border-2 border-purple-600/30 border-t-purple-500 rounded-full animate-spin`} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-purple-600/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Loading SoundSphere...</p>
      </div>
    </div>
  )
}
