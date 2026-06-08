'use client'
import { useRef, useState } from 'react'

interface Props {
  onFilesSelect: (files: File[]) => void
  preview: string | null
  disabled?: boolean
  pendingCount?: number
}

export default function UploadZone({ onFilesSelect, preview, disabled, pendingCount = 0 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | File[]) {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (images.length > 0) onFilesSelect(images)
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}
        ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400 hover:bg-blue-50'}`}
      style={{ minHeight: 180 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="preview"
            className="w-full rounded-xl object-contain"
            style={{ maxHeight: '50vh', minHeight: 300 }}
          />
          {pendingCount > 0 && (
            <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              +{pendingCount} รูปถัดไป
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">คลิกหรือลากไฟล์รูปมาวางที่นี่</p>
          <p className="text-xs">เลือกได้หลายรูปพร้อมกัน · JPG, PNG, WEBP</p>
        </div>
      )}
    </div>
  )
}
