import React from 'react';
import type { ApiDocumentDetail } from '../api/types';
import type { User } from '../types';
import { DocumentGeneratorModal } from './generator/DocumentGeneratorModal';

interface ExtractionModalProps {
  promptText: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCreated: (docs: ApiDocumentDetail[]) => void;
  onOpenDocument: (doc: ApiDocumentDetail) => void;
}

/** "Describe your event": the AI reads the text via POST /api/generator/extract, the user reviews and fills
 *  what is missing, then the documents are generated and saved through the real API. */
export const ExtractionModal: React.FC<ExtractionModalProps> = (props) => (
  <DocumentGeneratorModal
    mode="describe"
    isOpen={props.isOpen}
    onClose={props.onClose}
    initialText={props.promptText}
    currentUser={props.currentUser}
    onCreated={props.onCreated}
    onOpenDocument={props.onOpenDocument}
  />
);
