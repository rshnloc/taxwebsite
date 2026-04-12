import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChatBox from '../../components/ChatBox';
import { PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import { MessageCircle } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function ClientChatPage() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchChatRooms(); }, []);

  const fetchChatRooms = async () => {
    try {
      const data = await api.getChatRooms();
      setChatRooms(data.chatRooms || []);
      if (data.chatRooms?.length > 0) setSelectedRoom(data.chatRooms[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (room) => {
    return room.participants?.find(p => p.role !== 'client') || room.participants?.[0];
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>

        {chatRooms.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No conversations yet" description="Chat will be available once an employee is assigned to your application" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '600px' }}>
            {/* Room List */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Conversations</h2>
              </div>
              {chatRooms.map(room => {
                const other = getOtherParticipant(room);
                return (
                  <button
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    className={clsx(
                      'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50',
                      selectedRoom?._id === room._id && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {other?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{other?.name || 'Support'}</p>
                      <p className="text-xs text-slate-500 truncate">{room.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                    {room.lastMessage?.createdAt && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {format(new Date(room.lastMessage.createdAt), 'hh:mm a')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 h-full">
              {selectedRoom ? (
                <ChatBox roomId={selectedRoom._id} otherUser={getOtherParticipant(selectedRoom)} />
              ) : (
                <div className="h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500">Select a conversation</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
