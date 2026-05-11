import { useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { uploadImage } from '@/utils/uploadHelpers';
import type { Jodit } from 'jodit';
import { getAPIBaseUrl } from '@/config/env';

interface JoditEditorComponentProps {
    content: string;
    onChange: (content: string) => void;
}

const JoditEditorComponent = ({ content, onChange }: JoditEditorComponentProps) => {
    const editor = useRef(null);

    const config = useMemo(
        () => ({
            readonly: false,
            minHeight: 600,
            uploader: {
                insertImageAsBase64URI: false,
                imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
                url: `${getAPIBaseUrl()}/uploads/image`,
                format: 'json',
                prepareData: function (formData: FormData) {
                    return formData;
                },
                isSuccess: function (resp: any) {
                    return !resp.error || resp.error === 0;
                },
                getMessage: function (resp: any) {
                    return resp.message;
                },
                process: function (resp: any) {
                    return {
                        files: resp.files || [resp.url],
                        path: '',
                        baseurl: '',
                        error: resp.error ? 1 : 0,
                        message: resp.message
                    };
                },
                defaultHandlerSuccess: function (this: any, data: any) {
                    const files = data.files || [];
                    if (files.length) {
                        const jodit = this.j || this;
                        jodit.selection.insertImage(files[0], null, 250);
                    }
                },
                error: function (this: any, e: Error) {
                    console.error('Upload error:', e);
                    const jodit = this.j || this;
                    if (jodit && jodit.alert) {
                        jodit.alert('Upload failed: ' + e.message);
                    }
                }
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
                                            style: 'color: #999; font-style: italic;'
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
                                        style: 'color: #999; font-style: italic;'
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
                }
            },
            buttons: [
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
                'print'
            ],
            buttonsXS: [
                'bold',
                'italic',
                '|',
                'ul',
                'ol',
                '|',
                'image',
                'link',
                '|',
                'align',
                'undo',
                'redo'
            ]
        }),
        []
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

export default JoditEditorComponent;