import React, { useState } from 'react';
import { ApiRequest, ApiResponse, Session } from '../types';
import { detectScamIntent, generateAgentReply, extractIntelligence } from '../services/geminiService';

interface ApiTesterProps {
  onSessionUpdate: (session: Session) => void;
}

const ApiTester: React.FC<ApiTesterProps> = ({ onSessionUpdate }) => {
  // Server Configuration State (Simulation)
  const [serverApiKey, setServerApiKey] = useState('secure-honey-pot-key-123');
  const [virtualUrl] = useState('https://api.honeypot.ai/v1/message');

  // Request State
  const [requestApiKey, setRequestApiKey] = useState('secure-honey-pot-key-123');
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('json');

  // Updated to use Epoch ms timestamps as per requirement
  const DEFAULT_JSON = JSON.stringify({
    "sessionId": "session-" + Math.floor(Math.random() * 10000),
    "message": {
      "sender": "scammer",
      "text": "Your account is temporarily suspended. Click http://scam-link.com to verify.",
      "timestamp": Date.now()
    },
    "conversationHistory": [
        {
            "sender": "scammer",
            "text": "Hello, this is Bank Support. Are you there?",
            "timestamp": Date.now() - 120000
        },
        {
            "sender": "user",
            "text": "Yes, what is the problem?",
            "timestamp": Date.now() - 60000
        }
    ],
    "metadata": {
      "channel": "SMS",
      "language": "English",
      "locale": "IN"
    }
  }, null, 2);

  const [inputJson, setInputJson] = useState<string>(DEFAULT_JSON);
  const [responseJson, setResponseJson] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [callbackJson, setCallbackJson] = useState<string>('');
  const [callbackStatus, setCallbackStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReset = () => {
    setInputJson(DEFAULT_JSON);
    setResponseJson('');
    setCallbackJson('');
    setResponseStatus(null);
    setCallbackStatus('idle');
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseJson('');
    setCallbackJson('');
    setResponseStatus(null);
    setCallbackStatus('idle');

    // 0. Trim Keys
    const cleanRequestKey = requestApiKey.trim();
    const cleanServerKey = serverApiKey.trim();

    // 1. Simulate Authentication
    if (cleanRequestKey !== cleanServerKey) {
      setTimeout(() => {
        setResponseStatus(401);
        setResponseJson(JSON.stringify({
          error: "Unauthorized",
          message: "Invalid x-api-key provided."
        }, null, 2));
        setLoading(false);
      }, 500);
      return;
    }

    try {
      // 2. Validate JSON Structure
      let request: ApiRequest;
      try {
        request = JSON.parse(inputJson);
      } catch (e) {
        setResponseStatus(400);
        setResponseJson(JSON.stringify({ 
          error: "Invalid JSON", 
          message: "The Request Body is not valid JSON." 
        }, null, 2));
        setLoading(false);
        return;
      }

      if (!request.sessionId || !request.message || typeof request.message.text !== 'string') {
         throw new Error("Missing required fields (sessionId, message.text)");
      }
      
      const rawHistory = Array.isArray(request.conversationHistory) ? request.conversationHistory : [];
      
      // 3. Convert API format to internal Message format
      const history = rawHistory.map(m => ({
        sender: (['scammer', 'user', 'agent'].includes(m.sender) ? m.sender : 'user') as 'scammer' | 'user' | 'agent',
        text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text),
        timestamp: m.timestamp || Date.now()
      }));
      
      const incomingMessage = request.message.text;

      // 4. Scam Detection
      const detection = await detectScamIntent(incomingMessage, history);
      
      let replyText = "";
      
      // 5. Agent Logic
      if (detection.isScam) {
        replyText = await generateAgentReply(incomingMessage, history);
      } else {
        replyText = "Message processed. No scam detected.";
      }

      // 6. Response
      const response: ApiResponse = {
        status: "success",
        reply: replyText
      };
      setResponseStatus(200);
      setResponseJson(JSON.stringify(response, null, 2));

      // 7. Intelligence & Callback (Mandatory)
      const fullHistory = [
        ...history, 
        { sender: 'scammer' as const, text: incomingMessage, timestamp: request.message.timestamp },
        { sender: 'agent' as const, text: replyText, timestamp: Date.now() }
      ];

      const extraction = await extractIntelligence(fullHistory);

      const callbackPayload = {
        sessionId: request.sessionId,
        scamDetected: detection.isScam,
        totalMessagesExchanged: fullHistory.length,
        extractedIntelligence: extraction.intelligence,
        agentNotes: extraction.notes
      };

      setCallbackJson(JSON.stringify(callbackPayload, null, 2));

      // EXECUTE MANDATORY CALLBACK
      if (detection.isScam) {
        setCallbackStatus('sending');
        try {
            await fetch("https://hackathon.guvi.in/api/updateHoneyPotFinalResult", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(callbackPayload)
            });
            setCallbackStatus('success');
        } catch (err) {
            console.error("Callback failed:", err);
            // In a simulation/browser environment, CORS might block this. 
            // We treat it as 'done' but show error visually.
            setCallbackStatus('error'); 
        }
      }

      // Update Global State
      const newSession: Session = {
        id: request.sessionId,
        status: detection.isScam ? 'scam_detected' : 'safe',
        messages: fullHistory,
        scamConfidence: detection.confidence,
        extractedIntelligence: extraction.intelligence,
        agentNotes: extraction.notes,
        lastUpdated: new Date().toISOString()
      };
      onSessionUpdate(newSession);

    } catch (e: any) {
      setResponseStatus(400);
      setResponseJson(JSON.stringify({ error: "Bad Request", message: e.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const renderVisualPreview = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const history = Array.isArray(parsed.conversationHistory) ? parsed.conversationHistory : [];
      const current = parsed.message ? [parsed.message] : [];
      const displayMessages = [...history, ...current];

      if (displayMessages.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500 text-xs italic">No messages found</div>;

      return (
        <div className="bg-gray-950 p-4 rounded border border-gray-700 h-64 overflow-y-auto space-y-3 custom-scrollbar">
          {displayMessages.map((msg: any, idx: number) => (
             <div key={idx} className={`flex ${['agent', 'user'].includes(msg.sender) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded p-2 text-xs ${
                  msg.sender === 'agent' ? 'bg-cyan-900/30 text-cyan-200 border border-cyan-800' :
                  msg.sender === 'user' ? 'bg-blue-900/20 text-blue-200 border border-blue-800' :
                  'bg-gray-800 text-gray-300 border border-gray-600'
                }`}>
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="font-bold uppercase opacity-70 text-[10px]">{msg.sender}</span>
                    <span className="opacity-50 text-[10px]">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                  </div>
                  {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                </div>
             </div>
          ))}
        </div>
      );
    } catch (e) {
      return <div className="h-64 flex items-center justify-center text-red-400 text-xs">Invalid JSON syntax for preview</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto p-2">
      
      {/* Configuration Column */}
      <div className="flex flex-col gap-4 lg:col-span-1">
        {/* Educational Info Box */}
        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
          <h4 className="text-blue-400 font-bold text-sm uppercase mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Developer Guide
          </h4>
          <p className="text-xs text-blue-200 mb-2">
            <strong>Requirement:</strong> Verify that timestamp uses Epoch format (ms) and the Mandatory Callback is fired upon scam detection.
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="p-1 bg-gray-700 rounded text-sm">⚙️</span>
             Server Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Honeypot API Endpoint URL</label>
              <div className="flex items-center bg-gray-900 rounded border border-gray-700 px-3 py-2 justify-between">
                 <span className="text-sm text-gray-300 font-mono truncate">{virtualUrl}</span>
                 <button 
                  onClick={() => handleCopy(virtualUrl[0], 'url')}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Copy URL"
                 >
                   {copiedField === 'url' ? <span className="text-green-500 text-xs">Copied!</span> : 
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                   }
                 </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Server Secret (x-api-key)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={serverApiKey}
                  onChange={(e) => setServerApiKey(e.target.value)}
                  className="w-full bg-gray-900 text-yellow-400 font-mono text-sm p-2 pr-8 rounded border border-gray-700 focus:border-yellow-500 focus:outline-none"
                />
                 <button 
                  onClick={() => handleCopy(serverApiKey, 'key')}
                  className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                  title="Copy Key"
                 >
                   {copiedField === 'key' ? <span className="text-green-500 text-xs">✓</span> : 
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                   }
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm flex-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-mono font-bold text-cyan-400 text-lg">POST Request</h3>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">Simulator Client</span>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Headers: x-api-key</label>
            <input 
              type="text"
              value={requestApiKey}
              onChange={(e) => setRequestApiKey(e.target.value)}
              placeholder="Paste x-api-key here..."
              className={`w-full bg-gray-900 font-mono text-sm p-2 rounded border focus:outline-none transition-colors ${
                 requestApiKey.trim() === serverApiKey.trim() ? 'border-green-700 text-green-400' : 'border-red-900 text-red-400'
              }`}
            />
          </div>

          <div className="flex justify-between items-center mb-1">
             <label className="block text-xs font-semibold text-gray-400">Request Body</label>
             <div className="flex gap-2">
               <button 
                  onClick={() => setViewMode('json')} 
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${viewMode === 'json' ? 'bg-cyan-700 text-white' : 'text-gray-500 hover:text-white'}`}
               >
                 JSON
               </button>
               <button 
                  onClick={() => setViewMode('visual')} 
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${viewMode === 'visual' ? 'bg-cyan-700 text-white' : 'text-gray-500 hover:text-white'}`}
               >
                 Visual Preview
               </button>
               <span className="text-gray-700 mx-1">|</span>
               <button onClick={handleReset} className="text-[10px] text-cyan-500 hover:text-cyan-400 underline">Reset</button>
             </div>
          </div>
          
          {viewMode === 'json' ? (
            <textarea
              className="w-full h-64 bg-gray-900 text-gray-300 font-mono text-sm p-3 rounded border border-gray-700 focus:outline-none focus:border-cyan-500"
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
            />
          ) : (
            renderVisualPreview()
          )}

          <button
            onClick={handleExecute}
            disabled={loading}
            className={`mt-4 w-full py-2 px-4 rounded font-bold transition-all ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(0,163,196,0.3)]'
            }`}
          >
            {loading ? 'Sending Request...' : 'TEST ENDPOINT'}
          </button>
        </div>
      </div>

      {/* Output Column */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className={`font-mono font-bold text-lg ${
              responseStatus === 200 ? 'text-green-400' : 
              responseStatus === 401 ? 'text-red-500' : 'text-gray-400'
            }`}>
              Response {responseStatus ? `(${responseStatus})` : ''}
            </h3>
            {responseStatus && (
                <span className={`text-xs px-2 py-1 rounded ${responseStatus === 200 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {responseStatus === 200 ? 'OK' : 'Unauthorized'}
                </span>
            )}
          </div>
          <textarea
            readOnly
            className={`w-full h-32 bg-gray-950 font-mono text-xs p-3 rounded border border-gray-700 focus:outline-none ${
              responseStatus === 401 ? 'text-red-400' : 'text-green-300'
            }`}
            value={responseJson}
            placeholder="Waiting for request..."
          />
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm flex-1 flex flex-col">
           <div className="flex justify-between items-center mb-2">
            <h3 className="font-mono font-bold text-purple-400 text-lg">Mandatory Callback</h3>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">https://hackathon.guvi.in/api/updateHoneyPotFinalResult</span>
                <span className={`text-xs px-2 py-1 rounded border ${
                    callbackStatus === 'idle' ? 'bg-gray-900 text-gray-500 border-gray-700' :
                    callbackStatus === 'sending' ? 'bg-yellow-900/30 text-yellow-500 border-yellow-700 animate-pulse' :
                    callbackStatus === 'success' ? 'bg-green-900/30 text-green-400 border-green-700' :
                    'bg-red-900/30 text-red-400 border-red-700'
                }`}>
                    {callbackStatus.toUpperCase()}
                </span>
            </div>
          </div>
          <textarea
            readOnly
            className="w-full flex-1 min-h-[200px] bg-gray-950 text-purple-300 font-mono text-xs p-3 rounded border border-gray-700 focus:outline-none"
            value={callbackJson}
            placeholder="Callback payload will appear here. The system will automatically POST this to the GUVI evaluation endpoint upon scam detection."
          />
        </div>
      </div>
    </div>
  );
};

export default ApiTester;