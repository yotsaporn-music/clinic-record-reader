'use client'
import { useState, useEffect } from 'react'
import UploadZone from '@/components/UploadZone'
import ReviewForm from '@/components/ReviewForm'
import QueueList from '@/components/QueueList'
import ExportButton from '@/components/ExportButton'
import type { AnalyzeResult, QueueEntry } from '@/types/record'

const PASSWORD = 'HRMEGA2026'

const C = {
  brown:     '#7B4028',
  pink:      '#FAEEF1',
  blue:      '#A8CEE3',
  blueDark:  '#1a4a5a',
  yellow:    '#FAF0A0',
  brownText: '#4a2010',
  brownMid:  '#c4905a',
}

export default function Home() {
  const [unlocked, setUnlocked] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [current, setCurrent] = useState<AnalyzeResult | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('mc_auth') === '1') setUnlocked(true)
  }, [])

  useEffect(() => {
    if (!file && !current && !analyzing && pendingFiles.length > 0) {
      const [next, ...rest] = pendingFiles
      setPendingFiles(rest); setFile(next); setPreview(URL.createObjectURL(next)); setError(null)
    }
  }, [file, current, analyzing, pendingFiles])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (pwInput === PASSWORD) { sessionStorage.setItem('mc_auth', '1'); setUnlocked(true) }
    else { setPwError(true); setPwInput('') }
  }

  function handleFilesSelect(selectedFiles: File[]) {
    if (!file && !current && !analyzing) {
      const [first, ...rest] = selectedFiles
      setFile(first); setPreview(URL.createObjectURL(first))
      setCurrent(null); setEditingId(null); setError(null)
      setPendingFiles(prev => [...prev, ...rest])
    } else { setPendingFiles(prev => [...prev, ...selectedFiles]) }
  }

  async function handleAnalyze() {
    if (!file) return
    setAnalyzing(true); setError(null)
    try {
      const formData = new FormData(); formData.append('image', file)
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'เกิดข้อผิดพลาด')
      setCurrent(data as AnalyzeResult)
    } catch (e) { setError((e as Error).message) }
    finally { setAnalyzing(false) }
  }

  function assignDrSlot(date: string): 'DR.1' | 'DR.2' | 'DR.3' | null {
    const n = queue.filter(e => e.header.date === date && e.id !== editingId).length
    return n === 0 ? 'DR.1' : n === 1 ? 'DR.2' : n === 2 ? 'DR.3' : null
  }

  function getDayNumber(date: string): number {
    const all = Array.from(new Set(queue.map(e => e.header.date)))
    return all.includes(date) ? all.indexOf(date) + 1 : all.length + 1
  }

  function handleConfirm() {
    if (!current) return
    if (editingId) {
      setQueue(prev => prev.map(e => e.id !== editingId ? e : { ...e, header: current.header, items: current.items }))
      setEditingId(null)
    } else {
      const slot = assignDrSlot(current.header.date)
      if (!slot) { setError(`วันที่ ${current.header.date} เต็มแล้ว (DR.1–3)`); return }
      setQueue(prev => [...prev, {
        id: `entry-${Date.now()}`, dayNumber: getDayNumber(current.header.date),
        drSlot: slot, header: current.header, items: current.items,
      }])
    }
    setFile(null); setPreview(null); setCurrent(null); setError(null)
  }

  function handleSkip() { setFile(null); setPreview(null); setCurrent(null); setError(null) }

  function handleEdit(entry: QueueEntry) {
    setEditingId(entry.id)
    setCurrent({ header: entry.header, items: entry.items, confidence: 'สูง', confidence_note: '' })
    setPreview(null); setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id: string) { setQueue(prev => prev.filter(e => e.id !== id)) }

  const isEditing = editingId !== null
  const totalPending = pendingFiles.length

  // ── Password screen ──
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.pink }}>
        <div className="rounded-3xl shadow-xl p-10 flex flex-col items-center gap-6 w-80"
          style={{ background: 'white', border: `2px solid #F2C4CE` }}>
          <img src="/logo.png" alt="Mega Clinic" className="h-20 w-auto object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="text-center">
            <h1 className="font-black text-xl tracking-widest" style={{ color: C.brown }}>MEGA CLINIC</h1>
            <p className="text-xs mt-1" style={{ color: C.brownMid }}>ระบบอ่านใบบันทึกแพทย์</p>
          </div>
          <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
            <input
              type="password"
              className="w-full border-2 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-bold focus:outline-none"
              style={{ borderColor: pwError ? '#e07080' : C.blue }}
              placeholder="รหัสผ่าน"
              value={pwInput}
              autoFocus
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
            />
            {pwError && <p className="text-xs text-center font-semibold" style={{ color: '#e07080' }}>รหัสผ่านไม่ถูกต้อง</p>}
            <button type="submit" className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: C.blue, color: C.blueDark }}>
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Main app ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.pink }}>
      <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 shadow-lg"
        style={{ background: C.brown }}>
        <img src="/logo.png" alt="Mega Clinic" className="h-10 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div>
          <h1 className="text-white font-black text-xl tracking-widest">MEGA CLINIC</h1>
          <p className="text-xs tracking-wide" style={{ color: '#e8c4a0' }}>ระบบอ่านใบบันทึกแพทย์</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {totalPending > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: C.yellow, color: C.brownText }}>รอ: {totalPending} รูป</span>
          )}
          {queue.length > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: C.blue, color: C.blueDark }}>Queue: {queue.length}</span>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 lg:p-5 max-w-screen-2xl mx-auto w-full">

        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="rounded-2xl shadow overflow-hidden" style={{ background: '#fff8fa' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: C.brown }}>
              <span className="text-white text-sm font-bold">
                {isEditing ? '✏️ แก้ไขรายการ' : '🖼️ รูปใบบันทึก'}
              </span>
              <div className="flex items-center gap-2">
                {totalPending > 0 && !isEditing && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: C.yellow, color: C.brownText }}>+{totalPending}</span>
                )}
                {isEditing && (
                  <button onClick={() => { setEditingId(null); setCurrent(null) }}
                    className="text-xs px-2 py-0.5 rounded" style={{ background: C.blue, color: C.blueDark }}>
                    ยกเลิก
                  </button>
                )}
              </div>
            </div>

            {!isEditing && <UploadZone onFilesSelect={handleFilesSelect} preview={preview} disabled={analyzing} />}
            {isEditing && !preview && (
              <div className="flex items-center justify-center py-20 text-sm" style={{ color: C.brownMid }}>
                กำลังแก้ไขรายการจาก Queue
              </div>
            )}
            {error && (
              <div className="mx-3 mb-2 rounded-lg px-3 py-2 text-sm font-medium"
                style={{ background: '#fde8ee', color: '#9b2335' }}>⚠️ {error}</div>
            )}
            {file && !current && !isEditing && (
              <div className="px-3 pb-3 pt-2">
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="w-full py-3 rounded-xl font-bold text-sm shadow"
                  style={{ background: analyzing ? '#c8e4f0' : C.blue, color: C.blueDark, cursor: analyzing ? 'not-allowed' : 'pointer' }}>
                  {analyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      กำลังวิเคราะห์...
                    </span>
                  ) : `🔍 วิเคราะห์ด้วย AI${totalPending > 0 ? ` (เหลือ ${totalPending})` : ''}`}
                </button>
              </div>
            )}
          </div>

          {/* Queue */}
          <div className="rounded-2xl shadow overflow-hidden" style={{ background: '#fff8fa' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: C.brown }}>
              <span className="text-white text-sm font-bold">📥 Queue</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: C.blue, color: C.blueDark }}>{queue.length} รายการ</span>
            </div>
            <div className="px-3 py-2 max-h-64 overflow-y-auto">
              <QueueList queue={queue} onEdit={handleEdit} onDelete={handleDelete} compact />
            </div>
            <div className="px-3 pb-3">
              <ExportButton queue={queue} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {current ? (
            <>
              <ReviewForm result={current} onChange={setCurrent} />
              <div className="flex gap-2 pb-2">
                <button onClick={handleConfirm}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-base shadow-md"
                  style={{ background: C.blue, color: C.blueDark }}>
                  ✓ {isEditing ? 'บันทึกการแก้ไข' : `ยืนยัน → Queue${totalPending > 0 ? ' → ถัดไป' : ''}`}
                </button>
                {!isEditing && (
                  <button onClick={handleSkip} className="py-3 px-5 rounded-xl font-semibold text-sm"
                    style={{ background: C.yellow, color: C.brownText }}>ข้าม</button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl shadow py-32"
              style={{ background: '#fff8fa' }}>
              <svg className="w-20 h-20 mb-4" style={{ color: '#F2C4CE' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-semibold" style={{ color: C.brownMid }}>อัปโหลดรูปแล้วกดวิเคราะห์</p>
              <p className="text-sm mt-1" style={{ color: '#d4a882' }}>ผลวิเคราะห์จะแสดงที่นี่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
