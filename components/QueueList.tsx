'use client'
import type { QueueEntry } from '@/types/record'

interface Props {
  queue: QueueEntry[]
  onEdit: (entry: QueueEntry) => void
  onDelete: (id: string) => void
  compact?: boolean
}

const slotBg: Record<string, string> = { 'DR.1': '#a8d8ea', 'DR.2': '#b8e0b8', 'DR.3': '#f4c2a0' }
const slotFg: Record<string, string> = { 'DR.1': '#1a4a5a', 'DR.2': '#1a4a1a', 'DR.3': '#5a2a0a' }

export default function QueueList({ queue, onEdit, onDelete, compact }: Props) {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8" style={{ color: '#d4b896' }}>
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-xs">ยังไม่มีข้อมูลในคิว</p>
      </div>
    )
  }

  const dateGroups = new Map<string, QueueEntry[]>()
  queue.forEach(entry => {
    const d = entry.header.date
    if (!dateGroups.has(d)) dateGroups.set(d, [])
    dateGroups.get(d)!.push(entry)
  })

  return (
    <div className="space-y-3">
      {Array.from(dateGroups.entries()).map(([date, entries]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wide" style={{ color: '#7a4f5a' }}>วันที่ {date}</span>
            <div className="flex-1 h-px" style={{ background: '#f4c2d0' }} />
            <span className="text-xs" style={{ color: '#c4a882' }}>วัน {entries[0].dayNumber}</span>
          </div>
          <div className="space-y-1.5">
            {entries.sort((a, b) => a.drSlot.localeCompare(b.drSlot)).map(entry => (
              <div key={entry.id} className="rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm"
                style={{ background: 'white', border: '1px solid #f4c2d0' }}>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: slotBg[entry.drSlot] ?? '#eee', color: slotFg[entry.drSlot] ?? '#333' }}>
                  {entry.drSlot}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate" style={{ color: '#5a3040' }}>
                    {entry.header.doctor || '(ไม่ระบุ)'}
                  </p>
                  <p className="text-xs" style={{ color: '#c4a882' }}>
                    {compact
                      ? `${entry.header.branch} · ${entry.items.length} รายการ`
                      : `${entry.header.time_in}–${entry.header.time_out} · ${entry.items.length} รายการ${entry.header.total_revenue > 0 ? ` · ฿${entry.header.total_revenue.toLocaleString()}` : ''}`}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => onEdit(entry)} className="text-xs px-2 py-0.5 rounded-lg font-medium"
                    style={{ background: '#e8f4fa', color: '#1a6a8a' }}>แก้</button>
                  <button onClick={() => onDelete(entry.id)} className="text-xs px-2 py-0.5 rounded-lg font-medium"
                    style={{ background: '#fde8ee', color: '#9b2335' }}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
