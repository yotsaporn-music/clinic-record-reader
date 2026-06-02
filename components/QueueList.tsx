'use client'
import type { QueueEntry } from '@/types/record'
interface Props { queue: QueueEntry[]; onEdit: (e: QueueEntry) => void; onDelete: (id: string) => void }
const slotColors: Record<string,string> = {
  'DR.1':'bg-blue-100 text-blue-700 border-blue-200',
  'DR.2':'bg-green-100 text-green-700 border-green-200',
  'DR.3':'bg-orange-100 text-orange-700 border-orange-200',
}
export default function QueueList({ queue, onEdit, onDelete }: Props) {
  if (queue.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-300">
      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm">ยังไม่มีข้อมูลในคิว</p>
      <p className="text-xs">ยืนยันรายการหมอเพื่อเพิ่มเข้าคิว</p>
    </div>
  )
  const dateGroups = new Map<string, QueueEntry[]>()
  queue.forEach(entry => {
    const d = entry.header.date
    if (!dateGroups.has(d)) dateGroups.set(d, [])
    dateGroups.get(d)!.push(entry)
  })
  return (
    <div className="space-y-4">
      {Array.from(dateGroups.entries()).map(([date, entries]) => (
        <div key={date} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ {date}</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">วัน {entries[0].dayNumber}</span>
          </div>
          {entries.sort((a,b)=>a.drSlot.localeCompare(b.drSlot)).map(entry => (
            <div key={entry.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-start gap-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${slotColors[entry.drSlot]??'bg-gray-100 text-gray-600'}`}>{entry.drSlot}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{entry.header.doctor||'(ไม่ระบุชื่อ)'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{entry.header.time_in} – {entry.header.time_out}
                  {entry.header.ot_break > 0 && <span className="ml-1 text-orange-400">OT +{entry.header.ot_break}m</span>}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">{entry.items.length} รายการ</span>
                  {entry.header.total_revenue > 0 && <span className="text-xs font-medium text-emerald-600">฿{entry.header.total_revenue.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={()=>onEdit(entry)} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">แก้ไข</button>
                <button onClick={()=>onDelete(entry.id)} className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}