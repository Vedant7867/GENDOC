import React, { useState, useRef } from 'react';
import {
  MessageSquareText,
  ClipboardList,
  Paperclip,
  Mic,
  MicOff,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface DualActionCardsProps {
  promptText: string;
  onPromptChange: (text: string) => void;
  onExtractContinue: () => void;
  onStartFormWizard: () => void;
}

export const DualActionCards: React.FC<DualActionCardsProps> = ({
  promptText,
  onPromptChange,
  onExtractContinue,
  onStartFormWizard,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Simulate or fallback
      setIsRecording(!isRecording);
      if (!isRecording) {
        setTimeout(() => {
          onPromptChange(
            promptText + ' Hands-on Git & Docker workshop with external industry guest.'
          );
          setIsRecording(false);
        }, 2200);
      }
      return;
    }

    try {
      // Standard SpeechRecognition API
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onPromptChange(promptText ? `${promptText} ${transcript}` : transcript);
      };

      if (!isRecording) {
        recognition.start();
      } else {
        recognition.stop();
        setIsRecording(false);
      }
    } catch {
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Left Card: "Describe your event" */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-blue-200/90 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-blue-300">
        <div>
          {/* Card Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MessageSquareText size={20} />
            </div>
            <div>
              <div className="flex items-center">
                <h2 className="text-base font-bold text-slate-900">Describe your event</h2>
                <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/60">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simply describe your event or requirement in natural language.
              </p>
            </div>
          </div>

          {/* Natural Language Textarea */}
          <div className="mt-4">
            <textarea
              value={promptText}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="e.g. Two-day Web Development Workshop on 14–15 October in Seminar Hall for around 120 students."
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-800 leading-relaxed min-h-[92px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all placeholder:text-slate-400"
            />
          </div>

          {attachedFileName && (
            <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs border border-blue-100">
              <div className="flex items-center gap-2 truncate">
                <FileCheck size={14} />
                <span className="font-medium truncate">{attachedFileName}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFileName(null)}
                className="text-[11px] hover:underline ml-2 shrink-0 text-slate-500"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-1">
          <div className="flex items-center gap-2.5">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.txt,.doc"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Paperclip size={14} />
              <span>Attach file (optional)</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoice}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isRecording
                  ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isRecording ? 'Listening...' : 'Use voice input'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExtractContinue}
            className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all group"
          >
            <span>Extract & Continue</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </div>

      {/* 2. Right Card: "Fill a form" */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-300">
        <div>
          {/* Card Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Fill a form</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Use a guided form for more accurate document generation.
              </p>
            </div>
          </div>

          {/* 4-Step Horizontal Progress Stepper */}
          <div className="my-5 px-1 relative">
            {/* Background connecting line */}
            <div className="absolute top-3.5 left-8 right-8 h-[1px] bg-slate-200 -z-0" />

            <div className="grid grid-cols-4 gap-1 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  1
                </div>
                <span className="text-[11px] font-semibold text-slate-800 text-center mt-1.5 leading-tight">
                  Event Details
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold flex items-center justify-center">
                  2
                </div>
                <span className="text-[11px] text-slate-400 text-center mt-1.5 leading-tight">
                  Participants & Resources
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold flex items-center justify-center">
                  3
                </div>
                <span className="text-[11px] text-slate-400 text-center mt-1.5 leading-tight">
                  Additional Information
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold flex items-center justify-center">
                  4
                </div>
                <span className="text-[11px] text-slate-400 text-center mt-1.5 leading-tight">
                  Review & Generate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex justify-end mt-2 pt-1">
          <button
            type="button"
            onClick={onStartFormWizard}
            className="bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-200/60 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all group"
          >
            <span>Start Filling Form</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
