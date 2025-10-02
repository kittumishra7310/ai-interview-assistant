import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parseResume, generateQuestion, generateFinalSummary, evaluateAnswer } from '../services/geminiService';
import { db } from '../services/databaseService';
import type { Candidate, Question } from '../types';
import { InterviewStatus } from '../types';
import { INTERVIEW_QUESTIONS_CONFIG, TOTAL_QUESTIONS } from '../constants';
import { RobotIcon } from './icons/RobotIcon';
import { UserIcon } from './icons/UserIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { FileUploadIcon } from './icons/FileUploadIcon';
import { FeedbackIcon } from './icons/FeedbackIcon';


interface IntervieweeViewProps {
  currentInterview: Candidate | null;
  onUpdateInterview: (interview: Candidate) => void;
  onStartNewInterview: (interview: Candidate) => void;
}

const ResumeDropzone: React.FC<{
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}> = ({ onFileChange, onFileDrop, isLoading, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div 
        className="border-glow flex flex-col items-center justify-center p-6 rounded-2xl max-w-2xl mx-auto text-center shadow-2xl shadow-sky-900/20"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <div className={`relative w-full p-10 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-sky-400 bg-sky-900/30 scale-[1.02]' : 'border-slate-700'}`}>
        <div className="flex flex-col items-center text-center">
            <FileUploadIcon />
            <h2 className="text-2xl font-bold mt-4 mb-2 text-sky-300">Drag & Drop Your Resume</h2>
            <p className="text-slate-400 mb-6">or click to browse</p>
            <label htmlFor="resume-upload" className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer text-white border border-sky-500/30 ${isLoading ? 'bg-slate-700' : 'bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 shadow-md shadow-sky-500/20 scale-100 hover:scale-105'}`}>
              {isLoading ? <SpinnerIcon /> : <UploadIcon />}
              {isLoading ? 'Processing...' : 'Upload Resume'}
            </label>
            <input id="resume-upload" type="file" className="hidden" accept=".pdf,.docx" onChange={onFileChange} disabled={isLoading} />
        </div>
      </div>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};


const ChatMessage: React.FC<{ author: 'ai' | 'user'; children: React.ReactNode }> = ({ author, children }) => {
  const isAI = author === 'ai';
  return (
    <div className={`flex items-start gap-4 my-5 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isAI ? 'bg-gradient-to-br from-sky-600 to-cyan-500' : 'bg-slate-700'}`}>
        {isAI ? <RobotIcon /> : <UserIcon />}
      </div>
      <div className={`p-4 rounded-xl max-w-lg shadow-md ${isAI ? 'bg-gradient-to-br from-slate-800 to-slate-700/80 rounded-bl-none border border-slate-600/50' : 'bg-gradient-to-br from-sky-600 to-cyan-600 rounded-br-none'}`}>
        {children}
      </div>
    </div>
  );
};

const FeedbackMessage: React.FC<{ feedback: string; score: number }> = ({ feedback, score }) => {
    const scorePercentage = score * 10;
    const circumference = 2 * Math.PI * 18; // 2 * pi * radius
    const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

    const getScoreColor = () => {
        if (score >= 8) return 'text-green-400';
        if (score >= 5) return 'text-yellow-400';
        return 'text-red-400';
    }

    return (
        <div className="space-y-3">
             <div className="flex items-center gap-3">
                 <FeedbackIcon />
                <h4 className="font-bold text-sky-300">Answer Feedback</h4>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-900/40 rounded-lg border border-slate-700/50">
                <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 40 40">
                        <circle
                            className="text-slate-700"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="transparent"
                            r="18"
                            cx="20"
                            cy="20"
                        />
                        <circle
                            className={`transform -rotate-90 origin-center transition-all duration-1000 ${getScoreColor()}`}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="18"
                            cx="20"
                            cy="20"
                        />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${getScoreColor()}`}>
                        {score}
                        <span className="text-xs -mt-1">/10</span>
                    </span>
                </div>
                <p className="text-slate-300 text-sm whitespace-pre-wrap flex-grow">{feedback}</p>
            </div>
        </div>
    );
};

const Timer: React.FC<{ timeLeft: number; totalTime: number }> = ({ timeLeft, totalTime }) => {
    const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-300">Time Remaining</span>
                <span className="font-bold text-sky-300 font-mono tracking-wider">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-[width] duration-200 ease-linear bg-gradient-to-r ${percentage > 50 ? 'from-green-400 to-green-600' : percentage > 20 ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600'}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const PauseOverlay: React.FC<{ onResume: () => void }> = ({ onResume }) => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-fade-in rounded-2xl">
        <h3 className="text-2xl font-bold text-sky-300">Interview Paused</h3>
        <button
            onClick={onResume}
            className="mt-4 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 shadow-md shadow-sky-500/20"
        >
            Resume Interview
        </button>
    </div>
);

type InfoGatheringStep = 'name' | 'email' | 'phone';

const IntervieweeView: React.FC<IntervieweeViewProps> = ({ currentInterview, onUpdateInterview, onStartNewInterview }) => {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const answerRef = useRef('');
  const timerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const [infoGathering, setInfoGathering] = useState<{
      step: InfoGatheringStep | null;
      data: Partial<Pick<Candidate, 'name' | 'email' | 'phone' | 'resumeContent'>>;
      messages: Array<{ author: 'ai' | 'user'; children: React.ReactNode }>;
  }>({ step: null, data: {}, messages: [] });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [currentInterview?.answers, loadingMessage, infoGathering.messages]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSubmitAnswer = useCallback(async (isTimeout: boolean = false) => {
    if (!currentInterview || loadingMessage) return;
    stopTimer();
    
    const currentQIndex = currentInterview.currentQuestionIndex;
    const answerToSubmit = isTimeout ? "(Time ran out)" : answerRef.current;
    
    // Step 1: Save the user's text answer
    let updatedAnswers = [...currentInterview.answers];
    updatedAnswers[currentQIndex] = { ...updatedAnswers[currentQIndex], answer: answerToSubmit };

    let updatedInterview: Candidate = {
      ...currentInterview,
      answers: updatedAnswers,
      timeLeftOnQuestion: null,
    };
    onUpdateInterview(updatedInterview);
    
    // Step 2: Evaluate the answer
    setLoadingMessage('Evaluating answer...');
    const { feedback, score } = await evaluateAnswer(updatedAnswers[currentQIndex].question.text, answerToSubmit, currentInterview.resumeContent);
    
    // Step 3: Save the feedback and score
    updatedAnswers = [...updatedInterview.answers];
    updatedAnswers[currentQIndex] = { ...updatedAnswers[currentQIndex], feedback, score };

    updatedInterview = {
      ...updatedInterview,
      answers: updatedAnswers,
      currentQuestionIndex: currentQIndex + 1, // Move to next question *after* evaluation
    };
    onUpdateInterview(updatedInterview);
    
    // Step 4: Reset for next question
    setCurrentAnswer('');
    answerRef.current = '';
    setLoadingMessage(null);
  }, [currentInterview, loadingMessage, stopTimer, onUpdateInterview]);

  const startTimer = useCallback((duration: number) => {
    stopTimer();
    setTimeLeft(duration);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          handleSubmitAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, handleSubmitAnswer]);

  const runInterviewStep = useCallback(async (interview: Candidate) => {
    setLoadingMessage('Generating next question...');
    setError(null);
    try {
      if (interview.currentQuestionIndex >= TOTAL_QUESTIONS) {
        const { finalScore, summary } = await generateFinalSummary(interview.resumeContent, interview.answers);
        const finalInterview: Candidate = {
          ...interview,
          interviewStatus: InterviewStatus.Completed,
          finalScore,
          summary,
          timeLeftOnQuestion: null,
        };
        onUpdateInterview(finalInterview);
      } else {
        const config = INTERVIEW_QUESTIONS_CONFIG[interview.currentQuestionIndex];
        const questionText = await generateQuestion(interview.resumeContent, config.difficulty);
        const newQuestion: Question = {
          id: interview.currentQuestionIndex,
          text: questionText,
          ...config,
        };
        const updatedInterview: Candidate = {
          ...interview,
          timeLeftOnQuestion: config.timeLimit,
          answers: [
            ...interview.answers,
            { question: newQuestion, answer: '' },
          ],
        };
        onUpdateInterview(updatedInterview);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setLoadingMessage(null);
    }
  }, [onUpdateInterview]);

  useEffect(() => {
    if (currentInterview && currentInterview.interviewStatus === InterviewStatus.InProgress && !isPaused) {
        const currentQIndex = currentInterview.currentQuestionIndex;
        
        if(currentQIndex < currentInterview.answers.length && currentInterview.answers[currentQIndex].answer === '') {
             const time = currentInterview.timeLeftOnQuestion ?? currentInterview.answers[currentQIndex].question.timeLimit;
             startTimer(time);
        } 
        else if (currentQIndex >= currentInterview.answers.length && currentQIndex < TOTAL_QUESTIONS) {
            runInterviewStep(currentInterview);
        }
    } else {
        stopTimer();
    }
    return stopTimer;
  }, [currentInterview, runInterviewStep, startTimer, stopTimer, isPaused]);

  useEffect(() => {
    const handleBeforeUnload = () => {
        if (currentInterview && currentInterview.interviewStatus === InterviewStatus.InProgress && !isPaused) {
            const finalState = { ...currentInterview, timeLeftOnQuestion: timeLeftRef.current };
            const candidates = db.get<Candidate[]>('candidates') || [];
            const updatedCandidates = candidates.map(c => c.id === finalState.id ? finalState : c);
            
            db.set('currentInterview', finalState);
            db.set('candidates', updatedCandidates);
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentInterview, isPaused]);

  const handlePause = () => {
    if (!currentInterview) return;
    setIsPaused(true);
    stopTimer();
    onUpdateInterview({ ...currentInterview, timeLeftOnQuestion: timeLeft });
  };
  
  const handleResume = () => {
    setIsPaused(false);
  };

  const handleInfoSubmit = () => {
    if (!infoGathering.step || !currentAnswer.trim()) return;

    const userMessage = { author: 'user' as const, children: <p>{currentAnswer}</p> };
    const updatedData = { ...infoGathering.data, [infoGathering.step]: currentAnswer };
    setCurrentAnswer('');
    answerRef.current = '';

    const findNextStep = (data: typeof updatedData): InfoGatheringStep | null => {
        if (!data.name) return 'name';
        if (!data.email) return 'email';
        if (!data.phone) return 'phone';
        return null;
    }

    const nextStep = findNextStep(updatedData);
    
    if (nextStep) {
        const nextQuestion = { author: 'ai' as const, children: <p>Great, thank you. And what is your {nextStep}?</p> };
        setInfoGathering({ step: nextStep, data: updatedData, messages: [...infoGathering.messages, userMessage, nextQuestion] });
    } else {
        const finalMessage = { author: 'ai' as const, children: <p>Perfect, thank you! Let's begin the interview.</p> };
        setInfoGathering(prev => ({ ...prev, step: null, messages: [...prev.messages, userMessage, finalMessage] }));
        
        setTimeout(() => {
            const newCandidate: Candidate = {
              id: uuidv4(),
              name: updatedData.name || '',
              email: updatedData.email || '',
              phone: updatedData.phone || '',
              resumeContent: updatedData.resumeContent || '',
              interviewStatus: InterviewStatus.InProgress,
              answers: [],
              finalScore: null,
              summary: null,
              currentQuestionIndex: 0,
              timeLeftOnQuestion: null,
            };
            onStartNewInterview(newCandidate);
            setInfoGathering({ step: null, data: {}, messages: [] });
        }, 2000);
    }
  }

  const handleFile = async (file: File) => {
    if (!file) return;

    setLoadingMessage('Parsing resume...');
    setError(null);
    try {
      const { name, email, phone, resumeContent } = await parseResume(file);
      if (!resumeContent) throw new Error("Could not read resume content.");
      
      const initialData = { name, email, phone, resumeContent };
      const findNextStep = (data: typeof initialData): InfoGatheringStep | null => {
        if (!data.name) return 'name';
        if (!data.email) return 'email';
        if (!data.phone) return 'phone';
        return null;
      }

      const nextStep = findNextStep(initialData);

      if (nextStep) {
        setInfoGathering({
          step: nextStep,
          data: initialData,
          messages: [
            { author: 'ai', children: <p>Thanks for uploading your resume. I just need a little more information.</p> },
            { author: 'ai', children: <p>What is your full {nextStep}?</p> }
          ]
        });
      } else {
          const newCandidate: Candidate = {
            id: uuidv4(),
            name: name || '',
            email: email || '',
            phone: phone || '',
            resumeContent,
            interviewStatus: InterviewStatus.InProgress,
            answers: [],
            finalScore: null,
            summary: null,
            currentQuestionIndex: 0,
            timeLeftOnQuestion: null,
          };
          onStartNewInterview(newCandidate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  
  const handleFileDrop = (file: File) => {
    if (file) handleFile(file);
  };
  
  if (!currentInterview && infoGathering.step) {
    const placeholderText = `Enter your ${infoGathering.step}...`;
    return (
      <div className="border-glow rounded-2xl p-4 md:p-6 max-w-3xl mx-auto shadow-2xl shadow-sky-900/20">
        <div className="h-[60vh] overflow-y-auto pr-2 flex flex-col">
          {infoGathering.messages.map((msg, index) => (
            <ChatMessage key={index} author={msg.author}>{msg.children}</ChatMessage>
          ))}
           <div ref={chatEndRef} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex gap-4">
                <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInfoSubmit()}
                    placeholder={placeholderText}
                    className="flex-grow bg-slate-800/70 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                />
                <button 
                    onClick={handleInfoSubmit}
                    className="text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 shadow-md shadow-sky-500/20"
                >
                    Submit
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (!currentInterview) {
    return <ResumeDropzone onFileChange={handleFileChange} onFileDrop={handleFileDrop} isLoading={!!loadingMessage} error={error} />;
  }
  
  const isInterviewOver = currentInterview.interviewStatus === InterviewStatus.Completed;

  return (
    <div className="border-glow rounded-2xl p-4 md:p-6 max-w-3xl mx-auto relative shadow-2xl shadow-sky-900/20">
      {isPaused && <PauseOverlay onResume={handleResume} />}
      <div className="h-[60vh] overflow-y-auto pr-2 flex flex-col">
        {currentInterview.answers.map((item, index) => (
          <div key={item.question.id}>
            <ChatMessage author="ai">
                <p className="font-bold mb-2 text-sky-300">Question {index + 1}/{TOTAL_QUESTIONS} <span className="text-xs font-medium text-slate-300">({item.question.difficulty})</span></p>
                <p>{item.question.text}</p>
            </ChatMessage>
            {item.answer && (
              <>
                <ChatMessage author="user">
                    <p>{item.answer}</p>
                </ChatMessage>
              </>
            )}
          </div>
        ))}

        {loadingMessage && (
            <ChatMessage author="ai">
                <div className="flex items-center gap-2">
                    <SpinnerIcon />
                    <span>{loadingMessage}</span>
                </div>
            </ChatMessage>
        )}

        {isInterviewOver && (
            <ChatMessage author="ai">
                <div className="space-y-3">
                    <h3 className="font-bold text-xl text-sky-300">Interview Complete!</h3>
                    <p>Thank you for your time. Here is your final summary:</p>
                     <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700">
                        <p className="font-bold text-3xl text-sky-300 mb-2">{currentInterview.finalScore}%</p>
                        <p className="font-semibold text-slate-200">Summary & Feedback:</p>
                        <p className="text-slate-300 whitespace-pre-wrap mt-1">{currentInterview.summary}</p>
                    </div>
                </div>
            </ChatMessage>
        )}

        <div ref={chatEndRef} />
      </div>

      {!isInterviewOver && currentInterview.answers[currentInterview.currentQuestionIndex] && !loadingMessage && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
            <Timer timeLeft={timeLeft} totalTime={currentInterview.answers[currentInterview.currentQuestionIndex].question.timeLimit} />
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => {
                        setCurrentAnswer(e.target.value);
                        answerRef.current = e.target.value;
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                    placeholder="Type your answer here..."
                    className="flex-grow bg-slate-800/70 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    disabled={!!loadingMessage}
                />
                <div className="flex gap-4 justify-end">
                    <button 
                        onClick={handlePause}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600/50 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                        Pause
                    </button>
                    <button 
                        onClick={() => handleSubmitAnswer()}
                        className="text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 shadow-md shadow-sky-500/20"
                        disabled={!!loadingMessage}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default IntervieweeView;