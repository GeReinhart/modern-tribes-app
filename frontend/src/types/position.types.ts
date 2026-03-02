export type PositionEnum = 'chief' | 'member' | 'guest' ;

export interface PositionBase {
    tribe_id: string | null;
    person_id: string | null;
    position: PositionEnum;
}

export interface PositionCreate extends PositionBase {}

export interface PositionUpdate {
    tribe_id?: string;
    person_id?: string;
    position?: PositionEnum;
}

export interface Position extends PositionBase {
    id: string;
    created_at: string;
    updated_at: string;
}