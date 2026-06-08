'use client'
import type { AnalyzeResult, RecordItem, Category } from '@/types/record'
import { COLUMN_DEFS, CATEGORIES } from '@/lib/treatments'

interface Props {
  result: AnalyzeResult
  onChange: (updated: AnalyzeResult) => void
}

const CATEGORY_NAMES = CATEGORIES.filter(c => c !== 'อื่นๆ') as Category[]

function treatmentsByCategory(cat: Category) {
  return COLUMN_DEFS.filter(c => c.category === cat).map(c => c.key)
}

const BRANCHES = ['SR', 'WG', 'SQ', 'FR', 'LP']

export default function ReviewForm({ result, onChange }: Props) {
  const { header, items, confidence, confidence_note } = result

  function setHeader(key: string, value: string | number) {
    onChange({ ...result, header: { ...header, [key]: value } })
  }

  function setItem(id: string, key: keyof RecordItem, value: string | boolean) {
    onChange({ ...result, items: items.map(item => item.id === id ? { ...item, [key]: value } : item) })
  }

  function removeItem(id: string) {
    onChange({ ...result, items: items.filter(i => i.id !== id) })
  }

  function addItem() {
    const newItem: RecordItem = {
      id: `item-new-${Date.now()}`,
      category: 'Skin',
      name: '',
      total: '',
      detail: '',
      uncertain: false,
    }
    onChange({ ...result, items: [...items, newItem] })
  }

  const confidenceColor =
    confidence === 'สูง' ? { bg: '#d4edda', color: '#155724' } :
    confidence === 'กลาง' ? { bg: '#FAF0A0', color: '#7a5a00' } :
    { bg: '#fde8ee', color: '#9b2335' }

  return (
    <div className="space-y-3">
      {/* Confidence */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: confidenceColor.bg, color: confidenceColor.color }}>
          ความมั่นใจ: {confidence}
        </span>
        {confidence_note && (
          <span className="text-xs italic" style={{ color: '#c4905a' }}>{confidence_note}</span>
        )}
      </div>

      {/* Header fields */}
      <div className="rounded-2xl p-4 shadow-sm space-y-3" style={{ background: '#fff8fa' }}>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#7B4028' }}>ข้อมูลหัวใบ</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Doctor */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>ชื่อหมอ</span>
            <input className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.doctor} onChange={e => setHeader('doctor', e.target.value)} />
          </label>
          {/* Date */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>วันที่ (DD-MMM-YY)</span>
            <input className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.date} placeholder="01-May-26"
              onChange={e => setHeader('date', e.target.value)} />
          </label>
          {/* Branch */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>สาขา</span>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.branch} onChange={e => setHeader('branch', e.target.value)}>
              <option value="">-- เลือกสาขา --</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          {/* Revenue */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>ยอดสุทธิ</span>
            <input type="number" className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.total_revenue} onChange={e => setHeader('total_revenue', Number(e.target.value))} />
          </label>
          {/* Time in */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>เวลาเข้า</span>
            <input className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.time_in} placeholder="09:00"
              onChange={e => setHeader('time_in', e.target.value)} />
          </label>
          {/* Time out */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>เวลาออก</span>
            <input className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.time_out} placeholder="17:00"
              onChange={e => setHeader('time_out', e.target.value)} />
          </label>
          {/* OT Break */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: '#c4905a' }}>OT Break (นาที)</span>
            <input type="number" className="border rounded-lg px-3 py-2 text-sm bg-white"
              style={{ borderColor: '#F2C4CE' }}
              value={header.ot_break} onChange={e => setHeader('ot_break', Number(e.target.value))} />
          </label>
        </div>
      </div>

      {/* Treatment items */}
      <div className="rounded-2xl p-4 shadow-sm space-y-2" style={{ background: '#fff8fa' }}>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#7B4028' }}>รายการหัตถการ</p>

        <div className="space-y-2">
          {/* Header row */}
          <div className="grid gap-1 text-xs font-bold px-1" style={{ gridTemplateColumns: '90px 1fr 60px 1fr 28px', color: '#c4905a' }}>
            <span>หมวด</span>
            <span>รายการ (พิมพ์หรือเลือกได้)</span>
            <span className="text-center">จำนวน</span>
            <span>รายละเอียด</span>
            <span></span>
          </div>

          {items.map(item => {
            const suggestions = treatmentsByCategory(item.category)
            const listId = `dl-${item.id}`
            return (
              <div key={item.id}
                className="grid gap-1 px-1 py-1.5 rounded-xl items-center"
                style={{
                  gridTemplateColumns: '90px 1fr 60px 1fr 28px',
                  background: item.uncertain ? '#FAF0A0' : 'white',
                  border: `1px solid ${item.uncertain ? '#e0d080' : '#F2C4CE'}`,
                }}>
                {/* Category */}
                <div className="flex items-center gap-0.5">
                  {item.uncertain && <span className="text-xs">⚠️</span>}
                  <select
                    className="border rounded px-1 py-1 text-xs bg-white w-full"
                    style={{ borderColor: '#F2C4CE' }}
                    value={item.category}
                    onChange={e => {
                      const cat = e.target.value as Category
                      setItem(item.id, 'category', cat)
                      setItem(item.id, 'name', '')
                    }}>
                    {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                {/* Name — freely typeable with datalist suggestions */}
                <div>
                  <datalist id={listId}>
                    {suggestions.map(k => <option key={k} value={k} />)}
                  </datalist>
                  <input
                    list={listId}
                    className="border rounded px-1 py-1 text-xs w-full bg-white"
                    style={{ borderColor: '#F2C4CE' }}
                    value={item.name}
                    placeholder="พิมพ์หรือเลือก..."
                    onChange={e => setItem(item.id, 'name', e.target.value)}
                  />
                </div>

                {/* Total */}
                <input
                  className="border rounded px-1 py-1 text-xs w-full text-center bg-white"
                  style={{ borderColor: '#F2C4CE' }}
                  value={item.total}
                  onChange={e => setItem(item.id, 'total', e.target.value)}
                />

                {/* Detail */}
                <input
                  className="border rounded px-1 py-1 text-xs w-full bg-white"
                  style={{ borderColor: '#F2C4CE' }}
                  value={item.detail}
                  placeholder="ตัวเลขย่อย..."
                  onChange={e => setItem(item.id, 'detail', e.target.value)}
                />

                {/* Delete */}
                <button onClick={() => removeItem(item.id)}
                  className="text-center font-bold text-lg leading-none transition-colors"
                  style={{ color: '#e07080' }}>×</button>
              </div>
            )
          })}
        </div>

        <button onClick={addItem}
          className="mt-2 text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: '#A8CEE3', color: '#1a4a5a' }}>
          <span className="text-base leading-none">+</span> เพิ่มรายการ
        </button>
      </div>
    </div>
  )
}
