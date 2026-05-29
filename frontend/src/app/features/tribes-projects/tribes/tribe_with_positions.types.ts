import { AttachmentFile } from '@/app/platform/functions/documents/document.types.ts';
import { PositionEnum } from '@/app/features/tribes-projects/positions/position.types.ts';
import { TribeProject } from '@/app/features/tribes-projects/tribes/tribe.types.ts';

export interface PositionData {
  person_id: string;
  position: PositionEnum;
}

export interface PersonWithPosition {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  document_id?: string | null;
  position: PositionEnum;
  position_id: string;
  created_at: string;
  updated_at: string;
}

export interface TribeWithPositionsCreate {
  name: string;
  document_content_html: string;
  document_attachments: AttachmentFile[];
  positions: PositionData[];
}

export interface TribeWithPositionsUpdate {
  name?: string;
  document_content_html?: string;
  document_attachments?: AttachmentFile[];
  positions?: PositionData[];
}

export interface TribeWithPositionsResponse {
  id: string;
  url_param_id: string;
  name: string;
  document_id: string;
  document_content_html: string;
  document_attachments: AttachmentFile[];
  projects: TribeProject[];
  persons: PersonWithPosition[];
  created_at: string;
  updated_at: string;
}
