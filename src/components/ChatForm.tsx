import React, { RefObject } from 'react';
import { ExtendedChatCompletionMessageParam, Model } from '../../shared/types';
import { FileUpload } from './FileUpload';

interface ChatFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleClear: () => void;
  clearFile: () => void;
  handleFileUpload: (
    base64File: string,
    fileName: string,
    fileType: string
  ) => void;
  isLoading: boolean;
  messages: ExtendedChatCompletionMessageParam[];
  currentFileName: string | null;
  currentFileType: string | null;
  currentFile: string | null;
  model: Model;
  setModel: (model: Model) => void;
  models: Model[];
  inputRef: RefObject<HTMLInputElement>;
}

export function ChatForm({
  prompt,
  setPrompt,
  handleSubmit,
  handleKeyDown,
  handleClear,
  clearFile,
  handleFileUpload,
  isLoading,
  messages,
  currentFileName,
  currentFileType,
  currentFile,
  model,
  setModel,
  models,
  inputRef,
}: ChatFormProps) {
  return (
    <form className="input-form" onSubmit={handleSubmit}>
      {messages.length > 0 && (
        <div className="clear-conversation" onClick={handleClear}>
          <span>Clear conversation</span>
        </div>
      )}
      <div className="input-container">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt..."
          ref={inputRef}
        />
        <label htmlFor="file-upload" className="upload-button">
          📎
        </label>
        <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
        {currentFileName && (
          <div className="image-preview">
            {currentFileType?.startsWith('image') ? (
              <img src={currentFile || ''} alt="Upload preview" />
            ) : (
              <div className="file-preview">📄 {currentFileName}</div>
            )}
            <button className="button" onClick={clearFile}>
              ×
            </button>
          </div>
        )}
      </div>
      <select
        value={model.name}
        onChange={(e) => {
          setModel(models.find((m) => m.name === e.target.value)!);
          handleClear();
        }}
        disabled={isLoading}
      >
        {models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.label}
          </option>
        ))}
      </select>

      <button className="button" type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Send'}
      </button>
    </form>
  );
}
