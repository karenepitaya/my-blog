export type ProcessingState =
  | 'IDLE'
  | 'PROCESSING_IMAGES'
  | 'WAITING_FOR_ASSETS'
  | 'SAVING_DRAFT'
  | 'SAVING_PUBLISH'
  | 'ANALYZING'
  | 'COMPLETE'
  | 'ERROR';

export type ProcessingError = {
  path: string;
  reason: string;
  isLocalMissing?: boolean;
};
