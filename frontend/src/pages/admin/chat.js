import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChatBox from '../../components/ChatBox';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { MessageCircle, Search, Flag, RefreshCw, Plus, Users, Briefcase, UserCheck } from 'lucide-react';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function StatusDot({ lastActiveAt, size = 'sm' }) {
  if (!lastActiveAt) return <span className={`inline-block ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full bg-slate-300 flex-shrink-0`} title="Offline" />;
  const diffMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  const color = diffMin < 5 ? 'bg-green-500' : diffMin < 30 ? 'bg-yellow-400' : 'bg-slate-300';
  const label = diffMin < 5 ? 'Online now' : `Last seen ${formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true })}`;
  return <span className={`inline-block ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full ${color} flex-shrink-0`} title={label} />;
}

function getRoomMeta(room) {
  const client   = room.participants?.find(p => p.role === 'client');
  const employee = room.participants?.find(p => p.role === 'employee' || p.role === 'admin');
  const partner  = room.participants?.find(p => p.role === 'partner');
  const appId    = room.application?.applicationId || null;
  const type     = partner ? 'partner' : client ? 'client' : 'internal';
  const primary  = client || partner || employee;
  const secondary = (client && employee && employee.id !== primary?.id) ? employee : null;
  return { client, employee, partner, primary, secondary, appId, type };
}

const TYPE_COLORS = {
  client:   'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
  partner:  'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  internal: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
};
const TYPE_ICONS = {
  client: <UserCheck size={10} />, partner: <Briefcase size={10} />, internal: <Users size={10} />,
};

export default function AdminChatPage() {
  const [chatRooms, setChatRooms]       = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [tab, setTab]                   = useState('all');
  const [typeFilter, setTypeFilter]     = useState('');
  const [onlineMap, setOnlineMap]       = useState({});
  const [showNewChat, setShowNewChat]   = useState(false);
  const [allUsers, setAllUsers]         = useState([]);
  const [newChatUser, setNewChatUser]   = useState('');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [creating, setCreating]         = useState(false);
  const currentUserId = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      currentUserId.current = u.id || u._id;
    } catch {}
    fetchChatRooms();
    fetchOnlineStatus();
    pollRef.current = setInterval(fetchOnlineStatus, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchChatRooms = async () => {
    try {
      const data = await api.getChatRooms();
      const rooms = data.rooms || [];
      setChatRooms(rooms);
      if (!selectedRoom && rooms.length > 0) setSelectedRoom(rooms[0]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchOnlineStatus = async () => {
    try {
      const data = await api.getUsersOnlineStatus();
      const map = {};
      (data.status || []).forEach(s => { map[s.id] = s; });
      setOnlineMap(map);
    } catch {}
  };

  const handleFlag = async (room, e) => {
    e?.stopPropagation();
    const newFlag = !room.isFlagged;
    try {
      await api.flagChatRoom(room.id, newFlag);
      toast.success(newFlag ? '🚩 Conversation flagged' : 'Flag removed');
      setChatRooms(prev => prev.map(r => r.id === room.id ? { ...r, isFlagged: newFlag } : r));
      if (selectedRoom?.id === room.id) setSelectedRoom(r => ({ ...r, isFlagged: newFlag }));
    } catch (err) { toast.error(err.message); }
  };

  const handleStartNewChat = async () => {
    if (!newChatUser) { toast.error('Select a user first'); return; }
    setCreating(true);
    try {
      const res = await api.createChatRoom({ participantIds: [parseInt(newChatUser)], title: newChatTitle || undefined, roomType: 'direct' });
      toast.success('Chat started');
      setShowNewChat(false); setNewChatUser(''); setNewChatTitle('');
      await fetchChatRooms();
      if (res.room) setSelectedRoom(res.room);
    } catch (err) { toast.error(err.message); }
    finally { setCreating(false); }
  };

  useEffect(() => {
    if (showNewChat && allUsers.length === 0) {
      api.getUsers({ limit: 500 }).then(d => setAllUsers(d.users || [])).catch(() => {});
    }
  }, [showNewChat]);

  const meId = String(currentUserId.current || '');
  const tabCounts = {
    all:     chatRooms.length,
    mine:    chatRooms.filter(r => r.participants?.some(p => String(p.id) === meId || String(p._id) === meId)).length,
    flagged: chatRooms.filter(r => r.isFlagged).length,
  };

  const filtered = chatRooms.filter(room => {
    const { type, primary, secondary, appId } = getRoomMeta(room);
    if (tab === 'flagged' && !room.isFlagged) return false;
    if (tab === 'mine' && !room.participants?.some(p => String(p.id) === meId || String(p._id) === meId)) return false;
    if (typeFilter && type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(primary?.name || '').toLowerCase().includes(q) && !(secondary?.name || '').toLowerCase().includes(q) && !(appId || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chat Monitor</h1>
            <p className="text-sm text-slate-500 mt-0.5">Full visibility into all conversations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchChatRooms} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => setShowNewChat(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Plus size={13} /> New Chat
            </button>
          </div>
        </div>

        {chatRooms.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No chat rooms yet" description="Rooms appear when clients or employees start conversations" />
        ) : (
          <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ height: '720px' }}>
            {/* ── Left Panel ── */}
            <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 flex flex-col border-r border-slate-200 dark:border-slate-700">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                {[['all','All'], ['mine','Mine'], ['flagged','🚩 Flagged']].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={clsx('flex-1 py-2.5 text-xs font-semibold transition-colors relative',
                      tab === key ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-700'
                    )}>
                    {label}
                    {tabCounts[key] > 0 && (
                      <span className={clsx('ml-1 text-[10px] px-1 rounded-full', tab === key ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500')}>
                        {tabCounts[key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="p-2 space-y-1.5 border-b border-slate-100 dark:border-slate-700">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-white" />
                </div>
                <div className="flex gap-1">
                  {[['','All'],['client','Clients'],['partner','Partners'],['internal','Internal']].map(([v, l]) => (
                    <button key={v} onClick={() => setTypeFilter(v)}
                      className={clsx('text-[10px] font-medium px-2 py-0.5 rounded flex-1 transition-colors',
                        typeFilter === v ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No conversations found</p>
                ) : filtered.map(room => {
                  const { type, primary, secondary, appId } = getRoomMeta(room);
                  const isSelected = selectedRoom?.id === room.id;
                  const hasUnread  = room.unreadCount > 0;
                  const ps = onlineMap[primary?.id] || onlineMap[parseInt(primary?.id)];
                  return (
                    <button key={room.id} onClick={() => setSelectedRoom(room)}
                      className={clsx('w-full px-3 py-2.5 flex items-start gap-2 text-left transition-colors border-b border-slate-100 dark:border-slate-700/50 group',
                        isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-[3px] border-l-primary-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40',
                        room.isFlagged ? 'bg-red-50/40 dark:bg-red-900/10' : ''
                      )}>
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                          {(primary?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-slate-800 rounded-full">
                          <StatusDot lastActiveAt={ps?.lastActiveAt} size="sm" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={clsx('inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded', TYPE_COLORS[type])}>
                            {TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                          {appId && <span className="text-[9px] text-primary-500 font-semibold">{appId}</span>}
                          {room.isFlagged && <span className="text-[10px]">🚩</span>}
                        </div>
                        <p className={clsx('text-sm leading-tight truncate', hasUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-800 dark:text-slate-200')}>
                          {primary?.name || 'User'}
                        </p>
                        {secondary && <p className="text-xs text-slate-400 truncate">↔ {secondary.name}</p>}
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {room.lastMessage?.content ? (room.lastMessage.content.length > 42 ? room.lastMessage.content.slice(0,42)+'…' : room.lastMessage.content) : 'No messages yet'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {room.lastMessage?.timestamp && <span className="text-[10px] text-slate-400">{format(new Date(room.lastMessage.timestamp), 'HH:mm')}</span>}
                        {hasUnread && <span className="w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{room.unreadCount > 9 ? '9+' : room.unreadCount}</span>}
                        <button onClick={e => handleFlag(room, e)} title={room.isFlagged ? 'Remove flag' : 'Flag'}
                          className={clsx('opacity-0 group-hover:opacity-100 p-0.5 rounded', room.isFlagged ? 'text-red-500 opacity-100' : 'text-slate-300 hover:text-red-400')}>
                          <Flag size={11} />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer: online count */}
              <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between text-[10px] text-slate-400">
                <span><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1" />{Object.values(onlineMap).filter(s => s.isOnline).length} online</span>
                <span>{filtered.length} shown</span>
              </div>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
              {selectedRoom ? (
                <>
                  {/* Chat sub-header */}
                  <div className="px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    {(() => {
                      const { primary, secondary, appId } = getRoomMeta(selectedRoom);
                      const ps = onlineMap[primary?.id];
                      return (
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                              {(primary?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 border border-white dark:border-slate-800 rounded-full">
                              <StatusDot lastActiveAt={ps?.lastActiveAt} size="sm" />
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{primary?.name || 'Chat'}</p>
                            <p className="text-[10px] text-slate-400">
                              {ps?.isOnline ? <span className="text-green-600 font-medium">● Online now</span> : ps?.lastActiveAt ? `Last seen ${formatDistanceToNow(new Date(ps.lastActiveAt), { addSuffix: true })}` : 'Offline'}
                              {secondary && ` · ${secondary.name}`}
                              {appId && ` · ${appId}`}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-1.5">
                      {selectedRoom.isFlagged && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">🚩 Flagged</span>}
                      <button onClick={() => handleFlag(selectedRoom)}
                        title={selectedRoom.isFlagged ? 'Remove flag' : 'Flag conversation'}
                        className={clsx('p-1.5 rounded-lg', selectedRoom.isFlagged ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50')}>
                        <Flag size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatBox roomId={selectedRoom._id || String(selectedRoom.id)} roomInfo={getRoomMeta(selectedRoom)} isAdmin />
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <MessageCircle size={48} className="text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="font-medium text-slate-500">Select a conversation</p>
                  <p className="text-sm text-slate-400 mt-1">View messages, reply, or flag suspicious conversations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Direct Chat Modal */}
      <Modal isOpen={showNewChat} onClose={() => setShowNewChat(false)} title="Start Direct Chat">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Start a direct conversation with any client, employee, or partner.</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Select User *</label>
            <select value={newChatUser} onChange={e => setNewChatUser(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select user —</option>
              {['client','employee','partner'].map(role => {
                const group = allUsers.filter(u => u.role === role);
                if (!group.length) return null;
                return (
                  <optgroup key={role} label={role.charAt(0).toUpperCase()+role.slice(1)+'s'}>
                    {group.map(u => <option key={u.id||u._id} value={u.id||u._id}>{u.name} — {u.email}</option>)}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Chat Title (optional)</label>
            <input value={newChatTitle} onChange={e => setNewChatTitle(e.target.value)} placeholder="e.g. ITR Filing Query"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowNewChat(false)} className="flex-1 btn-outline text-sm">Cancel</button>
            <button onClick={handleStartNewChat} disabled={creating || !newChatUser} className="flex-1 btn-primary text-sm disabled:opacity-60">
              {creating ? 'Opening…' : 'Start Chat'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
