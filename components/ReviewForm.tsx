'use client'
import { useState } from 'react'
import type { AnalyzeResult, RecordItem, Category } from '@/types/record'
import { COLUMN_DEFS, CATEGORIES } from '@/lib/treatments'

interface Props { result: AnalyzeResult; onChange: (u: AnalyzeResult) => void }
const CATEGORY_NAMES = CATEGORIES.filter(c => c !== 'อื่นๆ') as Category[]
function treatmentsByCategory(cat: Category) { return COLUMN_DEFS.filter(c => c.category === cat).map(c => c.key) }

export default function ReviewForm({ result, onChange }: Props) {
  const { header, items, confidence, confidence_note } = result
  function setHeader(key: string, value: string | number) { onChange({ ...result, header: { ...header, [key]: value } }) }
  function setItem(id: string, key: keyof RecordItem, value: string | boolean) {
    onChange({ ...result, items: items.map(item => item.id === id ? { ...item, [key]: value } : item) })
  }
  function removeItem(id: string) { onChange({ ...result, items: items.filter(i => i.id !== id) }) }
  function addItem() {
    onChange({ ...result, items: [...items, { id: `item-new-${Date.now()}`, category: 'Skin', name: COLUMN_DEFS[0].key, total: '', detail: '', uncertain: false }] })
  }
  const confColor = confidence === 'สูง' ? 'bg-green-100 text-green-700' : confidence === 'กลาง' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${confColor}`}>ความมั่นใจ: {confidence}</span>
        {confidence_note && <span className="text-xs text-gray-500 italic">{confidence_note}</span>}
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ข้อมูลหัวใบ</p>
        <div className="grid grid-cols-2 gap-3">
          {([['doctor','ชื่อหมอ','text'],['date','วันที่ (DD-MMM-YY)','text'],['branch','สาขา','text'],['total_revenue','ยอดสุทธิ','number'],['time_in','เวลาเข้า','text'],['time_out','เวลาออก','text'],['ot_break','OT Break (นาที)','number']] as const).map(([k,label,type]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">{label}</span>
              <input type={type} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={(header as any)[k]} onChange={e => setHeader(k, type==='number' ? Number(e.target.value) : e.target.value)} />
            </label>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">รายการหัตถการ</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-gray-500">
              <th className="text-left py-1 px-1 w-24">หมวด</th>
              <th className="text-left py-1 px-1">รายการ</th>
              <th className="text-center py-1 px-1 w-16">จำนวน</th>
              <th className="text-left py-1 px-1">รายละเอียด</th>
              <th className="w-8"></th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={`border-b transition-colors ${item.uncertain ? 'uncertain-row' : 'hover:bg-gray-50'}`}>
                  <td className="py-1.5 px-1">
                    {item.uncertain && <span className="mr-1">⚠️</span>}
                    <select className="border rounded px-1 py-0.5 text-xs bg-white w-full" value={item.category}
                      onChange={e => { const cat = e.target.value as Category; setItem(item.id,'category',cat); const opts = treatmentsByCategory(cat); if(opts.length) setItem(item.id,'name',opts[0]) }}>
                      {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-1">
                    <select className="border rounded px-1 py-0.5 text-xs bg-white w-full" value={item.name} onChange={e => setItem(item.id,'name',e.target.value)}>
                      {treatmentsByCategory(item.category).map(k => <option key={k} value={k}>{k}</option>)}
                      {item.category === 'อื่นๆ' && <option value={item.name}>{item.name||'(ระบุเอง)'}</option>}
                    </select>
                  </td>
                  <td className="py-1.5 px-1"><input className="border rounded px-1 py-0.5 text-xs w-full text-center" value={item.total} onChange={e => setItem(item.id,'total',e.target.value)} /></td>
                  <td className="py-1.5 px-1"><input className="border rounded px-1 py-0.5 text-xs w-full" value={item.detail} placeholder="ตัวเลขย่อย..." onChange={e => setItem(item.id,'detail',e.target.value)} /></td>
                  <td className="py-1.5 px-1 text-center"><button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-base leading-none">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
          <span className="text-lg leading-none">+</span> เพิ่มรายการ
        </button>
      </div>
    </div>
  )
}