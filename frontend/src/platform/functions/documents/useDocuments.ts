import { useCallback } from 'react';

import { documentService } from '@/platform/functions/documents/document.service.ts';
import {
  Document,
  DocumentCreate,
  DocumentUpdate,
} from '@/platform/functions/documents/document.types.ts';
import { apiHooks } from '@/platform/core/api/api-hooks.ts';
import { createEntityHooks } from '@/platform/core/api/useEntityCrud.ts';

const { useList, useById, useMutations } = createEntityHooks<
  Document,
  DocumentCreate,
  DocumentUpdate
>(documentService, 'documents');

export function useDocuments() {
  const { items: documents, ...rest } = useList();
  return { documents, ...rest };
}

export function useDocument(id: string | null) {
  const { item: document, ...rest } = useById(id);
  return { document, ...rest };
}

export function useDocumentMutations() {
  const {
    create: createDocument,
    update: updateDocument,
    remove: deleteDocument,
    loading,
    error,
  } = useMutations();
  const { execute } = apiHooks<Document>();

  const getDocumentById = useCallback(
    (id: string) => execute(() => documentService.getById(id)),
    [execute],
  );

  return {
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    loading,
    error,
  };
}
