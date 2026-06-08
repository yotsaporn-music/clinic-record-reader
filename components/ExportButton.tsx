'use client'
import type { QueueEntry } from '@/types/record'

interface Props { queue: QueueEntry[] }

export default function ExportButton({ queue }: Props) {
  async function handleExport() {
    if (queue.length === 0) return
    const { buildExcel } = await import('@/lib/excelBuilder')
    buildExcel(queue)
  }

  const disabled = queue.length === 0
  return (
    <button onClick={handleExport} disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
      style={{
        background: disabled ? '#f0e6d6' : '#a8d8ea',
        color: disabled ? '#c4a882' : '#1a4a5a',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export Excel ({queue.length} รายการ)
    </button>
  )
}
