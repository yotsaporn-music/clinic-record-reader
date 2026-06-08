'use client'
import { useRef, useState } from 'react'

interface Props {
  onFilesSelect: (files: File[]) => void
  preview: string | null
  disabled?: boolean
}

export default function UploadZone({ onFilesSelect, preview, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | File[]) {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (images.length > 0) onFilesSelect(images)
  }

  if (preview) {
    return (
      <div className="relative cursor-pointer group" onClick={() => !disabled && inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
        <img src={preview} alt="preview" className="w-full object-contain block"
          style={{ maxHeight: 'calc(100vh - 180px)', minHeight: 400 }} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-b-xl flex items-end justify-end p-3">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1 rounded-lg font-medium"
            style={{ background: '#A8CEE3', color: '#1a4a5a' }}>
            📁 คลิกเพื่อเปลี่ยนรูป
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
        ${dragging ? 'opacity-70' : ''} ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      style={{ minHeight: 360 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
      <svg className="w-20 h-20" style={{ color: '#A8CEE3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-base font-bold" style={{ color: '#7B4028' }}>คลิกหรือลากไฟล์รูปมาวางที่นี่</p>
      <p className="text-sm" style={{ color: '#c4905a' }}>เลือกได้หลายรูปพร้อมกัน · JPG, PNG, WEBP</p>
    </div>
  )
}
