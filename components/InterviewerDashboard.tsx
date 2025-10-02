import React, { useState, useMemo } from 'react';
import type { Candidate, InterviewAnswer } from '../types';
import { InterviewStatus } from '../types';
import { SortIcon } from './icons/SortIcon';
import { TOTAL_QUESTIONS } from '../constants';
import { RobotIcon } from './icons/RobotIcon';
import { UserIcon } from './icons/UserIcon';

type SortKey = 'name' | 'finalScore' | 'status' | 'progress';
type SortDirection = 'asc' | 'desc';

const CandidateDetail: React.FC<{ candidate: Candidate, onBack: () => void }> = ({ candidate, onBack }) => {
    return (
        <div className="border-glow rounded-2xl p-6 animate-fade-in shadow-2xl shadow-sky-900/20">
            <button onClick={onBack} className="mb-6 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500">&larr; Back to List</button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 border-glow p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-sky-300 mb-3">{candidate.name}</h3>
                    <p className="text-slate-300 break-all"><strong>Email:</strong> {candidate.email}</p>
                    <p className="text-slate-300"><strong>Phone:</strong> {candidate.phone}</p>
                </div>
                <div className="lg:col-span-2 border-glow p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-sky-300 mb-3">AI Summary & Feedback</h3>
                     <p className="text-slate-300 whitespace-pre-wrap">{candidate.summary || 'Summary not yet generated.'}</p>
                    <p className="mt-4 text-3xl font-bold text-right text-sky-300">
                        {candidate.finalScore !== null ? `${candidate.finalScore}%` : 'N/A'}
                    </p>
                </div>
            </div>

            <div className="border-glow p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-4 text-sky-300">Interview Transcript</h3>
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-3">
                    {candidate.answers.map((ans: InterviewAnswer, index: number) => (
                         <div key={ans.question.id}>
                            <div className="flex items-start gap-4 my-2">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-sky-600 to-cyan-500">
                                    <RobotIcon />
                                </div>
                                <div className="p-4 rounded-xl max-w-lg shadow-md bg-gradient-to-br from-slate-800 to-slate-700/80 rounded-bl-none border border-slate-600/50">
                                    <p className="font-bold mb-2 text-sky-300">Question {index + 1}</p>
                                    <p>{ans.question.text}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 my-2 flex-row-reverse">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-slate-700">
                                    <UserIcon />
                                </div>
                                <div className="p-4 rounded-xl max-w-lg shadow-md bg-gradient-to-br from-slate-700 to-slate-600/80 rounded-br-none">
                                    <p>{ans.answer || "No answer provided."}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                     {candidate.answers.length === 0 && <p className="text-slate-400">No answers recorded yet.</p>}
                </div>
            </div>
        </div>
    );
};


const InterviewerDashboard: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'finalScore', direction: 'desc' });
  
  const sortedAndFilteredCandidates = useMemo(() => {
    let filtered = candidates.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const key = sortConfig.key;
      let aValue: string | number | null;
      let bValue: string | number | null;

      switch(key) {
        case 'finalScore':
          aValue = a.finalScore ?? -1;
          bValue = b.finalScore ?? -1;
          break;
        case 'progress':
          aValue = a.currentQuestionIndex;
          bValue = b.currentQuestionIndex;
          break;
        case 'name':
        case 'status':
          aValue = a[key];
          bValue = b[key];
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (aValue === null || bValue === null || aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [candidates, searchTerm, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return <SortIcon />;
    return <span className="text-white">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  if (selectedCandidate) {
    return <CandidateDetail candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} />;
  }

  return (
    <div className="border-glow rounded-2xl p-4 sm:p-6 shadow-2xl shadow-sky-900/20">
      <h2 className="text-3xl font-bold mb-6 text-sky-300">Interviewer Dashboard</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/70 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
        />
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden lg:block">
        <table className="w-full min-w-[1000px] text-left">
          <thead className="border-b-2 border-slate-700 text-sm uppercase text-slate-400">
            <tr>
              <th className="p-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => requestSort('name')}>Name {getSortIndicator('name')}</div>
              </th>
              <th className="p-4">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIndicator('status')}</div>
              </th>
              <th className="p-4">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => requestSort('progress')}>Progress {getSortIndicator('progress')}</div>
              </th>
              <th className="p-4 w-2/5">Summary</th>
              <th className="p-4 text-right">
                <div className="flex items-center gap-2 justify-end cursor-pointer" onClick={() => requestSort('finalScore')}>Final Score {getSortIndicator('finalScore')}</div>
              </th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredCandidates.map((candidate) => (
              <tr key={candidate.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors group relative">
                <td className="p-4 font-semibold text-slate-200">{candidate.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    candidate.interviewStatus === InterviewStatus.Completed ? 'bg-green-500/20 text-green-300' : 
                    candidate.interviewStatus === InterviewStatus.InProgress ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {candidate.interviewStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  {candidate.interviewStatus === InterviewStatus.Completed 
                    ? <span className="font-semibold text-green-300">Completed</span>
                    : <span className="font-mono">{`${candidate.currentQuestionIndex} / ${TOTAL_QUESTIONS}`}</span>
                  }
                </td>
                <td className="p-4 text-sm text-slate-400">
                  {candidate.summary 
                    ? `${candidate.summary.substring(0, 70)}...` 
                    : <span className="text-slate-500">Not generated</span>}
                </td>
                <td className="p-4 font-bold text-right text-sky-300 text-lg">{candidate.finalScore !== null ? `${candidate.finalScore}%` : 'N/A'}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setSelectedCandidate(candidate)}
                    className="bg-sky-700 hover:bg-sky-600 border border-sky-600/50 text-white font-semibold px-4 py-1 rounded-md transition-all text-sm hover:scale-105"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {sortedAndFilteredCandidates.map((candidate) => (
          <div key={candidate.id} className="border-glow bg-slate-800/30 rounded-xl p-4 cursor-pointer hover:bg-slate-800/60 transition-colors" onClick={() => setSelectedCandidate(candidate)}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-lg text-slate-100">{candidate.name}</p>
                <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    candidate.interviewStatus === InterviewStatus.Completed ? 'bg-green-500/20 text-green-300' : 
                    candidate.interviewStatus === InterviewStatus.InProgress ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {candidate.interviewStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sky-300 text-2xl">{candidate.finalScore !== null ? `${candidate.finalScore}%` : 'N/A'}</p>
                 {candidate.interviewStatus !== InterviewStatus.Completed && (
                    <p className="font-mono text-sm text-slate-400">{`${candidate.currentQuestionIndex} / ${TOTAL_QUESTIONS}`}</p>
                 )}
              </div>
            </div>
             <p className="mt-3 text-sm text-slate-400">
              {candidate.summary 
                ? `${candidate.summary.substring(0, 100)}...` 
                : <span className="text-slate-500">Interview in progress...</span>}
            </p>
          </div>
        ))}
      </div>

      {sortedAndFilteredCandidates.length === 0 && (
        <p className="text-center text-slate-400 py-8">No candidates found.</p>
      )}
    </div>
  );
};

export default InterviewerDashboard;