import { useState, useRef, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AttachmentFile } from '@/types/document.types.ts';
import { uploadFile, formatFileSize } from '@/utils/uploadHelpers';
import { useAppConfig } from '@/contexts/AppConfigContext';
import {
    XMarkIcon,
    PaperClipIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface FileUploaderProps {
    attachments: AttachmentFile[];
    onAttachmentsChange: (attachments: AttachmentFile[]) => void;
    maxFiles?: number;
    maxFileSize?: number; // in MB
}

const FileUploader = ({
                          attachments,
                          onAttachmentsChange,
                          maxFiles: maxFilesProp,
                          maxFileSize: maxFileSizeProp,
                      }: FileUploaderProps) => {
    const { t } = useTranslation();
    const { config } = useAppConfig();
    const maxFiles = maxFilesProp ?? config.uploadMaxFiles;
    const maxFileSize = maxFileSizeProp ?? config.uploadMaxFileSizeMb;
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (attachments.length + files.length > maxFiles) {
            alert(t('files.maxFilesError', { maxFiles }));
            return;
        }

        setUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                if (file.size > maxFileSize * 1024 * 1024) {
                    throw new Error(t('files.fileSizeError', { filename: file.name, maxFileSize }));
                }

                const url = await uploadFile(file);

                return {
                    id: Math.random().toString(36).substring(7),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url,
                    uploadedAt: new Date()
                } as AttachmentFile;
            });

            const newAttachments = await Promise.all(uploadPromises);
            onAttachmentsChange([...attachments, ...newAttachments]);
        } catch (error) {
            console.error('Upload error:', error);
            alert(error instanceof Error ? error.message : t('files.uploadFailed'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (id: string) => {
        onAttachmentsChange(attachments.filter(att => att.id !== id));
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('zip') || type.includes('rar')) return '🗜️';
        return '📎';
    };

    return (
        <div className="w-full">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('files.attachments')}
                </label>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || attachments.length >= maxFiles}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <PaperClipIcon className="h-5 w-5 mr-2" />
                    {uploading ? t('files.uploading') : t('files.attachFiles')}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                />

                <p className="mt-2 text-xs text-gray-500">
                    {t('files.maxSize', { maxFiles, maxFileSize })}
                </p>
            </div>

            {attachments.length > 0 && (
                <div className="space-y-2">
                    {attachments.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">
                  {getFileIcon(file.type)}
                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                                <a
                                    href={file.url}
                                    download={file.name}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title={t('tribes.download')}
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(file.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title={t('common.delete')}
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
