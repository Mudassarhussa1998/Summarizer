import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sessionApi, chatApi, uploadApi, Session, Message, UploadedFile } from '../../api/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Alert from '../Alert/Alert';
import { useAlert } from '../../hooks/useAlert';
import './ChatInterface.css';

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { alert, showError, hideAlert } = useAlert();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = useCallback(async () => {
    try {
      const response = await sessionApi.getSessions();
      if (response.success) {
        setSessions(response.sessions);
        // Auto-select first session if available
        if (response.sessions.length > 0 && !currentSession) {
          setCurrentSession(response.sessions[0]);
        }
      }
    } catch (error) {
      // Error loading sessions - continue with empty state
    }
  }, [currentSession]);

  // Load sessions on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated, loadSessions]);

  // Load messages when current session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getMessages(sessionId);
      if (response.success) {
        setMessages(response.messages);
      }
    } catch (error) {
      // Error loading messages - continue with empty state
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await sessionApi.createSession();
      if (response.success) {
        const newSession = response.session;
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setMessages([]);
      }
    } catch (error) {
      // Error creating session
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await sessionApi.deleteSession(sessionId);
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          const remainingSessions = sessions.filter(s => s.id !== sessionId);
          setCurrentSession(remainingSessions.length > 0 ? remainingSessions[0] : null);
          setMessages([]);
        }
      }
    } catch (error) {
      // Error deleting session
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !uploadedFile) return;
    if (!currentSession) return;

    try {
      setIsLoading(true);
      
      const messageText = newMessage.trim() || (uploadedFile ? `Uploaded: ${uploadedFile.name}` : '');
      const messageType = uploadedFile ? uploadedFile.type : 'text';
      
      const response = await chatApi.sendMessage(
        currentSession.id,
        messageText,
        messageType,
        uploadedFile?.data,
        uploadedFile?.name,
        uploadedFile?.size
      );
      
      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
        setUploadedFile(null);
        
        // Update session in the list
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, message_count: s.message_count + 1, updated_at: new Date().toISOString() }
            : s
        ));
      }
    } catch (error) {
      // Error sending message
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const response = await uploadApi.uploadFile(file);
      if (response.success) {
        setUploadedFile(response.file);
      } else {
        showError(response.error || 'File upload failed');
      }
    } catch (error) {
      // Error uploading file
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderFilePreview = (message: Message) => {
    if (!message.file_data) return null;

    switch (message.type) {
      case 'image':
        return (
          <img 
            src={message.file_data} 
            alt={message.file_name} 
            className="message-image"
            style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px' }}
          />
        );
      case 'video':
        return (
          <video 
            src={message.file_data} 
            controls 
            className="message-video"
            style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px' }}
          />
        );
      case 'audio':
        return (
          <audio 
            src={message.file_data} 
            controls 
            className="message-audio"
          />
        );
      default:
        return (
          <div className="file-attachment">
            <span className="file-icon">📎</span>
            <span className="file-name">{message.file_name}</span>
            <span className="file-size">({Math.round((message.file_size || 0) / 1024)} KB)</span>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-interface-container" data-theme={theme}>
        <div className="auth-required">
          <h3>Please log in to access the chat</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-interface-container ${className || ''}`} data-theme={theme}>
      {/* Sidebar with sessions */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Chat Sessions</h3>
          <button onClick={createNewSession} className="new-session-btn">
            + New Chat
          </button>
        </div>
        <div className="sessions-list">
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
              onClick={() => setCurrentSession(session)}
            >
              <div className="session-info">
                <div className="session-name">{session.name}</div>
                <div className="session-meta">
                  <span className="message-count">{session.message_count} messages</span>
                  <span className="session-date">{new Date(session.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="delete-session-btn"
                title="Delete session"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {currentSession ? (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <h3>{currentSession.name}</h3>
              <span className="session-info-text">
                {currentSession.message_count} messages • Created {new Date(currentSession.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Messages area */}
            <div 
              className={`messages-container ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isLoading && messages.length === 0 ? (
                <div className="loading-messages">Loading messages...</div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className={`message ${message.sender}`}>
                    <div className="message-content">
                      <div className="message-text">{message.message}</div>
                      {renderFilePreview(message)}
                      <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              
              {isDragOver && (
                <div className="drag-overlay">
                  <div className="drag-message">
                    <span className="drag-icon">📁</span>
                    <span>Drop files here to upload</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="input-container">
              {uploadedFile && (
                <div className="file-preview">
                  <div className="file-info">
                    <span className="file-name">{uploadedFile.name}</span>
                    <span className="file-size">({Math.round(uploadedFile.size / 1024)} KB)</span>
                  </div>
                  <button 
                    onClick={() => setUploadedFile(null)}
                    className="remove-file-btn"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div className="message-input-container">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,audio/*,.txt,.md,.doc,.docx,.pdf"
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="attach-btn"
                  title="Attach file"
                >
                  📎
                </button>
                
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="message-input"
                  rows={1}
                />
                
                <button 
                  onClick={sendMessage}
                  disabled={isLoading || (!newMessage.trim() && !uploadedFile)}
                  className="send-btn"
                >
                  {isLoading ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-session">
            <h3>No session selected</h3>
            <p>Create a new chat session to get started</p>
            <button onClick={createNewSession} className="create-session-btn">
              Create New Session
            </button>
          </div>
        )}
      </div>
      <Alert
        message={alert.message}
        type={alert.type}
        isVisible={alert.isVisible}
        onClose={hideAlert}
      />
    </div>
  );
};

export default ChatInterface;