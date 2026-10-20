import React from 'react';
import type { ApiDocumentDetail } from '../api/types';
import type { User } from '../types';
import { DocumentGeneratorModal } from './generator/DocumentGeneratorModal';

interface FormWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  /** When set (for example from the Templates page) the template step is skipped. */
  initialTemplateId?: string | null;
  onCreated: (docs: ApiDocumentDetail[]) => void;
  onOpenDocument: (doc: ApiDocumentDetail) => void;
}

/** "Fill a form": pick a stored template, answer its real fields, generate and save. No AI is needed
 *  except the optional "Draft with AI" helper on text fields. */
export const FormWizardModal: React.FC<FormWizardModalProps> = (props) => (
  <DocumentGeneratorModal
    mode={props.initialTemplateId ? 'template' : 'form'}
    isOpen={props.isOpen}
    onClose={props.onClose}
    initialTemplateId={props.initialTemplateId}
    currentUser={props.currentUser}
    onCreated={props.onCreated}
    onOpenDocument={props.onOpenDocument}
  />
);
