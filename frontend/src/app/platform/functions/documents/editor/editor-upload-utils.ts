import { getAPIBaseUrl } from '@/app/platform/core/env.ts';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('files', file);

  const response = await fetch(`${getAPIBaseUrl()}/platform/core/uploads/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Image upload failed');
  }

  const data = await response.json();

  if (data.error && data.error !== 0) {
    throw new Error(data.message || 'Upload failed');
  }

  return data.url;
};

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getAPIBaseUrl()}/platform/core/uploads/file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'File upload failed');
  }

  const data = await response.json();
  return data.url;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
