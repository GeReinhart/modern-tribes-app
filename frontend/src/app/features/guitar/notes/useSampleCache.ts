import { useCallback, useEffect, useRef, useState } from 'react';

import { getAudioContext } from './audioContext.ts';
import { SAMPLE_CATALOG } from './sampleCatalog.ts';

const BASE_URL = (import.meta.env.VITE_GUITAR_SAMPLES_URL as string | undefined)?.replace(/\/$/, '');
const CACHE_NAME = 'guitar-notes-samples-v1';
const LAST_CHECK_KEY = 'guitar_samples_last_check';
const VERSION_KEY = 'guitar_samples_version';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const ALL_FILES = SAMPLE_CATALOG.map(s => s.file);

export type CacheStatus = 'loading' | 'ready' | 'fallback';

export interface SampleCacheApi {
  isDownloading: boolean;
  progress: number;
  status: CacheStatus;
  getBuffer: (file: string) => AudioBuffer | null;
}

function fileUrl(file: string): string {
  return `${BASE_URL}/${file}`;
}

async function openCache(): Promise<Cache> {
  return caches.open(CACHE_NAME);
}

async function getMissingFiles(cache: Cache): Promise<string[]> {
  const checks = await Promise.all(ALL_FILES.map(f => cache.match(fileUrl(f))));
  return ALL_FILES.filter((_, i) => checks[i] === undefined);
}

async function downloadFiles(
  cache: Cache,
  files: string[],
  signal: AbortSignal,
  onProgress: (n: number) => void,
): Promise<void> {
  let done = 0;
  for (const file of files) {
    if (signal.aborted) return;
    const res = await fetch(fileUrl(file), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`);
    await cache.put(fileUrl(file), res);
    onProgress(++done);
  }
}

async function decodeAllFiles(
  cache: Cache,
  buffers: Map<string, AudioBuffer>,
  signal: AbortSignal,
): Promise<void> {
  const ctx = getAudioContext();
  for (const file of ALL_FILES) {
    if (signal.aborted) return;
    const res = await cache.match(fileUrl(file));
    if (!res) continue;
    const ab = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(ab);
    buffers.set(file, buffer);
  }
}

async function fetchManifestVersion(signal: AbortSignal): Promise<string> {
  const res = await fetch(`${BASE_URL}/manifest.json`, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
  const data = await res.json() as { version: string };
  return data.version;
}

async function backgroundRefresh(
  cache: Cache,
  buffers: Map<string, AudioBuffer>,
  signal: AbortSignal,
): Promise<void> {
  const lastCheck = parseInt(localStorage.getItem(LAST_CHECK_KEY) ?? '0', 10);
  if (Date.now() - lastCheck < CHECK_INTERVAL) return;

  const version = await fetchManifestVersion(signal);
  localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

  if (version === localStorage.getItem(VERSION_KEY)) return;

  await downloadFiles(cache, ALL_FILES, signal, () => {});
  await decodeAllFiles(cache, buffers, signal);
  localStorage.setItem(VERSION_KEY, version);
}

export function useSampleCache(): SampleCacheApi {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<CacheStatus>('fallback');
  const buffers = useRef(new Map<string, AudioBuffer>());

  useEffect(() => {
    if (!BASE_URL) {
      console.info('[GuitarNotes] VITE_GUITAR_SAMPLES_URL is not set — audio disabled');
      return;
    }

    const ctrl = new AbortController();
    const { signal } = ctrl;

    (async () => {
      try {
        console.info(`[GuitarNotes] Looking for ${ALL_FILES.length} MP3 samples at: ${BASE_URL}`);
        const cache = await openCache();
        const missing = await getMissingFiles(cache);

        if (missing.length === 0) {
          console.info(`[GuitarNotes] All ${ALL_FILES.length} files found in cache (${CACHE_NAME})`);
        } else {
          console.info(`[GuitarNotes] ${missing.length} file(s) missing from cache — downloading: ${missing.join(', ')}`);
        }

        if (missing.length > 0) {
          setIsDownloading(true);
          await downloadFiles(cache, missing, signal, n => setProgress(n));
          setIsDownloading(false);
        }

        if (signal.aborted) return;
        await decodeAllFiles(cache, buffers.current, signal);
        if (signal.aborted) return;

        setStatus('ready');
        localStorage.setItem(VERSION_KEY, localStorage.getItem(VERSION_KEY) ?? '');
        backgroundRefresh(cache, buffers.current, signal).catch(() => {});
      } catch {
        if (!signal.aborted) setIsDownloading(false);
      }
    })();

    return () => ctrl.abort();
  }, []);

  const getBuffer = useCallback((file: string) => buffers.current.get(file) ?? null, []);

  return { isDownloading, progress, status, getBuffer };
}
