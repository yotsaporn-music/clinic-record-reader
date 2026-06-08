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
      <div className="relative cursor-pointer" onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
        <img src={preview} alt="preview" className="w-full object-contain"
          style={{ maxHeight: '62vh', minHeight: 240 }} />
        <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded-lg">
          คลิกเพื่อเปลี่ยนรูป
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
        ${dragging ? 'opacity-80' : ''} ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      style={{ minHeight: 220, borderBottom: '2px dashed #f4c2d0' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
      <svg className="w-14 h-14" style={{ color: '#f4a7c0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm font-semibold" style={{ color: '#7a4f5a' }}>คลิกหรือลากไฟล์รูปมาวางที่นี่</p>
      <p className="text-xs" style={{ color: '#c4a882' }}>เลือกได้หลายรูปพร้อมกัน · JPG, PNG, WEBP</p>
    </div>
  )
}
