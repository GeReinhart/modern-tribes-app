import { apiService } from '@/app/platform/core/api/api.service.ts';

import {
  GuitarSongLayout,
  GuitarSongLayoutBlock,
  GuitarSongLayoutBlockContentUpdate,
  GuitarSongLayoutRowInput,
  GuitarSongLayoutSettings,
  GuitarSongLayoutSettingsUpdate,
  MoveDirection,
} from './types.ts';

const BASE = '/features/tasks/guitar-songs';

export const guitarSongLayoutService = {
  addRow: (songId: string, data: GuitarSongLayoutRowInput): Promise<GuitarSongLayout> =>
    apiService.post<GuitarSongLayout>(`${BASE}/songs/${songId}/layout/rows`, data),

  replaceRow: (rowId: string, data: GuitarSongLayoutRowInput): Promise<GuitarSongLayout> =>
    apiService.put<GuitarSongLayout>(`${BASE}/layout/rows/${rowId}`, data),

  moveRow: (rowId: string, direction: MoveDirection): Promise<GuitarSongLayout> =>
    apiService.post<GuitarSongLayout>(`${BASE}/layout/rows/${rowId}/move`, { direction }),

  removeRow: (rowId: string): Promise<void> => apiService.delete<void>(`${BASE}/layout/rows/${rowId}`),

  updateSettings: (songId: string, data: GuitarSongLayoutSettingsUpdate): Promise<GuitarSongLayoutSettings> =>
    apiService.patch<GuitarSongLayoutSettings>(`${BASE}/songs/${songId}/layout/settings`, data),

  updateBlockContent: (blockId: string, data: GuitarSongLayoutBlockContentUpdate): Promise<GuitarSongLayoutBlock> =>
    apiService.patch<GuitarSongLayoutBlock>(`${BASE}/layout/blocks/${blockId}`, data),

  downloadPdf: (songId: string): Promise<Blob> => apiService.getBlob(`${BASE}/songs/${songId}/layout/pdf`),
};

export const triggerSongPdfDownload = async (songId: string, songTitle: string): Promise<void> => {
  const blob = await guitarSongLayoutService.downloadPdf(songId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${songTitle}.pdf`;
  link.click();
  // Also open it for viewing, same as saving a regular file then opening it — delay the
  // revoke so the just-opened tab has time to actually load the blob before it's freed.
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
