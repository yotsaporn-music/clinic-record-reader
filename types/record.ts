export type Category = 'Skin' | 'เครื่อง' | 'Botox' | 'Filler' | 'Consult' | 'อื่นๆ'

export interface HeaderInfo {
  doctor: string
  date: string
  branch: string
  time_in: string
  time_out: string
  ot_break: number
  total_revenue: number
}

export interface RecordItem {
  id: string
  category: Category
  name: string
  total: string
  detail: string
  uncertain: boolean
}

export interface AnalyzeResult {
  header: HeaderInfo
  items: RecordItem[]
  confidence: 'สูง' | 'กลาง' | 'ต่ำ'
  confidence_note: string
}

export interface QueueEntry {
  id: string
  dayNumber: number
  drSlot: 'DR.1' | 'DR.2' | 'DR.3'
  header: HeaderInfo
  items: RecordItem[]
}