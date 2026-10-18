import React, { useState } from 'react';
import { User, ClubDocument, DocumentTemplate, NavTab, DocumentStatus } from './types';
import {
  getActiveSessionUser,
  setActiveSessionUser,
  getStoredDocuments,
  saveStoredDocuments,
  addDocument,
  TEMPLATES_LIST,
} from './utils/storage';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { DualActionCards } from './components/DualActionCards';
import { RecentDocumentsCard } from './components/RecentDocumentsCard';
import { BrowseTemplatesCard } from './components/BrowseTemplatesCard';
import { DocumentsView } from './components/DocumentsView';
import { TemplatesView, TemplateItem } from './components/TemplatesView';
import { ClubSettingsView } from './components/ClubSettingsView';
import { DocumentEditorView } from './components/DocumentEditorView';
import { ExtractionModal } from './components/ExtractionModal';
import { FormWizardModal } from './components/FormWizardModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { TemplateQuickStartModal } from './components/TemplateQuickStartModal';
import { NotificationsModal } from './components/NotificationsModal';
import { HelpSupportModal } from './components/HelpSupportModal';
import { OtherTabViews } from './components/OtherTabViews';

export const App: React.FC = () => {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getActiveSessionUser());

  // Workspace navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('Home');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary natural language prompt state
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState(
    'Two-day Web Development Workshop on 14–15 October in Seminar Hall for around 120 students.'
  );

  // Documents and templates data
  const [documents, setDocuments] = useState<ClubDocument[]>(() => getStoredDocuments());
  const [templates] = useState<DocumentTemplate[]>(TEMPLATES_LIST);

  // Editor screen state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorDocTitle, setEditorDocTitle] = useState('Web Development Workshop - Event Proposal');

  // Modals visibility states
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);
  const [isFormWizardOpen, setIsFormWizardOpen] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ClubDocument | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Persist session changes
  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setActiveSessionUser(user);
  };

  const handleSignOut = () => {
    setActiveSessionUser(null);
    setCurrentUser(null);
  };

  // Open editor with specific document or template title
  const handleOpenEditor = (title: string) => {
    setEditorDocTitle(title);
    setIsEditorOpen(true);
  };

  // Document management handlers
  const handleCreateDocument = (newDoc: ClubDocument) => {
    const updated = addDocument(newDoc);
    setDocuments(updated);
    handleOpenEditor(newDoc.title);
  };

  const handleStatusChange = (docId: string, newStatus: DocumentStatus) => {
    const updated = documents.map((doc) =>
      doc.id === docId ? { ...doc, status: newStatus, lastEditedText: 'Just now' } : doc
    );
    setDocuments(updated);
    saveStoredDocuments(updated);

    if (selectedPreviewDoc && selectedPreviewDoc.id === docId) {
      setSelectedPreviewDoc({ ...selectedPreviewDoc, status: newStatus });
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = documents.filter((doc) => doc.id !== docId);
    setDocuments(updated);
    saveStoredDocuments(updated);
  };

  // Filter documents and templates according to global search for Home view
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.templateType.toLowerCase().includes(q) ||
      (doc.venue && doc.venue.toLowerCase().includes(q))
    );
  });

  const filteredTemplates = templates.filter((tpl) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tpl.title.toLowerCase().includes(q) ||
      tpl.category.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q)
    );
  });

  // Handle template selection from TemplatesView
  const handleUseTemplateItem = (template: TemplateItem) => {
    handleOpenEditor(`${template.title} - ACM NIT Surat`);
  };

  // Dynamic search placeholder based on active tab
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'Templates':
        return 'Search templates by name, type or keyword...';
      case 'Documents':
        return 'Search documents, folders or templates...';
      case 'Club Settings':
        return 'Search settings, variables, roles or integrations...';
      default:
        return 'Search documents, templates, or events...';
    }
  };

  // Stage 1: If no authenticated session exists, render the Authentication Gate
  if (!currentUser) {
    return <AuthModal onAuthenticated={handleAuthenticated} />;
  }

  // If Full Editor is open, render DocumentEditorView
  if (isEditorOpen) {
    return (
      <DocumentEditorView
        initialTitle={editorDocTitle}
        currentUser={currentUser}
        onBack={() => setIsEditorOpen(false)}
      />
    );
  }

  // Stage 2: Full Workspace Dashboard
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F7FB] font-sans antialiased text-slate-800">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          currentUser={currentUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSignOut={handleSignOut}
          onNotificationClick={() => setIsNotificationsOpen(true)}
          placeholder={getSearchPlaceholder()}
        />

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto px-7 py-5">
          {activeTab === 'Home' ? (
            <div className="space-y-6">
              {/* Hero Heading */}
              <HeroSection />

              {/* Dual Action Cards Row ("Describe your event" + "Fill a form") */}
              <DualActionCards
                promptText={naturalLanguagePrompt}
                onPromptChange={setNaturalLanguagePrompt}
                onExtractContinue={() => setIsExtractionOpen(true)}
                onStartFormWizard={() => setIsFormWizardOpen(true)}
              />

              {/* Section 1: "Recent Documents" Card */}
              <RecentDocumentsCard
                documents={filteredDocuments}
                onSelectDocument={(doc) => handleOpenEditor(doc.title)}
                onViewAllClick={() => setActiveTab('Documents')}
                onStatusChange={handleStatusChange}
                onDeleteDocument={handleDeleteDocument}
              />

              {/* Section 2: "Browse Templates" Card */}
              <BrowseTemplatesCard
                templates={filteredTemplates}
                onSelectTemplate={(tpl) => handleOpenEditor(`${tpl.title} - Proposal`)}
                onViewAllClick={() => setActiveTab('Templates')}
              />
            </div>
          ) : activeTab === 'Documents' ? (
            <DocumentsView
              searchQuery={searchQuery}
              onGenerateDocument={() => setIsFormWizardOpen(true)}
              onPreviewDocument={(doc) => handleOpenEditor(doc.title)}
            />
          ) : activeTab === 'Templates' ? (
            <TemplatesView
              searchQuery={searchQuery}
              onUseTemplate={handleUseTemplateItem}
              onAddTemplate={() => {}}
            />
          ) : activeTab === 'Club Settings' ? (
            <ClubSettingsView searchQuery={searchQuery} />
          ) : (
            <OtherTabViews
              activeTab={activeTab}
              documents={documents}
              templates={templates}
              currentUser={currentUser}
              onSelectDocument={(doc) => handleOpenEditor(doc.title)}
              onSelectTemplate={(tpl) => handleOpenEditor(`${tpl.title} - Draft`)}
              onOpenNewDoc={() => setIsFormWizardOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Interactive Workflow Modals */}

      {/* 1. Natural Language Extraction Modal */}
      <ExtractionModal
        promptText={naturalLanguagePrompt}
        isOpen={isExtractionOpen}
        onClose={() => setIsExtractionOpen(false)}
        onGenerateDocument={handleCreateDocument}
      />

      {/* 2. Guided Form Wizard Modal */}
      <FormWizardModal
        isOpen={isFormWizardOpen}
        onClose={() => setIsFormWizardOpen(false)}
        onComplete={handleCreateDocument}
      />

      {/* 3. Document Preview & Export Modal */}
      <DocumentPreviewModal
        document={selectedPreviewDoc}
        isOpen={!!selectedPreviewDoc}
        onClose={() => setSelectedPreviewDoc(null)}
        onUpdateStatus={handleStatusChange}
      />

      {/* 4. Template Quick-Start Modal */}
      <TemplateQuickStartModal
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onUseTemplate={(tpl) => {
          setSelectedTemplate(null);
          handleOpenEditor(`${tpl.title} - Proposal`);
        }}
      />

      {/* 5. Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* 6. Help & Documentation Modal */}
      <HelpSupportModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
