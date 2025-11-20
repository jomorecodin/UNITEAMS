import React, { useEffect, useState, useRef } from 'react';
import { getGroupMessages, sendGroupMessage, GroupMessage } from '../services/requests';
import { useAuth } from '../context/AuthContext';

interface GroupChatProps {
  groupId: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = (window as any).supabaseToken || '';
      const msgs = await getGroupMessages(token, groupId);
      setMessages(msgs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Opcional: polling cada 5s
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [groupId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    setLoading(true);
    try {
      const token = (window as any).supabaseToken || '';
      await sendGroupMessage(token, groupId, newMessage);
      setNewMessage('');
      await fetchMessages();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-6 shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-2">Chat del grupo</h2>
      <div className="overflow-y-auto h-64 border border-gray-700 rounded mb-2 bg-gray-950 p-2">
        {loading && <div className="text-gray-400">Cargando mensajes...</div>}
        {messages.map(msg => (
          <div key={msg.id} className={`mb-2 flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`inline-block px-3 py-2 rounded-lg ${msg.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
              <span className="block text-xs text-gray-400">{msg.senderRole}</span>
              <span>{msg.content}</span>
              <span className="block text-[10px] text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded px-2 py-1 bg-gray-800 text-white border border-gray-700"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={loading}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading || !newMessage.trim()}>
          Enviar
        </button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};
