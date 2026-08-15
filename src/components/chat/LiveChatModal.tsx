'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiCheck,
  FiCamera,
  FiPaperclip,
  FiMic,
  FiSquare,
  FiRefreshCw,
  FiImage,
  FiFile,
  FiDownload,
  FiHeadphones,
  FiMaximize2,
  FiTrash2,
  FiSmile,
  FiMapPin,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api-client';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  senderName?: string;
  text: string;
  type?: 'text' | 'image' | 'audio' | 'file' | 'refund_widget' | 'options_widget';
  mediaUrl?: string;
  mediaName?: string;
  widgetData?: any;
  status?: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

const renderMessageTicks = (status?: 'sent' | 'delivered' | 'read') => {
  if (status === 'read') {
    return (
      <span className="font-black text-sky-400 drop-shadow-xs text-[12px] ml-1 tracking-tighter" title="Read by agent">
        ✓✓
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="font-semibold text-white/80 text-[12px] ml-1 tracking-tighter" title="Delivered to Telegram">
        ✓✓
      </span>
    );
  }
  return (
    <span className="font-medium text-white/70 text-[12px] ml-1" title="Sent">
      ✓
    </span>
  );
};

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string;
    email?: string;
    username?: string;
    memberId?: string;
    avatar?: string;
  };
}

export function LiveChatModal({ isOpen, onClose, user }: LiveChatModalProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ticketId, setTicketId] = useState('TK-CONNECTING');
  const [currentAgentName, setCurrentAgentName] = useState('Expense Desk');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [systemEvent, setSystemEvent] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedRrn, setCopiedRrn] = useState(false);

  // Media Attachment States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [attachmentTab, setAttachmentTab] = useState<'gallery' | 'wallet' | 'file' | 'location' | 'article'>('gallery');

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File Inputs Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const isUserScrolledUpRef = useRef(false);

  const scrollToBottom = (force = false) => {
    if (force || !isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isScrolledUp = distanceFromBottom > 120;
    isUserScrolledUpRef.current = isScrolledUp;
    setShowScrollDownBtn(isScrolledUp);
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
      setTimeout(() => inputRef.current?.focus(), 200);

      // Auto-poll every 1.5 seconds for instant Telegram reply updates
      const pollInterval = setInterval(() => {
        fetchChatHistory(true);
      }, 1500);

      return () => clearInterval(pollInterval);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isTyping, systemEvent, isRecording]);

  const fetchChatHistory = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await apiClient.get<{
        ticketId: string;
        assignedAgent: string;
        messages: ChatMessageItem[];
      }>('/chat/telegram');

      if (res.ticketId) setTicketId(res.ticketId);
      if (res.assignedAgent) setCurrentAgentName(res.assignedAgent);

      const newMsgs = res.messages || [];

      // Check if Telegram agent is currently typing/reviewing (last message is from user)
      if (newMsgs.length > 0) {
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg.sender === 'user') {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }

      // Only update state if messages actually changed to prevent scrolling resets
      setMessages((prev) => {
        if (
          prev.length === newMsgs.length &&
          prev[prev.length - 1]?.id === newMsgs[newMsgs.length - 1]?.id &&
          prev[prev.length - 1]?.status === newMsgs[newMsgs.length - 1]?.status
        ) {
          return prev;
        }
        return newMsgs;
      });
    } catch (err) {
      if (!isSilent) {
        console.error('Failed to load chat:', err);
        toast.error('Could not load support chat history');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleCopyTicket = async () => {
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopiedTicket(true);
      toast.success('Ticket ID copied!');
      setTimeout(() => setCopiedTicket(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyRrn = async (rrn: string) => {
    try {
      await navigator.clipboard.writeText(rrn);
      setCopiedRrn(true);
      toast.success('RRN copied!');
      setTimeout(() => setCopiedRrn(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all past chat history and old attachments?')) return;

    try {
      await apiClient.delete('/chat/telegram');
      setMessages([]);
      toast.success('Chat history cleared!');
      fetchChatHistory();
    } catch (err) {
      console.error('Failed to clear chat:', err);
      toast.error('Could not clear chat history');
    }
  };

  // Image Selection Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSendMediaMessage('image', dataUrl, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // General File Selection Handler
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size must be under 15MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSendMediaMessage('file', dataUrl, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Audio File Selection Handler
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSendMediaMessage('audio', dataUrl, file.name || 'Voice_Note.mp3');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Direct In-App Live Voice Recording Logic
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Microphone recording requires HTTPS or localhost');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (audioBlob.size < 100) {
          toast.error('Voice note too short');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            handleSendMediaMessage(
              'audio',
              dataUrl,
              `Voice_Note_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`
            );
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Direct microphone access error:', err);
      toast.error('Please grant microphone permission to record voice notes');
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const stream = mediaRecorderRef.current?.stream;
        stream?.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    toast.error('Voice recording cancelled');
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Send Media Message (Image, Audio, File)
  const handleSendMediaMessage = async (
    mediaType: 'image' | 'audio' | 'file',
    mediaUrl: string,
    mediaName: string
  ) => {
    setIsSending(true);

    const tempMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: mediaType === 'image' ? 'Sent an image attachment' : mediaType === 'audio' ? 'Sent a voice note' : `Sent file: ${mediaName}`,
      type: mediaType,
      mediaUrl,
      mediaName,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setIsTyping(true);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await apiClient.post<{ userMessage: ChatMessageItem; botMessage: ChatMessageItem }>(
        '/chat/telegram',
        {
          message: tempMsg.text,
          type: mediaType,
          mediaUrl,
          mediaName,
          ticketId,
        }
      );

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMsg.id),
        res.userMessage,
        {
          ...res.botMessage,
          senderName: currentAgentName,
        },
      ]);
    } catch (err) {
      console.error('Media send error:', err);
      toast.error('Failed to send attachment');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleOptionClick = async (optionText: string) => {
    if (optionText === 'I am good 👍') {
      const userMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: 'I am good 👍',
        createdAt: new Date().toISOString(),
      };
      const botReply: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        senderName: currentAgentName,
        text: 'Awesome! Glad we could resolve your query. Have a great day ahead! 😊',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, botReply]);
    } else if (optionText === 'Need more help') {
      handleHumanAgentHandoff();
    }
  };

  const handleHumanAgentHandoff = async () => {
    setIsSending(true);
    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: 'Need more help',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    apiClient.post('/chat/telegram', { message: 'USER REQUESTED HUMAN AGENT SUPPORT: Need more help', ticketId }).catch(() => {});

    setTimeout(() => {
      const botNotice: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        senderName: 'Expense Desk',
        text: 'I understand you need more assistance. Let me connect you with a senior support executive who can better help you.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botNotice]);
      setIsTyping(false);

      setTimeout(() => {
        setSystemEvent('Sarah Jenkins has joined the chat');
        setCurrentAgentName('Sarah Jenkins');

        setTimeout(() => {
          const agentMsg1: ChatMessageItem = {
            id: `msg-${Date.now() + 2}`,
            sender: 'agent',
            senderName: 'Sarah Jenkins',
            text: 'Hi, I am Sarah Jenkins from Expense Support Desk. I will be assisting you today.',
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, agentMsg1]);

          setTimeout(() => {
            const agentMsg2: ChatMessageItem = {
              id: `msg-${Date.now() + 3}`,
              sender: 'agent',
              senderName: 'Sarah Jenkins',
              text: "Thank you for highlighting this. We understand your concern and will ensure it's resolved as quickly as possible.",
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, agentMsg2]);
            setIsSending(false);
          }, 1000);
        }, 800);
      }, 1200);
    }, 800);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isSending) return;

    setInputMessage('');
    setIsSending(true);

    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await apiClient.post<{ userMessage: ChatMessageItem; botMessage: ChatMessageItem }>(
        '/chat/telegram',
        { message: text, ticketId }
      );

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.userMessage,
        {
          ...res.botMessage,
          senderName: currentAgentName,
        },
      ]);
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Hidden Inputs for File Uploads */}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
        <input ref={fileInputRef} type="file" accept="*" className="hidden" onChange={handleDocFileChange} />
        <input ref={audioInputRef} type="file" accept="audio/*" capture="user" className="hidden" onChange={handleAudioFileChange} />

        {/* Mobile / Desktop Chat Container with App Theme */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 flex h-full w-full sm:h-[92vh] sm:max-h-[720px] sm:max-w-md flex-col overflow-hidden bg-[#0d0d14] sm:rounded-3xl shadow-2xl border border-white/10"
        >
          {/* ── Top Header Bar ── */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#15151e]/95 px-4 py-3 backdrop-blur-md text-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 transition-colors"
              >
                <FiChevronLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white">
                    {currentAgentName}
                  </h3>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/20" />
                </div>
                <div className="flex items-center gap-1 text-xs text-white/60 font-mono">
                  <span>{ticketId}</span>
                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="p-0.5 hover:text-white transition-colors"
                  >
                    {copiedTicket ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Clear Chat History"
              >
                <FiTrash2 size={17} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* ── Chat Messages Body ── */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative bg-[#0d0d14]"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '18px 18px',
            }}
          >
            {/* Centered Telegram Date Header */}
            <div className="text-center my-2">
              <span className="text-[11px] font-medium text-white/80 bg-[#1c1c28]/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 shadow-xs">
                August 15
              </span>
            </div>

            {isLoading && messages.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted">
                <FiRefreshCw size={22} className="animate-spin text-primary" />
                <span className="text-xs">Loading support chat...</span>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const senderTitle = msg.senderName || (msg.sender === 'agent' ? 'Sarah Jenkins' : 'Expense Desk');

                  /* Image Attachment Render */
                  if (msg.type === 'image') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] overflow-hidden rounded-[20px] p-2 border border-border/40 ${
                            isUser ? 'bg-primary/10 border-primary/30' : 'bg-surface'
                          }`}
                        >
                          <p className="text-[11px] font-bold text-primary mb-1.5 px-1">
                            {isUser ? 'You' : senderTitle}
                          </p>
                          <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-black/10">
                            <img
                              src={msg.mediaUrl}
                              alt={msg.mediaName || 'Attachment'}
                              className="max-h-56 w-full object-cover transition-transform group-hover:scale-105"
                              onClick={() => setPreviewZoomImage(msg.mediaUrl || null)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FiMaximize2 className="text-white drop-shadow-md" size={24} />
                            </div>
                          </div>
                          {msg.text && msg.text !== 'Sent an image attachment' && (
                            <p className="mt-1.5 px-1 text-xs text-foreground">{msg.text}</p>
                          )}
                          <div className="mt-1 px-1 flex items-center justify-end gap-1 text-[10px]">
                            <span className="text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isUser && renderMessageTicks(msg.status)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  /* Audio Message Render */
                  if (msg.type === 'audio') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-[22px] p-3 border border-border/40 ${
                            isUser ? 'bg-primary/15 border-primary/30' : 'bg-surface'
                          }`}
                        >
                          <p className="text-[11px] font-bold text-primary mb-1.5">
                            🎙️ {isUser ? 'Voice Note' : `${senderTitle} (Voice Note)`}
                          </p>
                          {msg.mediaUrl && (
                            <audio controls src={msg.mediaUrl} className="w-full max-w-[240px] h-8 rounded-lg" />
                          )}
                          <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px]">
                            <span className="text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isUser && renderMessageTicks(msg.status)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  /* Document File Attachment Render */
                  if (msg.type === 'file') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-[20px] p-3 border border-border/40 ${
                            isUser ? 'bg-primary/10 border-primary/30' : 'bg-surface'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                              <FiFile size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {msg.mediaName || 'Document.pdf'}
                              </p>
                              <p className="text-[10px] text-muted">Attachment</p>
                            </div>
                            {msg.mediaUrl && (
                              <a
                                href={msg.mediaUrl}
                                download={msg.mediaName || 'file'}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-foreground hover:bg-primary/20 transition-colors"
                              >
                                <FiDownload size={14} />
                              </a>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px]">
                            <span className="text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isUser && renderMessageTicks(msg.status)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  /* Refund Widget Render */
                  if (msg.type === 'refund_widget') {
                    const data = msg.widgetData || {};
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[20px] border border-primary/30 bg-gradient-to-b from-primary/10 via-surface to-surface p-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted">
                            {data.title || 'Refund Status Overview'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toast.success('Refund details opened')}
                            className="flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
                          >
                            <span>Details</span>
                            <FiChevronRight size={14} />
                          </button>
                        </div>

                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-foreground">
                            {data.amount || '₹191'}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                            {data.status || 'Completed'}
                          </span>
                        </div>

                        <div className="mt-3 border-t border-border/40 pt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] font-medium text-muted">Source:</p>
                            <p className="font-semibold text-foreground">{data.source || 'UPI'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-muted">Credited At:</p>
                            <p className="font-semibold text-foreground">{data.creditedAt || '26 Jul 2026'}</p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-1.5 text-muted">
                            <span className="text-[10px]">RRN:</span>
                            <span className="font-mono font-semibold text-foreground">{data.rrn || '126864364701'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyRrn(data.rrn || '126864364701')}
                              className="p-0.5 hover:text-foreground transition-colors"
                            >
                              {copiedRrn ? <FiCheck size={12} className="text-emerald-500" /> : <FiCopy size={12} />}
                            </button>
                          </div>
                          <span className="text-[10px] text-muted">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  }

                  /* Interactive Options Widget Render */
                  if (msg.type === 'options_widget') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[22px] border border-border/50 bg-surface p-4 shadow-xs space-y-3"
                      >
                        <p className="text-[11px] font-bold text-primary">Expense Desk</p>
                        <p className="text-sm font-semibold text-foreground">
                          {msg.text || 'Anything else I can help you with?'}
                        </p>

                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOptionClick('I am good 👍')}
                            className="w-full rounded-2xl bg-surface-2 hover:bg-surface border border-border/40 py-3 text-sm font-semibold text-foreground transition-colors text-center shadow-2xs"
                          >
                            I am good 👍
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOptionClick('Need more help')}
                            className="w-full rounded-2xl bg-surface-2 hover:bg-surface border border-border/40 py-3 text-sm font-semibold text-foreground transition-colors text-center shadow-2xs"
                          >
                            Need more help
                          </button>
                        </div>

                        <p className="text-[10px] text-muted text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </motion.div>
                    );
                  }

                  /* Regular Text Message Render */
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {isUser ? (
                        <div className="max-w-[82%] rounded-[20px] rounded-tr-[4px] bg-gradient-to-r from-[#9d4edd] to-[#805ad5] text-white px-4 py-2.5 text-sm shadow-md">
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-90">
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {renderMessageTicks(msg.status)}
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-[85%] rounded-[20px] rounded-tl-[4px] border border-white/10 bg-[#1e1e28] text-white p-3.5 shadow-md">
                          <p className="text-[11px] font-bold text-[#b87cf8] mb-1">
                            {senderTitle}
                          </p>
                          <p className="text-sm text-white/95 leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                          <p className="mt-1.5 text-[10px] text-white/60 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* System Event Line */}
                {systemEvent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 my-4"
                  >
                    <div className="h-[1px] flex-1 bg-white/10" />
                    <span className="text-[12px] font-bold text-white/80">
                      {systemEvent}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/10" />
                  </motion.div>
                )}

                {/* Voice Recording Active Bar */}
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-semibold text-red-400">
                        Recording audio... 00:0{recordingTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopAndSendRecording}
                      className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600 transition-colors"
                    >
                      <FiSquare size={12} />
                      Stop & Send
                    </button>
                  </motion.div>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[20px] rounded-tl-[4px] border border-white/10 bg-[#1e1e28] px-4 py-3 shadow-md max-w-[160px]"
                  >
                    <p className="text-[11px] font-bold text-[#b87cf8] mb-1">
                      {currentAgentName}
                    </p>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b87cf8]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b87cf8] [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b87cf8] [animation-delay:0.4s]" />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollDownBtn && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-20 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#9d4edd] text-white shadow-lg hover:scale-110 active:scale-95 transition-transform"
              title="Scroll to latest messages"
            >
              <FiChevronRight className="rotate-90" size={18} />
            </button>
          )}

          {/* Telegram Bottom Attachment Sheet Drawer (Matches Screenshot 2) */}
          <AnimatePresence>
            {showAttachmentSheet && (
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute bottom-16 left-0 right-0 z-30 bg-[#181824] border-t border-white/10 rounded-t-3xl p-4 shadow-2xl space-y-4"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-1" />

                {/* Attachment Grid */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowAttachmentSheet(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#222232] hover:bg-[#9d4edd]/20 text-white transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <FiImage size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Gallery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachmentSheet(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#222232] hover:bg-[#9d4edd]/20 text-white transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FiFile size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isRecording) stopAndSendRecording();
                      else startRecording();
                      setShowAttachmentSheet(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#222232] hover:bg-[#9d4edd]/20 text-white transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                      <FiMic size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowAttachmentSheet(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#222232] hover:bg-[#9d4edd]/20 text-white transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FiCamera size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Camera</span>
                  </button>
                </div>

                {/* Horizontal Telegram Bottom Action Tabs (Matches Screenshot 2) */}
                <div className="flex items-center justify-around border-t border-white/10 pt-3 text-white/70 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setAttachmentTab('gallery')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors ${
                      attachmentTab === 'gallery' ? 'bg-[#9d4edd] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    <FiImage size={14} />
                    <span>Gallery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachmentTab('wallet')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors ${
                      attachmentTab === 'wallet' ? 'bg-[#9d4edd] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    <FiFileText size={14} />
                    <span>Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachmentTab('file')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors ${
                      attachmentTab === 'file' ? 'bg-[#9d4edd] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    <FiFile size={14} />
                    <span>File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachmentTab('location')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors ${
                      attachmentTab === 'location' ? 'bg-[#9d4edd] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    <FiMapPin size={14} />
                    <span>Location</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Telegram / WhatsApp Bottom Input Footer ── */}
          <div className="border-t border-white/10 bg-[#12121a] p-2.5 sm:p-3 relative">
            <div className="flex items-center gap-2">
              {isRecording ? (
                /* WhatsApp Live Voice Recording Active Capsule */
                <div className="flex-1 flex items-center justify-between rounded-full border border-red-500/40 bg-[#1e1e28] px-4 py-2 text-white">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="text-xs font-bold text-red-400 font-mono">
                      {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                    {/* Animated Audio Equalizer Bars */}
                    <div className="flex items-center gap-0.5 ml-2">
                      <span className="h-3 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0s]" />
                      <span className="h-5 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="h-2 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="h-4 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0.45s]" />
                      <span className="h-3 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0.6s]" />
                    </div>
                  </div>

                  {/* Cancel Trash Icon */}
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Cancel recording"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ) : (
                /* Standard Telegram Input Pill Capsule */
                <div className="flex-1 flex items-center rounded-full border border-white/10 bg-[#1e1e28] px-3.5 py-1.5 focus-within:border-[#9d4edd] transition-colors">
                  <button
                    type="button"
                    className="text-white/60 hover:text-white transition-colors pr-2"
                    title="Emoji"
                  >
                    <FiSmile size={20} />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message"
                    disabled={isSending}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowAttachmentSheet(!showAttachmentSheet)}
                    disabled={isSending}
                    className="text-white/60 hover:text-white transition-colors pl-2"
                    title="Attach media"
                  >
                    <FiPaperclip size={20} className={showAttachmentSheet ? 'text-[#9d4edd] rotate-45 transition-transform' : ''} />
                  </button>
                </div>
              )}

              {/* Circular Send / Mic Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  disabled={isSending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#9d4edd] to-[#805ad5] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  title="Send voice note"
                >
                  <FiSend size={18} />
                </button>
              ) : inputMessage.trim() ? (
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isSending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#9d4edd] to-[#805ad5] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  title="Send message"
                >
                  {isSending ? <FiRefreshCw size={18} className="animate-spin" /> : <FiSend size={18} />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isSending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#9d4edd] to-[#805ad5] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  title="Record voice note"
                >
                  <FiMic size={19} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Image Preview Zoom Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img src={previewZoomImage} alt="Zoom" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
