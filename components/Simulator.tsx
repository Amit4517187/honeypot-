import React, { useState, useEffect, useRef } from 'react';
import { Message, Session, Intelligence } from '../types';
import { detectScamIntent, generateAgentReply, extractIntelligence } from '../services/geminiService';
import IntelligenceCard from './IntelligenceCard';

interface SimulatorProps {
  onSessionUpdate: (session: Session) => void;
}

const Simulator: React.FC<SimulatorProps> = ({ onSessionUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scamDetected, setScamDetected] = useState(false);
  const [sessionId] = useState(`sim-${Math.random().toString(36).substring(7)}`);
  const [intelligence, setIntelligence] = useState<Intelligence>({
    bankAccounts: [], upiIds: [], phishingLinks: [], phoneNumbers: [], suspiciousKeywords: []
  });
  const [agentNotes, setAgentNotes] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const newMessage: Message = {
      sender: 'scammer', // User acts as the scammer in simulator
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // 1. Detect Scam
      const detection = await detectScamIntent(newMessage.text, messages);
      
      if (detection.isScam) {
        setScamDetected(true);
      }

      // 2. Generate Reply (if detected or force reply for demo purposes)
      // For the simulator, we always reply to keep the flow, but label it based on detection
      let replyText = "";
      if (detection.isScam || scamDetected) {
         replyText = await generateAgentReply(newMessage.text, messages);
      } else {
         replyText = "I don't understand. Who is this?"; // Default 'user' response if not scam yet
      }

      const agentMessage: Message = {
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [...messages, newMessage, agentMessage];
      setMessages(updatedHistory);

      // 3. Extract Intelligence continuously
      if (detection.isScam || scamDetected) {
        const extraction = await extractIntelligence(updatedHistory);
        setIntelligence(extraction.intelligence);
        setAgentNotes(extraction.notes);
        
        // Update Session History
        onSessionUpdate({
            id: sessionId,
            status: 'scam_detected',
            messages: updatedHistory,
            scamConfidence: detection.confidence,
            extractedIntelligence: extraction.intelligence,
            agentNotes: extraction.notes,
            lastUpdated: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error("Error in simulation flow", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-2">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              Live Scam Simulation
            </h2>
            <p className="text-xs text-gray-400">Session ID: {sessionId}</p>
          </div>
          <div className={`px-3 py-1 rounded text-xs font-bold border ${scamDetected ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-green-900/50 border-green-500 text-green-400'}`}>
            {scamDetected ? 'SCAM DETECTED' : 'MONITORING'}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
             <div className="text-center text-gray-500 mt-20">
                <p className="mb-2">System Ready.</p>
                <p className="text-sm">Act as a scammer to test the Honey-Pot Agent.</p>
                <p className="text-xs mt-4 opacity-50">Example: "Your account is blocked. Send UPI payment to verify."</p>
             </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'agent' 
                  ? 'bg-cyan-900/30 border border-cyan-800 text-cyan-100' 
                  : 'bg-gray-700 border border-gray-600 text-gray-100'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold uppercase mr-2 ${msg.sender === 'agent' ? 'text-cyan-400' : 'text-red-400'}`}>
                    {msg.sender === 'agent' ? 'Agent (Ramesh)' : 'Incoming (Scammer)'}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-900 border-t border-gray-700">
           <div className="flex gap-2">
             <input
               type="text"
               className="flex-1 bg-gray-800 text-white rounded border border-gray-700 p-2 focus:border-red-500 focus:outline-none placeholder-gray-500"
               placeholder="Type a scam message..."
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               disabled={isProcessing}
             />
             <button
               onClick={handleSendMessage}
               disabled={isProcessing}
               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
             >
               Send
             </button>
           </div>
        </div>
      </div>

      {/* Real-time Intelligence */}
      <div className="w-full lg:w-1/3 h-full">
         <IntelligenceCard intelligence={intelligence} notes={agentNotes} />
      </div>
    </div>
  );
};

export default Simulator;