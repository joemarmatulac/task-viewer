'use client'

import { useRef, useState } from 'react'

interface FileUploadProps {
  onFile: (file: File) => void
  isLoading?: boolean
}

export function FileUpload({ onFile, isLoading }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      alert('Please select an .xlsx file.')
      return
    }
    onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFile(e.dataTransfer.files[0])
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragging
          ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50'
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:bg-gray-800'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Parsing…</p>
      ) : (
        <>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Drop your .xlsx file here</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">or click to browse</p>
        </>
      )}
    </div>
  )
}
