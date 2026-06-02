import * as XLSX from 'xlsx'
import { COLUMN_DEFS } from './treatments'
import type { QueueEntry } from '@/types/record'
function colLetter(idx: number): string {
  let letter = ''; let n = idx
  while (n >= 0) { letter = String.fromCharCode((n%26)+65)+letter; n=Math.floor(n/26)-1 }
  return letter
}
function cellRef(col: number, row: number): string { return colLetter(col)+row }
export function buildExcel(queue: QueueEntry[]): void {
  const wb = XLSX.utils.book_new()
  const wsData: (string|number)[][] = []
  const row1: (string|number)[] = ['','HR Use','','','','','','']
  const row2: (string|number)[] = ['วัน','No.','ชื่อหมอ','ยอดสุทธิ','Date','in','out','OT Break']
  const row3: (string|number)[] = ['','','','','','','','']
  const groupStarts: Record<string,number> = {}
  const groupEnds: Record<string,number> = {}
  COLUMN_DEFS.forEach((col,i) => {
    row1.push(''); row2.push(col.key); row3.push(col.unit)
    const cat = col.category; const absIdx = 8+i
    if (groupStarts[cat]===undefined) groupStarts[cat]=absIdx
    groupEnds[cat]=absIdx
  })
  Object.entries(groupStarts).forEach(([cat,startIdx]) => { row1[startIdx]=cat })
  wsData.push(row1,row2,row3)
  const dateMap = new Map<string,QueueEntry[]>()
  queue.forEach(entry => { const d=entry.header.date; if(!dateMap.has(d)) dateMap.set(d,[]); dateMap.get(d)!.push(entry) })
  const sortedDates = Array.from(dateMap.keys()).sort()
  let dayCounter = 1
  sortedDates.forEach(date => {
    const entries = dateMap.get(date)!
    const slots = ['DR.1','DR.2','DR.3'] as const
    slots.forEach((slot,idx) => {
      const entry = entries.find(e=>e.drSlot===slot)
      const row: (string|number)[] = []
      row.push(idx===0 ? dayCounter : '')
      row.push(slot)
      row.push(entry ? entry.header.doctor : (idx===0 ? '' : '-'))
      row.push(entry ? entry.header.total_revenue : (idx===0 ? 0 : '-'))
      row.push(entry ? entry.header.date : (idx===0 ? date : '-'))
      row.push(entry ? entry.header.time_in : '0:00')
      row.push(entry ? entry.header.time_out : '0:00')
      row.push(entry ? entry.header.ot_break : 0)
      COLUMN_DEFS.forEach(col => {
        if (!entry) { row.push('-'); return }
        const item = entry.items.find(i=>i.name===col.key)
        row.push(item ? item.total : '-')
      })
      wsData.push(row)
    })
    dayCounter++
  })
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const totalCols = 8+COLUMN_DEFS.length
  ws['!cols'] = [{wch:6},{wch:6},{wch:16},{wch:10},{wch:12},{wch:7},{wch:7},{wch:8}]
  for (let i=8;i<totalCols;i++) ws['!cols'].push({wch:9})
  const merges: XLSX.Range[] = []
  merges.push({s:{r:0,c:0},e:{r:0,c:7}})
  Object.entries(groupStarts).forEach(([cat,startIdx]) => { merges.push({s:{r:0,c:startIdx},e:{r:0,c:groupEnds[cat]}}) })
  const dataStartRow = 3
  for (let d=0;d<sortedDates.length;d++) { const r=dataStartRow+d*3; merges.push({s:{r,c:0},e:{r:r+2,c:0}}) }
  ws['!merges']=merges
  XLSX.utils.book_append_sheet(wb,ws,'บันทึก')
  const startDate = sortedDates[0]??'start'
  const endDate = sortedDates[sortedDates.length-1]??'end'
  XLSX.writeFile(wb, `บันทึก_${startDate}_${endDate}.xlsx`)
}