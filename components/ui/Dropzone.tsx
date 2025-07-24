'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DropzoneProps {
  onFileUpload: (file: File) => void
}

export default function Dropzone({ onFileUpload }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setUploading] = useState(false)
  const router = useRouter()

  /* ───────── helpers ───────── */
  async function uploadFile(file: File) {
    console.log('DROP → got file:', file)

    const body = new FormData()
    body.append('file', file)

    setUploading(true)
    const res = await fetch('/api/analyze', { method: 'POST', body })
    console.log('API status →', res.status)

    /* ---------- safe‑parse response ---------- */
    let data: any = null
    const ct = res.headers.get('content-type') || ''

    if (ct.includes('application/json')) {
      data = await res.json()
    } else {
      // Server returned HTML (Next.js error page) → read as text
      const text = await res.text()
      console.error('Server returned non‑JSON error page:', text)
    }

    if (!res.ok) {
      alert('Upload failed: ' + (data?.error || res.status))
      setUploading(false)
      return
    }

    const { id } = data
    console.log('API JSON id →', id)

    sessionStorage.setItem('analysis_id', id)
    onFileUpload(file) // original callback
    router.push(`/analyzed?id=${id}`)
  }

  function handleFiles(files: FileList | null) {
    if (!files?.[0] || !files[0].name.endsWith('.zip')) {
      alert('Please select a .zip exported from WhatsApp')
      return
    }
    uploadFile(files[0]).catch(console.error)
  }

  /* ───────── drag events ───────── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  /* ───────── click fallback ───────── */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleFiles(e.target.files)

  const handleClick = () =>
    document.getElementById('file-input')?.click()

  /* ───────── UI ───────── */
  return (
    <div
      className={`w-96 h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-white bg-white/20 scale-105'
          : 'border-white/40 hover:border-white/60 hover:bg-white/10'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="w-16 h-16 flex items-center justify-center mb-4">
        <i className="ri-upload-cloud-2-line text-6xl text-white drop-shadow-lg"></i>
      </div>

      <p className="text-white/90 text-base font-inter font-medium">
        {isUploading
          ? 'Analyzing…'
          : isDragActive
          ? 'Drop here…'
          : 'Drag & drop or click…'}
      </p>

      <p className="text-white/60 text-sm font-inter mt-2">
        WhatsApp chat (.zip) files only
      </p>

      <input
        id="file-input"
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}
