import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, User, Briefcase, FolderOpen } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import clsx from 'clsx';
import api from '../lib/api';

export default function ChatBox({ roomId, otherUser, roomInfo, isAdmin }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await api.getChatMessages(roomId);
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (_) {}
  }, [roomId, scrollToBottom]);

  useEffect(() => {
    if (!roomId) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [roomId, fetchMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await api.sendMessage(roomId, { content, type: 'text' });
      await fetchMessages();
    } catch (_) {} finally {
      setSending(false);
    }
  };

  const formatMessageDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd MMM yyyy');
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatMessageDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const isOwnMessage = (msg) => {
    return msg.sender?._id === user?._id || String(msg.sender?._id) === String(user?.id);
  };

  // Build header content
  const headerContent = () => {
    if (isAdmin && roomInfo) {
      const { client, employee, appId } = roomInfo;
      return (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {appId && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 rounded-full">
                <FolderOpen size={11} /> {appId}
              </span>
            )}
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {client?.name || 'Unknown Client'}
              {employee ? <span className="font-normal text-slate-500"> &amp; {employee.name}</span> : null}
            </span>
          </div>
          {/* Info pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{client?.name?.charAt(0) || 'C'}</div>
              <span><span className="text-slate-400">Client:</span> {client?.name || '—'}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">{employee?.name?.charAt(0) || '?'}</div>
              <span><span className="text-slate-400">CA:</span> {employee?.name || <span className="italic text-slate-400">Unassigned</span>}</span>
            </div>
          </div>
        </div>
      );
    }
    if (otherUser) {
      return (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80">
          <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
            {otherUser.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{otherUser.name}</h3>
            <p className="text-xs text-slate-500 capitalize">{otherUser.role || 'Support'}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {headerContent()}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ minHeight: '300px', maxHeight: '500px' }}>
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-3">
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-3 py-1 rounded-full">{date}</span>
            </div>
            {msgs.map((msg, idx) => (
              <div key={msg._id || idx} className={clsx('flex mb-2', isOwnMessage(msg) ? 'justify-end' : 'justify-start')}>
                {msg.type === 'system' ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center w-full italic py-1">{msg.content}</div>
                ) : (
                  <div className={clsx(
                    'max-w-[75%] px-4 py-2 rounded-2xl text-sm',
                    isOwnMessage(msg)
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
                  )}>
                    {(isAdmin || !isOwnMessage(msg)) && (
                      <p className={clsx('text-xs font-semibold mb-1',
                        isOwnMessage(msg) ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'
                      )}>
                        {msg.sender?.name || 'User'}
                        {isAdmin && msg.sender?.role && (
                          <span className="ml-1 font-normal opacity-70 capitalize">({msg.sender.role})</span>
                        )}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={clsx('text-[10px] mt-1 text-right', isOwnMessage(msg) ? 'text-primary-100' : 'text-slate-400')}>
                      {msg.createdAt ? format(new Date(msg.createdAt), 'hh:mm a') : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}


