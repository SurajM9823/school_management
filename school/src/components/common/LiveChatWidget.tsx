import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import Button from './Button'; // Added Button import

interface ChatMessage {
  id: string;
  sender: 'user' | 'support' | 'system';
  text: string;
  timestamp: Date;
  avatar?: string;
  name?: string;
}

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys1', sender: 'system', text: 'Welcome to Live Support! How can we help you today?', timestamp: new Date(Date.now() - 60000 * 5) },
    { id: 'user1', sender: 'user', name: 'You', text: 'I have a question about my fee payment.', timestamp: new Date(Date.now() - 60000 * 4) },
    { id: 'sup1', sender: 'support', name: 'Support Bot', text: 'Sure, I can help with that. Could you please provide your student ID or invoice number?', timestamp: new Date(Date.now() - 60000 * 3), avatar: 'https://via.placeholder.com/40/007bff/ffffff?text=SB' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen, isMinimized]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    const newMessage: ChatMessage = {
      id: `user${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date(),
      name: 'You', // Or actual user name
    };
    setMessages([...messages, newMessage]);
    setMessage('');
    // Simulate a support reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `sup${Date.now()}`,
        sender: 'support',
        text: "Thanks for your message. We're looking into it and will get back to you shortly.",
        timestamp: new Date(),
        avatar: 'https://via.placeholder.com/40/007bff/ffffff?text=SB',
        name: 'Support Bot'
      }]);
    }, 1500);
  };

  if (!isOpen && !isMinimized) {
    return (
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-transform transform hover:scale-110 z-50"
        aria-label="Open live chat"
      >
        <MessageCircle size={28} />
      </button>
    );
  }
  
  if (isMinimized) {
     return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 z-50"
        aria-label="Maximize chat"
      >
        <MessageCircle size={20} />
         {/* Add a badge for unread messages if needed */}
      </button>
    );
  }


  return (
    <div className={clsx(
        "fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-full sm:h-[500px] bg-white rounded-t-lg sm:rounded-lg shadow-xl flex flex-col border border-gray-300 z-50 transition-all duration-300 ease-out",
        isOpen && !isMinimized ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full sm:translate-y-0 sm:translate-x-full"
    )}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-lg sm:rounded-t-lg">
        <h3 className="font-semibold text-md flex items-center">
            <MessageCircle size={18} className="mr-2"/> Live Chat Support
        </h3>
        <div className="flex items-center space-x-2">
            <button onClick={() => setIsMinimized(true)} className="text-blue-200 hover:text-white" aria-label="Minimize chat">
                <Minimize2 size={18} />
            </button>
            <button onClick={() => { setIsOpen(false); setIsMinimized(false); }} className="text-blue-200 hover:text-white" aria-label="Close chat">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx("flex items-end space-x-2 max-w-[85%]", msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start')}>
            {msg.sender !== 'user' && msg.sender !== 'system' && (
                msg.avatar ? <img src={msg.avatar} alt={msg.name} className="w-7 h-7 rounded-full"/> : <UserCircle size={28} className="text-gray-400"/>
            )}
            <div className={clsx(
                "p-2.5 rounded-lg text-sm shadow", 
                msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 
                msg.sender === 'support' ? 'bg-gray-200 text-gray-800 rounded-bl-none' :
                'bg-transparent text-gray-500 text-xs italic text-center w-full' // System message
            )}>
              {msg.sender !== 'system' && msg.name && msg.sender !== 'user' && <p className="text-xs font-semibold mb-0.5 text-gray-600">{msg.name}</p>}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.sender !== 'system' && <p className={clsx("text-xs mt-1", msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-gray-500 text-left')}>{format(msg.timestamp, 'p')}</p>}
            </div>
             {msg.sender === 'user' && (
                <UserCircle size={28} className="text-blue-300"/> // User avatar placeholder
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          aria-label="Chat message input"
        />
        <Button type="submit" variant="primary" className="p-2.5" aria-label="Send message">
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
};

export default LiveChatWidget;