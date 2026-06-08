'use client'
import { useState, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import ReviewForm from '@/components/ReviewForm'
import QueueList from '@/components/QueueList'
import ExportButton from '@/components/ExportButton'
import type { AnalyzeResult, QueueEntry } from '@/types/record'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [current, setCurrent] = useState<AnalyzeResult | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setCurrent(null)
    setEditingId(null)
    setError(null)
  }

  async function handleAnalyze() {
    if (!file) return
    setAnalyzing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'เกิดข้อผิดพลาด')
      setCurrent(data as AnalyzeResult)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAnalyzing(false)
    }
  }

  function assignDrSlot(date: string): 'DR.1' | 'DR.2' | 'DR.3' | null {
    const existingForDate = queue.filter(e => e.header.date === date && e.id !== editingId)
    const count = existingForDate.length
    if (count === 0) return 'DR.1'
    if (count === 1) return 'DR.2'
    if (count === 2) return 'DR.3'
    return null
  }

  function getDayNumber(date: string): number {
    const allDates = Array.from(new Set(queue.map(e => e.header.date)))
    if (!allDates.includes(date)) return allDates.length + 1
    return allDates.indexOf(date) + 1
  }

  function handleConfirm() {
    if (!current) return

    const date = current.header.date
    if (editingId) {
      // Update existing entry
      setQueue(prev => prev.map(e => {
        if (e.id !== editingId) return e
        return { ...e, header: current.header, items: current.items }
      }))
      setEditingId(null)
    } else {
      const slot = assignDrSlot(date)
      if (!slot) {
        setError(`วันที่ ${date} เต็มแล้ว (DR.1–3) ไม่สามารถเพิ่มได้`)
        return
      }
      const dayNumber = getDayNumber(date)
      const entry: QueueEntry = {
        id: `entry-${Date.now()}`,
        dayNumber,
        drSlot: slot,
        header: current.header,
        items: current.items,
      }
      setQueue(prev => [...prev, entry])
    }

    // Reset left panel
    setFile(null)
    setPreview(null)
    setCurrent(null)
    setError(null)
  }

  function handleEdit(entry: QueueEntry) {
    setEditingId(entry.id)
    setCurrent({ header: entry.header, items: entry.items, confidence: 'สูง', confidence_note: '' })
    setPreview(null)
    setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id: string) {
    setQueue(prev => prev.filter(e => e.id !== id))
  }

  const isEditing = editingId !== null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f4f0' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-6 py-3 shadow-md"
        style={{ background: '#1a1a2e' }}>
        <svg className="w-7 h-7 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">Mega Clinic</h1>
          <p className="text-white/50 text-xs">ระบบอ่านใบบันทึกแพทย์</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {queue.length > 0 && (
            <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full">
              Queue: {queue.length} รายการ
            </span>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* LEFT — Upload & Review */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-700">
                {isEditing ? '✏️ แก้ไขรายการ' : '📋 งานปัจจุบัน'}
              </h2>
              {isEditing && (
                <button
                  onClick={() => { setEditingId(null); setCurrent(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >ยกเลิกแก้ไข</button>
              )}
            </div>

            {!isEditing && (
              <>
                <UploadZone
                  onFileSelect={handleFileSelect}
                  preview={preview}
                  disabled={analyzing}
                />

                {file && !current && (
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all
                      ${analyzing
                        ? 'bg-blue-300 text-white cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-md active:scale-95'
                      }`}
                  >
                    {analyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        กำลังวิเคราะห์...
                      </span>
                    ) : '🔍 วิเคราะห์ด้วย AI'}
                  </button>
                )}
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}
          </div>

          {current && (
            <>
              <ReviewForm
                result={current}
                onChange={setCurrent}
              />

              <button
                onClick={handleConfirm}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-base">✓</span>
                {isEditing ? 'บันทึกการแก้ไข' : 'ยืนยัน เพิ่มเข้า Queue'}
              </button>
            </>
          )}
        </div>

        {/* RIGHT — Queue */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-700">📥 Queue รายการที่ยืนยันแล้ว</h2>
              <span className="text-xs text-gray-400">{queue.length} รายการ</span>
            </div>
            <QueueList queue={queue} onEdit={handleEdit} onDelete={handleDelete} />
          </div>

          <ExportButton queue={queue} />
        </div>
      </div>
    </div>
  )
}
