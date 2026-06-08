'use client'
import { useState } from 'react'
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

export default function ReviewForm({ result, onChange }: Props) {
  const { header, items, confidence, confidence_note } = result

  function setHeader(key: string, value: string | number) {
    onChange({ ...result, header: { ...header, [key]: value } })
  }

  function setItem(id: string, key: keyof RecordItem, value: string | boolean) {
    onChange({
      ...result,
      items: items.map(item => item.id === id ? { ...item, [key]: value } : item),
    })
  }

  function removeItem(id: string) {
    onChange({ ...result, items: items.filter(i => i.id !== id) })
  }

  function addItem() {
    const newItem: RecordItem = {
      id: `item-new-${Date.now()}`,
      category: 'Skin',
      name: COLUMN_DEFS[0].key,
      total: '',
      detail: '',
      uncertain: false,
    }
    onChange({ ...result, items: [...items, newItem] })
  }

  const confidenceColor = confidence === 'สูง' ? 'bg-green-100 text-green-700' :
    confidence === 'กลาง' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'

  return (
    <div className="space-y-4">
      {/* Confidence badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${confidenceColor}`}>
          ความมั่นใจ: {confidence}
        </span>
        {confidence_note && (
          <span className="text-xs text-gray-500 italic">{confidence_note}</span>
        )}
      </div>

      {/* Header fields */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ข้อมูลหัวใบ</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">ชื่อหมอ</span>
            <input className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={header.doctor}
              onChange={e => setHeader('doctor', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">วันที่ (DD-MMM-YY)</span>
            <input className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={header.date}
              placeholder="01-May-26"
              onChange={e => setHeader('date', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">สาขา</span>
            <select className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={header.branch}
              onChange={e => setHeader('branch', e.target.value)}>
              <option value="">-- เลือกสาขา --</option>
              <option value="SR">SR</option>
              <option value="WG">WG</option>
              <option value="SQ">SQ</option>
              <option value="FR">FR</option>
              <option value="LP">LP</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">ยอดสุทธิ</span>
            <input type="number" className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={header.total_revenue}
              onChange={e => setHeader('total_revenue', Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">เวลาเข้า</span>
            <input className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={header.time_in} placeholder="09:00"
              onChange={e => setHeader('time_in', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">เวลาออก</span>
            <input className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={header.time_out} placeholder="17:00"
              onChange={e => setHeader('time_out', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">OT Break (นาที)</span>
            <input type="number" className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={header.ot_break}
              onChange={e => setHeader('ot_break', Number(e.target.value))} />
          </label>
        </div>
      </div>

      {/* Treatment items */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">รายการหัตถการ</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-1 px-1 w-24">หมวด</th>
                <th className="text-left py-1 px-1">รายการ</th>
                <th className="text-center py-1 px-1 w-16">จำนวน</th>
                <th className="text-left py-1 px-1">รายละเอียด</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.id}
                  className={`border-b transition-colors ${item.uncertain ? 'uncertain-row' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-1.5 px-1">
                    {item.uncertain && <span className="mr-1">⚠️</span>}
                    <select
                      className="border rounded px-1 py-0.5 text-xs bg-white w-full"
                      value={item.category}
                      onChange={e => {
                        const cat = e.target.value as Category
                        const options = treatmentsByCategory(cat)
                        setItem(item.id, 'category', cat)
                        if (options.length) setItem(item.id, 'name', options[0])
                      }}
                    >
                      {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </td>
                  <td className="py-1.5 px-1">
                    <select
                      className="border rounded px-1 py-0.5 text-xs bg-white w-full"
                      value={item.name}
                      onChange={e => setItem(item.id, 'name', e.target.value)}
                    >
                      {treatmentsByCategory(item.category).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                      {item.category === 'อื่นๆ' && (
                        <option value={item.name}>{item.name || '(ระบุเอง)'}</option>
                      )}
                    </select>
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      className="border rounded px-1 py-0.5 text-xs w-full text-center"
                      value={item.total}
                      onChange={e => setItem(item.id, 'total', e.target.value)}
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      className="border rounded px-1 py-0.5 text-xs w-full"
                      value={item.detail}
                      placeholder="ตัวเลขย่อย..."
                      onChange={e => setItem(item.id, 'detail', e.target.value)}
                    />
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors text-base leading-none"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addItem}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
        >
          <span className="text-lg leading-none">+</span> เพิ่มรายการ
        </button>
      </div>
    </div>
  )
}
