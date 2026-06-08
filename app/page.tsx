'use client'
import { useState, useEffect } from 'react'
import UploadZone from '@/components/UploadZone'
import ReviewForm from '@/components/ReviewForm'
import QueueList from '@/components/QueueList'
import ExportButton from '@/components/ExportButton'
import type { AnalyzeResult, QueueEntry } from '@/types/record'

export default function Home() {
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [current, setCurrent] = useState<AnalyzeResult | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file && !current && !analyzing && pendingFiles.length > 0) {
      const [next, ...rest] = pendingFiles
      setPendingFiles(rest)
      setFile(next)
      setPreview(URL.createObjectURL(next))
      setError(null)
    }
  }, [file, current, analyzing, pendingFiles])

  function handleFilesSelect(selectedFiles: File[]) {
    if (!file && !current && !analyzing) {
      const [first, ...rest] = selectedFiles
      setFile(first)
      setPreview(URL.createObjectURL(first))
      setCurrent(null)
      setEditingId(null)
      setError(null)
      setPendingFiles(prev => [...prev, ...rest])
    } else {
      setPendingFiles(prev => [...prev, ...selectedFiles])
    }
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
      setQueue(prev => prev.map(e => e.id !== editingId ? e : { ...e, header: current.header, items: current.items }))
      setEditingId(null)
    } else {
      const slot = assignDrSlot(date)
      if (!slot) { setError(`วันที่ ${date} เต็มแล้ว (DR.1–3)`); return }
      const entry: QueueEntry = {
        id: `entry-${Date.now()}`,
        dayNumber: getDayNumber(date),
        drSlot: slot,
        header: current.header,
        items: current.items,
      }
      setQueue(prev => [...prev, entry])
    }
    setFile(null); setPreview(null); setCurrent(null); setError(null)
  }

  function handleSkip() {
    setFile(null); setPreview(null); setCurrent(null); setError(null)
  }

  function handleEdit(entry: QueueEntry) {
    setEditingId(entry.id)
    setCurrent({ header: entry.header, items: entry.items, confidence: 'สูง', confidence_note: '' })
    setPreview(null); setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id: string) {
    setQueue(prev => prev.filter(e => e.id !== id))
  }

  const isEditing = editingId !== null
  const totalPending = pendingFiles.length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fdf0f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 shadow-md"
        style={{ background: '#7a4f5a' }}>
        {/* Logo placeholder — replace /logo.png with your actual logo file */}
        <img src="/logo.png" alt="Mega Clinic" className="h-9 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div>
          <h1 className="text-white font-black text-lg tracking-widest leading-tight">MEGA CLINIC</h1>
          <p className="text-pink-200 text-xs tracking-wide">ระบบอ่านใบบันทึกแพทย์</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {totalPending > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: '#f4a7c0', color: '#5a2533' }}>
              รอวิเคราะห์: {totalPending} รูป
            </span>
          )}
          {queue.length > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: '#a8d8ea', color: '#1a4a5a' }}>
              Queue: {queue.length} รายการ
            </span>
          )}
        </div>
      </header>

      {/* Main layout: Left = image+queue, Right = form */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 lg:p-5 max-w-screen-2xl mx-auto w-full">

        {/* LEFT — Image preview + Queue */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Image upload zone */}
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff5f8' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#f4c2d0' }}>
              <span className="text-sm font-semibold" style={{ color: '#7a4f5a' }}>
                {isEditing ? '✏️ แก้ไขรายการ' : '🖼️ รูปใบบันทึก'}
              </span>
              {isEditing && (
                <button onClick={() => { setEditingId(null); setCurrent(null) }}
                  className="text-xs" style={{ color: '#c4a882' }}>ยกเลิกแก้ไข</button>
              )}
              {totalPending > 0 && !isEditing && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#f4a7c0', color: '#5a2533' }}>+{totalPending} รูปถัดไป</span>
              )}
            </div>

            {!isEditing && (
              <UploadZone
                onFilesSelect={handleFilesSelect}
                preview={preview}
                disabled={analyzing}
              />
            )}

            {isEditing && !preview && (
              <div className="flex items-center justify-center py-16 text-sm" style={{ color: '#c4a882' }}>
                กำลังแก้ไขรายการจาก Queue
              </div>
            )}

            {error && (
              <div className="mx-3 mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: '#fde8ee', color: '#9b2335' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Analyze button */}
            {file && !current && !isEditing && (
              <div className="px-3 pb-3">
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: analyzing ? '#f4c2d0' : '#e8749a',
                    color: 'white',
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                  }}>
                  {analyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      กำลังวิเคราะห์...
                    </span>
                  ) : `🔍 วิเคราะห์ด้วย AI${totalPending > 0 ? ` (เหลือ ${totalPending} รูป)` : ''}`}
                </button>
              </div>
            )}
          </div>

          {/* Queue — compact, below image */}
          <div className="rounded-2xl shadow-sm flex-1" style={{ background: '#fff5f8' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#f4c2d0' }}>
              <span className="text-sm font-semibold" style={{ color: '#7a4f5a' }}>📥 Queue</span>
              <span className="text-xs" style={{ color: '#c4a882' }}>{queue.length} รายการ</span>
            </div>
            <div className="px-3 py-2">
              <QueueList queue={queue} onEdit={handleEdit} onDelete={handleDelete} compact />
            </div>
            <div className="px-3 pb-3">
              <ExportButton queue={queue} />
            </div>
          </div>
        </div>

        {/* RIGHT — Review form */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {current ? (
            <>
              <ReviewForm result={current} onChange={setCurrent} />
              <div className="flex gap-2 pb-2">
                <button onClick={handleConfirm}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow"
                  style={{ background: '#a8d8ea', color: '#1a4a5a' }}>
                  ✓ {isEditing ? 'บันทึกการแก้ไข' : `ยืนยัน เพิ่มเข้า Queue${totalPending > 0 ? ' → ถัดไป' : ''}`}
                </button>
                {!isEditing && (
                  <button onClick={handleSkip}
                    className="py-3 px-4 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: '#f0e6d6', color: '#7a5a3a' }}>
                    ข้าม
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full rounded-2xl shadow-sm py-24"
              style={{ background: '#fff5f8' }}>
              <svg className="w-16 h-16 mb-4" style={{ color: '#f4c2d0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: '#c4a882' }}>อัปโหลดรูปแล้วกดวิเคราะห์</p>
              <p className="text-xs mt-1" style={{ color: '#d4b896' }}>ผลวิเคราะห์จะแสดงที่นี่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
