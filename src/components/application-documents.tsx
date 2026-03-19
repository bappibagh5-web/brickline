'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DOCUMENT_STATUS_STYLES,
  DOCUMENT_TYPES,
  documentTypeLabel,
  getMissingDocuments,
  getRequiredDocuments
} from '@/lib/document-config';
import type { AppRole, DocumentRecord, DocumentStatus, DocumentType, LoanType } from '@/lib/types';

type DocumentRow = DocumentRecord & {
  uploaded_by_name?: string;
  download_url?: string | null;
};

type ApplicationDocumentsProps = {
  applicationId: string;
  loanType: LoanType | null;
  role: AppRole;
  canUpload: boolean;
  canAdminManage: boolean;
  initialDocuments: DocumentRow[];
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function ApplicationDocuments({
  applicationId,
  loanType,
  role,
  canUpload,
  canAdminManage,
  initialDocuments
}: ApplicationDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [documentType, setDocumentType] = useState<DocumentType>('id_doc');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const existingTypes = useMemo(() => documents.map((doc) => doc.document_type), [documents]);
  const requiredDocs = getRequiredDocuments(loanType);
  const missingDocs = getMissingDocuments(loanType, existingTypes);

  async function uploadFileWithProgress(path: string, selectedFile: File) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      throw new Error('You must be logged in to upload.');
    }

    const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/documents/${path}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', storageUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('content-type', selectedFile.type || 'application/pdf');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(xhr.responseText || 'Upload failed.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(selectedFile);
    });
  }

  async function onUpload() {
    setError('');

    if (!file) {
      setError('Select a PDF file first.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Please sign in again.');
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${applicationId}/${Date.now()}-${safeName}`;

      await uploadFileWithProgress(storagePath, file);

      const response = await fetch(`/api/applications/${applicationId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: storagePath,
          file_name: file.name,
          document_type: documentType
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to record document.');
      }

      setDocuments((prev) => [payload.document as DocumentRow, ...prev]);
      setFile(null);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 700);
    }
  }

  async function onStatusUpdate(documentId: string, status: DocumentStatus) {
    setError('');

    const response = await fetch(`/api/documents/${documentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Unable to update status.');
      return;
    }

    setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, status } : doc)));
  }

  async function onDelete(documentId: string) {
    setError('');

    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE'
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Unable to delete document.');
      return;
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Documents</h2>
          <p className="text-sm text-slate-600">Upload and manage application files.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{role.replace('_', ' ')}</span>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Required Documents</p>
        {requiredDocs.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {requiredDocs.map((docType) => {
              const missing = missingDocs.includes(docType);
              return (
                <span
                  key={docType}
                  className={`rounded-full px-2.5 py-1 text-xs ${missing ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  {documentTypeLabel(docType)} {missing ? '(missing)' : '(received)'}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No loan-type requirements yet. Select a loan type in intake first.</p>
        )}
      </div>

      {canUpload ? (
        <div className="mt-5 rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Upload PDF</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as DocumentType)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={uploading}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={uploading}
            />

            <button
              type="button"
              onClick={onUpload}
              disabled={uploading}
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {progress > 0 ? (
            <div className="mt-3">
              <div className="h-2 w-full rounded bg-slate-200">
                <div className="h-2 rounded bg-brand-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-600">Upload progress: {progress}%</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2">File Name</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Uploaded By</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length ? (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="py-2 pr-3 font-medium text-slate-800">{doc.file_name}</td>
                  <td className="py-2 pr-3 text-slate-600">{documentTypeLabel(doc.document_type)}</td>
                  <td className="py-2 pr-3 text-slate-600">{doc.uploaded_by_name || doc.uploaded_by}</td>
                  <td className="py-2 pr-3 text-slate-600">{new Date(doc.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${DOCUMENT_STATUS_STYLES[doc.status]}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {doc.download_url ? (
                        <a
                          href={doc.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </a>
                      ) : null}

                      {canAdminManage ? (
                        <>
                          <select
                            value={doc.status}
                            onChange={(event) => onStatusUpdate(doc.id, event.target.value as DocumentStatus)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="uploaded">Uploaded</option>
                            <option value="under_review">Under Review</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => onDelete(doc.id)}
                            className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-3 text-slate-500">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
