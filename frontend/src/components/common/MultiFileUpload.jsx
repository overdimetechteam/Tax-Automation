/**
 * MultiFileUpload — reusable multi-PDF upload component (Change 2 & Change 15).
 *
 * Props:
 *   existingFiles  — array of { id, original_filename, file_url } already on server
 *   onUpload(file) — called for each new file; should return a Promise
 *   onDelete(id)   — called when user removes an existing file
 *   accept         — MIME types / extensions (default: '.pdf')
 *   label          — section label text
 *   disabled       — disables all interactions
 */
import { useState, useRef } from 'react'
import { Upload, X, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function MultiFileUpload({
  existingFiles = [],
  onUpload,
  onDelete,
  accept = '.pdf',
  label = 'Upload Files',
  disabled = false,
}) {
  const [uploads, setUploads] = useState([]) // { id, name, status, progress, error }
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    e.target.value = ''
    files.forEach(processFile)
  }

  async function processFile(file) {
    const id = `${Date.now()}-${file.name}`
    setUploads(prev => [...prev, { id, name: file.name, status: 'uploading', progress: 0, error: null }])
    try {
      await onUpload(file, (pct) => {
        setUploads(prev =>
          prev.map(u => u.id === id ? { ...u, progress: pct } : u)
        )
      })
      setUploads(prev =>
        prev.map(u => u.id === id ? { ...u, status: 'done', progress: 100 } : u)
      )
    } catch (err) {
      setUploads(prev =>
        prev.map(u =>
          u.id === id ? { ...u, status: 'error', error: err?.message || 'Upload failed' } : u
        )
      )
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    files.forEach(processFile)
  }

  function removeQueued(id) {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{label}</p>}

      {/* Drop zone */}
      {!disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-brand-gray-border rounded-lg p-6 text-center cursor-pointer hover:border-brand-yellow transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-brand-gray" />
          <p className="text-xs text-brand-gray">
            Drag & drop PDF files here, or <span className="text-brand-yellow underline">browse</span>
          </p>
          <p className="text-xs text-brand-gray mt-1 opacity-60">PDF files only</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Existing files from server */}
      {existingFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-brand-gray">Uploaded files:</p>
          {existingFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-brand-black-light border border-brand-gray-border rounded px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                <span className="text-xs text-white truncate">{file.original_filename || file.file_url}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {file.file_url && (
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-info hover:text-blue-400 p-1"
                    title="Download"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                {!disabled && onDelete && (
                  <button
                    onClick={() => onDelete(file.id)}
                    className="text-brand-red hover:text-red-400 p-1"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-progress / completed / errored uploads */}
      {uploads.length > 0 && (
        <div className="space-y-1">
          {uploads.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-2 bg-brand-black-light border border-brand-gray-border rounded px-3 py-2"
            >
              {u.status === 'uploading' && <Loader2 className="w-4 h-4 text-brand-info animate-spin flex-shrink-0" />}
              {u.status === 'done' && <CheckCircle className="w-4 h-4 text-brand-success flex-shrink-0" />}
              {u.status === 'error' && <AlertCircle className="w-4 h-4 text-brand-red flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{u.name}</p>
                {u.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-brand-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-yellow transition-all"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
                {u.status === 'error' && (
                  <p className="text-xs text-brand-red">{u.error}</p>
                )}
              </div>
              {u.status !== 'uploading' && (
                <button onClick={() => removeQueued(u.id)} className="text-brand-gray hover:text-white p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
