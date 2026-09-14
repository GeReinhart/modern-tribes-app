import { getAPIBaseUrl } from '@/app/platform/core/env.ts';
import { useAppConfig } from '@/app/platform/core/app-config/AppConfigContext.tsx';
import { uploadImage } from '@/app/platform/functions/documents/editor/editor-upload-utils.ts';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { Jodit } from 'jodit';
import JoditEditor from 'jodit-react';

const COMPACT_BUTTONS = [
  'bold',
  'italic',
  '|',
  'ul',
  'ol',
  '|',
  'link',
  'image',
  '|',
  'undo',
  'redo',
];

// For editors that only need the bare essentials (e.g. a short description field).
const MINIMAL_BUTTONS = ['bold', 'italic', 'ul', 'ol', 'link'];

// jodit-react only calls onChange with the freshest content on blur, so typed content used to
// only reach the caller's state once the field lost focus -- stale for autosave/dirty-tracking
// during a long, uninterrupted typing session. Debouncing the live onChange keeps state current
// while typing without re-rendering the caller on every keystroke.
const CHANGE_DEBOUNCE_MS = 400;

interface UploadResponse {
  error?: number | boolean;
  message?: string;
  files?: string[];
  url?: string;
}

interface UploaderContext {
  j?: {
    selection: { insertImage: (src: string, style: null, width: number) => void };
    alert?: (msg: string) => void;
  };
  selection?: { insertImage: (src: string, style: null, width: number) => void };
  alert?: (msg: string) => void;
}

interface JoditEditorComponentProps {
  content: string;
  onChange: (content: string) => void;
  minHeight?: number;
  compact?: boolean;
  // Even smaller than compact: only bold/italic/lists/link. Takes precedence over `compact`.
  minimal?: boolean;
  // Compact toolbars drop the fullsize button by default to stay small; set this when a
  // compact editor still needs a way to expand for a longer piece of writing.
  allowFullscreen?: boolean;
}

const EditorJoditComponent = ({
  content,
  onChange,
  minHeight = 600,
  compact = false,
  minimal = false,
  allowFullscreen = false,
}: JoditEditorComponentProps) => {
  const editor = useRef(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks what we know to actually be in the live editor right now -- updated synchronously on
  // every keystroke (not debounced) and resynced after an external `content` change commits.
  const liveContentRef = useRef(content);
  const { config: appConfig } = useAppConfig();

  const clearPendingChange = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      liveContentRef.current = value;
      clearPendingChange();
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        onChange(value);
      }, CHANGE_DEBOUNCE_MS);
    },
    [clearPendingChange, onChange],
  );

  const handleBlur = useCallback(
    (value: string) => {
      liveContentRef.current = value;
      clearPendingChange();
      onChange(value);
    },
    [clearPendingChange, onChange],
  );

  useEffect(() => clearPendingChange, [clearPendingChange]);

  // Only push `content` down into the underlying editor when it's a genuine external change (a
  // different revision loaded, a cancel/reset) -- not merely React echoing back what we ourselves
  // just typed. jodit-react replaces the editor's whole DOM content whenever its `value` prop
  // doesn't match its current live value, which resets the caret to the start of the document;
  // feeding back our own just-typed content on every keystroke was doing exactly that.
  const editorValue = content === liveContentRef.current ? undefined : content;
  useEffect(() => {
    liveContentRef.current = content;
  }, [content]);

  const config = useMemo(
    () => ({
      readonly: false,
      minHeight,
      zIndex: 10000,
      toolbarSticky: false,
      uploader: {
        insertImageAsBase64URI: false,
        imagesExtensions: appConfig.editorImageExtensions,
        url: `${getAPIBaseUrl()}/platform/core/uploads/image`,
        format: 'json',
        prepareData: function (formData: FormData) {
          return formData;
        },
        isSuccess: function (resp: UploadResponse) {
          return !resp.error || resp.error === 0;
        },
        getMessage: function (resp: UploadResponse) {
          return resp.message ?? '';
        },
        process: function (resp: UploadResponse) {
          return {
            files: resp.files || [resp.url ?? ''],
            path: '',
            baseurl: '',
            error: resp.error ? 1 : 0,
            message: resp.message ?? '',
          };
        },
        defaultHandlerSuccess: function (this: UploaderContext, data: { files?: string[] }) {
          const files = data.files || [];
          if (files.length) {
            const jodit = this.j || this;
            jodit.selection?.insertImage(files[0], null, 250);
          }
        },
        error: function (this: UploaderContext, e: Error) {
          console.error('Upload error:', e);
          const jodit = this.j || this;
          if (jodit?.alert) {
            jodit.alert('Upload failed: ' + e.message);
          }
        },
      },
      events: {
        afterInit: function (instance: Jodit) {
          // Handle paste images
          instance.events.on('paste', async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                  try {
                    // Create placeholder
                    const placeholder = instance.createInside.element('span', {
                      style: 'color: #999; font-style: italic;',
                    });
                    placeholder.textContent = '⏳ Uploading image...';
                    instance.selection.insertNode(placeholder);

                    // Upload image
                    const url = await uploadImage(file);

                    // Remove placeholder
                    placeholder.remove();

                    // Insert uploaded image
                    instance.selection.insertImage(url, null, 250);
                  } catch (error) {
                    console.error('Upload error:', error);
                    instance.alert('Failed to upload image');
                  }
                }
              }
            }
          });

          // Handle drop images
          instance.events.on('drop', async (e: DragEvent) => {
            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file.type.startsWith('image/')) {
                e.preventDefault();

                try {
                  // Create placeholder
                  const placeholder = instance.createInside.element('span', {
                    style: 'color: #999; font-style: italic;',
                  });
                  placeholder.textContent = '⏳ Uploading image...';
                  instance.selection.insertNode(placeholder);

                  // Upload image
                  const url = await uploadImage(file);

                  // Remove placeholder
                  placeholder.remove();

                  // Insert uploaded image
                  instance.selection.insertImage(url, null, 250);
                } catch (error) {
                  console.error('Upload error:', error);
                  instance.alert('Failed to upload image');
                }
              }
            }
          });
        },
      },
      buttons: minimal
        ? MINIMAL_BUTTONS
        : compact
        ? (allowFullscreen ? [...COMPACT_BUTTONS, '|', 'fullsize'] : COMPACT_BUTTONS)
        : [
            'source',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            '|',
            'ul',
            'ol',
            '|',
            'font',
            'fontsize',
            'brush',
            'paragraph',
            '|',
            'image',
            'video',
            'table',
            'link',
            '|',
            'align',
            'undo',
            'redo',
            '|',
            'hr',
            'eraser',
            'copyformat',
            '|',
            'symbol',
            'fullsize',
            'print',
          ],
      buttonsXS: minimal ? MINIMAL_BUTTONS : COMPACT_BUTTONS,
    }),
    [appConfig.editorImageExtensions, minHeight, compact, minimal, allowFullscreen],
  );

  return (
    <div className="w-full">
      <JoditEditor
        ref={editor}
        value={editorValue}
        config={config}
        onBlur={handleBlur}
        onChange={handleChange}
      />
    </div>
  );
};

export default EditorJoditComponent;
