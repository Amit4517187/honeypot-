import React, { useState } from 'react';
import { Session } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  sessions: Session[];
}

const Dashboard: React.FC<DashboardProps> = ({ sessions }) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const totalSessions = sessions.length;
  const scamSessions = sessions.filter(s => s.status === 'scam_detected').length;
  const safeSessions = sessions.filter(s => s.status === 'safe').length;
  
  // Aggregate extracted data
  const totalBankAccounts = sessions.reduce((acc, s) => acc + s.extractedIntelligence.bankAccounts.length, 0);
  const totalUpi = sessions.reduce((acc, s) => acc + s.extractedIntelligence.upiIds.length, 0);
  const totalLinks = sessions.reduce((acc, s) => acc + s.extractedIntelligence.phishingLinks.length, 0);

  const chartData = [
    { name: 'Bank Acc', value: totalBankAccounts },
    { name: 'UPI IDs', value: totalUpi },
    { name: 'Phishing Links', value: totalLinks },
  ];

  const pieData = [
    { name: 'Scam', value: scamSessions },
    { name: 'Safe', value: safeSessions },
  ];

  const COLORS = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6'];

  return (
    <div className="p-2 space-y-6 overflow-y-auto h-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Active Monitoring</h3>
          <p className="text-3xl font-bold text-white mt-1">{totalSessions}</p>
          <span className="text-xs text-green-400">System online</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Scams Intercepted</h3>
          <p className="text-3xl font-bold text-red-500 mt-1">{scamSessions}</p>
          <span className="text-xs text-gray-500">{(scamSessions / (totalSessions || 1) * 100).toFixed(0)}% detection rate</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
           <h3 className="text-gray-400 text-sm font-medium">Total Entities Extracted</h3>
           <p className="text-3xl font-bold text-yellow-500 mt-1">{totalBankAccounts + totalUpi + totalLinks}</p>
           <span className="text-xs text-gray-500">Actionable intelligence</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
           <h3 className="text-gray-400 text-sm font-medium">Avg Engagement</h3>
           <p className="text-3xl font-bold text-blue-500 mt-1">~4m 12s</p>
           <span className="text-xs text-gray-500">Wasted scammer time</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
          <h3 className="text-white font-bold mb-4">Intelligence Breakdown</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  cursor={{ fill: '#374151', opacity: 0.2 }}
                />
                <Bar dataKey="value" fill="#00a3c4" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
          <h3 className="text-white font-bold mb-4">Traffic Analysis</h3>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-bold">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3">Session ID</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Confidence</th>
                <th scope="col" className="px-6 py-3">Last Active</th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice().reverse().slice(0, 10).map((session) => (
                <tr 
                  key={session.id} 
                  className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-6 py-4 font-mono">{session.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      session.status === 'scam_detected' ? 'bg-red-900 text-red-300' : 
                      session.status === 'safe' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {session.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     {session.scamConfidence ? `${session.scamConfidence}%` : '-'}
                  </td>
                  <td className="px-6 py-4">{new Date(session.lastUpdated).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button className="text-cyan-400 hover:text-cyan-300 underline text-xs">View Chat</button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                 <tr>
                    <td colSpan={5} className="px-6 py-4 text-center italic opacity-50">No sessions recorded yet. Use the Simulator or API Tester.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSession(null)}>
          <div className="bg-gray-800 w-full max-w-4xl max-h-[85vh] rounded-xl border border-gray-600 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  Session Analysis: <span className="font-mono text-cyan-400">{selectedSession.id}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                   Started: {selectedSession.messages[0] ? new Date(selectedSession.messages[0].timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 sticky top-0 bg-gray-900/90 p-2 backdrop-blur-sm border-b border-gray-800 z-10">
                  Conversation Transcript
                </h4>
                {selectedSession.messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${
                      msg.sender === 'agent' 
                        ? 'bg-cyan-900/20 border border-cyan-800 text-cyan-100' 
                        : 'bg-gray-700 border border-gray-600 text-gray-200'
                    }`}>
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <span className={`text-[10px] font-bold uppercase ${msg.sender === 'agent' ? 'text-cyan-500' : 'text-red-400'}`}>
                          {msg.sender === 'agent' ? 'Agent (Ramesh)' : msg.sender}
                        </span>
                        <span className="text-[10px] text-gray-500 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {selectedSession.messages.length === 0 && (
                    <div className="text-center text-gray-500 py-10">No messages found in this session log.</div>
                )}
              </div>

              {/* Sidebar Info (Desktop) */}
              <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Investigation Details</h4>
                
                <div className="space-y-4">
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <span className="text-xs text-gray-500 block mb-1">Threat Level Status</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        selectedSession.status === 'scam_detected' ? 'bg-red-900 text-red-300' : 
                        selectedSession.status === 'safe' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    }`}>
                        {selectedSession.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <span className="text-xs text-gray-500 block mb-1">AI Confidence Score</span>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${selectedSession.scamConfidence > 80 ? 'bg-red-500' : selectedSession.scamConfidence > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                style={{ width: `${selectedSession.scamConfidence}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-mono text-white">{selectedSession.scamConfidence}%</span>
                    </div>
                  </div>

                  <div>
                     <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Captured Intelligence</h5>
                     <div className="space-y-2">
                     {['bankAccounts', 'upiIds', 'phishingLinks', 'phoneNumbers'].map(key => {
                        const items = selectedSession.extractedIntelligence[key as keyof typeof selectedSession.extractedIntelligence] as string[];
                        if (items && items.length > 0) {
                            return (
                                <div key={key} className="bg-gray-900/30 p-2 rounded border border-gray-700/50">
                                    <span className="text-[10px] text-gray-500 capitalize block mb-1 font-bold">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <ul className="list-disc list-inside text-xs text-white">
                                        {items.map((item, i) => <li key={i} className="truncate">{item}</li>)}
                                    </ul>
                                </div>
                            )
                        }
                        return null;
                     })}
                     </div>
                     
                     {/* If no data */}
                     {Object.values(selectedSession.extractedIntelligence).every(arr => Array.isArray(arr) && arr.length === 0) && (
                         <div className="p-3 border border-gray-700 border-dashed rounded text-center">
                             <p className="text-xs text-gray-500 italic">No specific entities (UPI, Bank, Links) extracted yet.</p>
                         </div>
                     )}
                  </div>

                  <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Agent Observations</h5>
                      <p className="text-xs text-gray-300 bg-gray-900 p-3 rounded border border-gray-700 italic leading-relaxed">
                        "{selectedSession.agentNotes || 'No notes generated by the agent.'}"
                      </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;