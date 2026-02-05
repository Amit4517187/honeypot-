import React from 'react';
import { Intelligence } from '../types';

interface IntelligenceCardProps {
  intelligence: Intelligence;
  notes: string;
}

const IntelligenceCard: React.FC<IntelligenceCardProps> = ({ intelligence, notes }) => {
  const renderList = (title: string, items: string[], icon: string, colorClass: string) => (
    <div className="mb-4">
      <h4 className={`text-sm font-semibold mb-1 flex items-center ${colorClass}`}>
        <span className="mr-2">{icon}</span> {title}
      </h4>
      {items.length > 0 ? (
        <ul className="list-disc list-inside bg-gray-900 rounded p-2 border border-gray-700">
          {items.map((item, idx) => (
            <li key={idx} className="text-xs text-gray-300 break-all">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 italic ml-6">None detected</p>
      )}
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
        <span>🔍 Extracted Intelligence</span>
      </h3>
      
      <div className="space-y-2">
        {renderList('Bank Accounts', intelligence.bankAccounts, '🏦', 'text-yellow-400')}
        {renderList('UPI IDs', intelligence.upiIds, '💳', 'text-purple-400')}
        {renderList('Phishing Links', intelligence.phishingLinks, '🔗', 'text-red-400')}
        {renderList('Phone Numbers', intelligence.phoneNumbers, '📱', 'text-blue-400')}
        {renderList('Suspicious Keywords', intelligence.suspiciousKeywords, '🚩', 'text-orange-400')}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Agent Notes</h4>
        <div className="bg-gray-900 p-3 rounded border border-gray-700 text-sm text-gray-400 italic">
          "{notes || 'No analysis available yet.'}"
        </div>
      </div>
    </div>
  );
};

export default IntelligenceCard;