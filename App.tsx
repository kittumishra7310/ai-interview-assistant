import React, { useState, useEffect, useCallback } from 'react';
import IntervieweeView from './components/IntervieweeView';
import InterviewerDashboard from './components/InterviewerDashboard';
import WelcomeBackModal from './components/WelcomeBackModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Candidate } from './types';
import { InterviewStatus } from './types';
import { Tab } from './types';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Interviewee);
  const [candidates, setCandidates] = useLocalStorage<Candidate[]>('candidates', []);
  const [currentInterview, setCurrentInterview] = useLocalStorage<Candidate | null>('currentInterview', null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const unfinishedInterview = candidates.find(
      c => c.interviewStatus === InterviewStatus.InProgress
    );
    if (unfinishedInterview) {
        setCurrentInterview(unfinishedInterview);
        setShowWelcomeModal(true);
    }
  }, []); // Run only once on mount

  const handleStartNewInterview = useCallback(() => {
    if (currentInterview) {
      const updatedCandidates = candidates.map(c => 
        c.id === currentInterview.id ? { ...c, interviewStatus: InterviewStatus.Completed, finalScore: 0, summary: "Interview abandoned." } : c
      );
      setCandidates(updatedCandidates);
    }
    setCurrentInterview(null);
    setShowWelcomeModal(false);
  }, [candidates, currentInterview, setCandidates, setCurrentInterview]);

  const handleResumeInterview = useCallback(() => {
    setShowWelcomeModal(false);
  }, []);

  const updateCandidate = (updatedCandidate: Candidate) => {
    const newCandidates = candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c);
    if (!newCandidates.some(c => c.id === updatedCandidate.id)) {
      newCandidates.push(updatedCandidate);
    }
    setCandidates(newCandidates);
    if (updatedCandidate.id === currentInterview?.id) {
        setCurrentInterview(updatedCandidate);
    }
  };

  const startNewInterviewSession = (candidate: Candidate) => {
    setCurrentInterview(candidate);
    setCandidates([...candidates, candidate]);
  }

  return (
    <div className="min-h-screen text-slate-100">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-200" style={{ textShadow: '0 0 15px rgba(125, 211, 252, 0.3)' }}>
            AI Interview Assistant
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Your intelligent partner for conducting and managing technical interviews.</p>
        </header>

        <nav className="flex justify-center mb-10">
           <div className="relative flex p-1 bg-slate-800/60 rounded-xl backdrop-blur-sm border border-slate-700">
               <span
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-sky-500 transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(${activeTab === Tab.Interviewer ? '100%' : '0%'})` }}
              />
              <button
                  onClick={() => setActiveTab(Tab.Interviewee)}
                  className="px-8 py-2.5 rounded-md transition-colors duration-300 w-1/2 text-center font-semibold z-10 relative"
              >
                  Interviewee
              </button>
              <button
                  onClick={() => setActiveTab(Tab.Interviewer)}
                  className="px-8 py-2.5 rounded-md transition-colors duration-300 w-1/2 text-center font-semibold z-10 relative"
              >
                  Interviewer
              </button>
          </div>
        </nav>

        <main>
          {activeTab === Tab.Interviewee && (
            <IntervieweeView 
              currentInterview={currentInterview} 
              onUpdateInterview={updateCandidate}
              onStartNewInterview={startNewInterviewSession}
            />
          )}
          {activeTab === Tab.Interviewer && <InterviewerDashboard candidates={candidates} />}
        </main>
      </div>
      {showWelcomeModal && currentInterview && (
        <WelcomeBackModal
          candidateName={currentInterview.name}
          onContinue={handleResumeInterview}
          onStartNew={handleStartNewInterview}
        />
      )}
    </div>
  );
};

export default App;