import { getAPIBaseUrl } from '@/app/platform/core/env.ts';
import { useAppConfig } from '@/app/platform/core/app-config/AppConfigContext.tsx';
import { uploadImage } from '@/app/platform/functions/documents/editor/editor-upload-utils.ts';

import { useMemo, useRef } from 'react';

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
}

const EditorJoditComponent = ({
  content,
  onChange,
  minHeight = 600,
  compact = false,
}: JoditEditorComponentProps) => {
  const editor = useRef(null);
  const { config: appConfig } = useAppConfig();

  const config = useMemo(
    () => ({
      readonly: false,
      minHeight,
      zIndex: 10000,
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
      buttons: compact
        ? COMPACT_BUTTONS
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
      buttonsXS: COMPACT_BUTTONS,
    }),
    [appConfig.editorImageExtensions, minHeight, compact],
  );

  return (
    <div className="w-full">
      <JoditEditor
        ref={editor}
        value={content}
        config={config}
        onBlur={onChange}
        onChange={() => {}}
      />
    </div>
  );
};

export default EditorJoditComponent;
