import EditorFileUploader from '@/platform/functions/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSelect } from '@/platform/core/layout/themes/components/ThemedSelect.tsx';
import { FormMode } from '@/platform/core/common.types.ts';
import {
  AttachmentFile,
  Document,
  DocumentCreate,
  DocumentUpdate,
} from '@/platform/functions/documents/document.types.ts';

import React, { useEffect, useState } from 'react';

interface DocumentFormProps {
  document?: Document;
  mode: FormMode;
  onSubmit: (data: DocumentCreate | DocumentUpdate) => Promise<void>;
  onCancel: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  document,
  mode,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<DocumentCreate>({
    content_html: '',
    attachments: [],
  });
  const [status, setStatus] = useState(document?.status ?? 'active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
  ];

  useEffect(() => {
    if (document && mode !== 'create') {
      setFormData({
        content_html: document.content_html,
        attachments: document.attachments || [],
      });
      setStatus(document.status ?? 'active');
    }
  }, [document, mode]);

  const handleContentChange = (content_html: string) => {
    setFormData((prev) => ({ ...prev, content_html }));
  };

  const handleAttachmentsChange = (attachments: AttachmentFile[]) => {
    setFormData((prev) => ({ ...prev, attachments }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(mode === 'create' ? formData : { ...formData, status });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    console.log('Current data:', setFormData);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <EditorJoditComponent
                content={formData.content_html}
                onChange={handleContentChange}
              />
            </div>
          </div>

          {/* File Uploader */}
          <div className="mb-6">
            <EditorFileUploader
              attachments={formData.attachments}
              onAttachmentsChange={handleAttachmentsChange}
            />
          </div>

          {mode !== 'create' && (
            <div className="mb-6">
              <ThemedSelect
                label="Status"
                value={status}
                onChange={setStatus}
                options={statusOptions}
                allowEmpty={false}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePreview}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Preview
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>

              <ThemedButton
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading
                  ? 'Saving...'
                  : mode === 'create'
                    ? 'Create'
                    : 'Update'}
              </ThemedButton>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview</h2>

          <div className="prose max-w-none mb-6">
            <div dangerouslySetInnerHTML={{ __html: formData.content_html }} />
          </div>

          {formData.attachments.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Attachments ({formData.attachments.length})
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {formData.attachments.map((file) => (
                  <li key={file.id}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
