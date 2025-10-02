import React from 'react';

interface WelcomeBackModalProps {
  candidateName: string;
  onContinue: () => void;
  onStartNew: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({ candidateName, onContinue, onStartNew }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="border-glow rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl shadow-sky-900/20">
        <h2 className="text-2xl font-bold text-sky-300 mb-4">Welcome Back!</h2>
        <p className="text-slate-300 mb-8">
          We found an in-progress interview for <span className="font-semibold text-white">{candidateName}</span>.
          Would you like to continue or start a new one?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onStartNew}
            className="px-6 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white transition-all duration-300 hover:scale-105"
          >
            Start New
          </button>
          <button
            onClick={onContinue}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 shadow-md shadow-sky-500/20"
          >
            Resume Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackModal;