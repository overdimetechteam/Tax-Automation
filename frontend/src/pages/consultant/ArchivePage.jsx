import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/format'
import PageHeader from '../../components/common/PageHeader'
import {
  Archive, ChevronDown, ChevronRight, User, Calendar,
  FileText, Download, FolderOpen, Folder
} from 'lucide-react'

function DocumentRow({ doc }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-brand-black hover:bg-brand-black/70 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={14} className="text-brand-yellow flex-shrink-0" />
        <span className="text-sm text-white truncate">{doc.original_filename}</span>
        <span className="text-xs text-brand-gray flex-shrink-0">{formatDate(doc.uploaded_at)}</span>
      </div>
      <a
        href={doc.file_url}
        target="_blank"
        rel="noreferrer"
        className="ml-3 flex-shrink-0 p-1.5 rounded text-brand-gray hover:text-brand-yellow transition-colors"
        title="Download"
      >
        <Download size={14} />
      </a>
    </div>
  )
}

function YearNode({ year }) {
  const [open, setOpen] = useState(false)
  const hasDocs = year.documents?.length > 0

  return (
    <div className="ml-6 border-l border-brand-gray-border pl-4 pb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 py-2 text-sm hover:text-white transition-colors w-full text-left group"
      >
        {open
          ? <ChevronDown size={14} className="text-brand-yellow" />
          : <ChevronRight size={14} className="text-brand-gray group-hover:text-white" />
        }
        <Calendar size={14} className="text-brand-yellow" />
        <span className="font-medium text-white">{year.tax_year_label}</span>
        <span className="text-brand-gray text-xs ml-1">
          archived {formatDate(year.archived_at)}
        </span>
        {year.net_tax_payable != null && (
          <span className="ml-auto text-xs text-brand-yellow font-medium">
            Net Tax: {formatCurrency(parseFloat(year.net_tax_payable))}
          </span>
        )}
      </button>

      {open && (
        <div className="ml-4 mt-1 space-y-1">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-lg bg-brand-black border border-brand-gray-border text-xs">
            <div>
              <span className="text-brand-gray">Submission ID</span>
              <p className="text-white font-medium">#{year.submission_id}</p>
            </div>
            <div>
              <span className="text-brand-gray">Net Tax Payable</span>
              <p className="text-brand-yellow font-medium">
                {year.net_tax_payable != null ? formatCurrency(parseFloat(year.net_tax_payable)) : '—'}
              </p>
            </div>
          </div>

          {hasDocs ? (
            <div className="space-y-1">
              <p className="text-xs text-brand-gray px-1 mb-1">Documents ({year.documents.length})</p>
              {year.documents.map(doc => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-gray px-1 py-2 italic">No documents uploaded.</p>
          )}
        </div>
      )}
    </div>
  )
}

function ClientNode({ client }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-brand-gray-border rounded-xl bg-brand-black-light overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-3 w-full px-5 py-4 hover:bg-brand-black/40 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-brand-yellow" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{client.client_name}</p>
          <p className="text-xs text-brand-gray">{client.client_email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-brand-gray">
            {client.years.length} year{client.years.length !== 1 ? 's' : ''}
          </span>
          {open
            ? <FolderOpen size={16} className="text-brand-yellow" />
            : <Folder size={16} className="text-brand-gray" />
          }
          {open
            ? <ChevronDown size={14} className="text-brand-yellow" />
            : <ChevronRight size={14} className="text-brand-gray" />
          }
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-brand-gray-border space-y-1">
          {client.years.map(year => (
            <YearNode key={year.submission_id} year={year} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ArchivePage() {
  const [search, setSearch] = useState('')

  const { data: tree = [], isLoading, isError } = useQuery({
    queryKey: ['archive-tree'],
    queryFn: () => api.get('/tax/archive/').then(r => r.data),
  })

  const filtered = tree.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Archive"
        subtitle="Archived tax submissions and documents, organised by client and year of assessment."
        icon={<Archive size={20} className="text-brand-yellow" />}
      />

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-xs text-sm"
        />
        {!isLoading && (
          <span className="text-xs text-brand-gray">
            {filtered.length} client{filtered.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-16 text-brand-gray">Loading archive…</div>
      )}

      {isError && (
        <div className="text-center py-16 text-brand-red">Failed to load archive.</div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-16">
          <Archive size={40} className="text-brand-gray mx-auto mb-3 opacity-40" />
          <p className="text-brand-gray text-sm">
            {search ? 'No clients match your search.' : 'No archived submissions yet.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(client => (
            <ClientNode key={client.client_email} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
