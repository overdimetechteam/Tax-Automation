import { useRef, useState } from 'react'
import { Upload, X, FileText, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

export default function FileUpload({
  label,
  documentType,
  section = 'general',
  submissionId,
  existingDocs,
  documents,
  onUpload,
  onDelete,
  required = false,
  hint,
}) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const allDocs = existingDocs ?? documents ?? []
  const relevant = allDocs.filter(d => d.document_type === documentType)

  async function handleFiles(files) {
    if (!files?.length) return
    setUploading(true)
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', documentType)
        formData.append('section', section)
        await onUpload(submissionId, formData)
      } catch {
        // handled in parent
      }
    }
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-brand-gray flex items-center gap-1">
          {label}
          {required && <span className="text-brand-red">*</span>}
        </label>
        {hint && <span className="text-xs text-brand-gray/60 italic">{hint}</span>}
      </div>

      {/* Existing docs */}
      {relevant.length > 0 && (
        <div className="space-y-1.5">
          {relevant.map(doc => (
            <div key={doc.id} className="flex items-center justify-between bg-brand-black-soft rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-brand-yellow" />
                <span className="text-xs text-white truncate max-w-48">{doc.original_filename}</span>
                <span className="text-xs text-brand-gray">({doc.file_size_kb} KB)</span>
                {doc.is_verified && <CheckCircle size={12} className="text-brand-success" />}
              </div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  className="text-brand-gray hover:text-brand-red transition-colors ml-2"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200',
          dragging
            ? 'border-brand-yellow bg-brand-yellow/5'
            : 'border-brand-gray-border hover:border-brand-yellow/50 hover:bg-brand-black-soft',
          uploading && 'opacity-60 pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={16} className="mx-auto mb-1.5 text-brand-gray" />
        {uploading ? (
          <p className="text-xs text-brand-yellow">Uploading...</p>
        ) : (
          <>
            <p className="text-xs text-brand-gray">Drop files here or <span className="text-brand-yellow">browse</span></p>
            <p className="text-xs text-brand-gray/50 mt-0.5">PDF, JPG, PNG up to 10MB</p>
          </>
        )}
      </div>
    </div>
  )
}
