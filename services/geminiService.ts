import { GoogleGenAI, Type } from '@google/genai';
import type { Candidate, InterviewAnswer, Question } from '../types';
import { QuestionDifficulty } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const parseResume = async (file: File): Promise<Partial<Pick<Candidate, 'name' | 'email' | 'phone' | 'resumeContent'>>> => {
  try {
    const model = 'gemini-2.5-flash';
    const imagePart = await fileToGenerativePart(file);
    
    // We get the text from the resume first.
    const textResponse = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, {text: "Extract the text content from this resume."}] }
    });
    const resumeContent = textResponse.text;

    // Then we extract entities from the text.
    const response = await ai.models.generateContent({
        model,
        contents: `Extract the full name, email address, and phone number from the following resume text. If a field is missing, return null for it.\n\n${resumeContent}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Candidate's full name" },
                    email: { type: Type.STRING, description: "Candidate's email address" },
                    phone: { type: Type.STRING, description: "Candidate's phone number" }
                },
            },
        }
    });

    const parsedInfo = JSON.parse(response.text);
    return { ...parsedInfo, resumeContent };
  } catch (error) {
    console.error('Error parsing resume with Gemini:', error);
    throw new Error('Failed to parse resume. Please ensure it is a valid PDF or DOCX file.');
  }
};

export const generateQuestion = async (resumeContent: string, difficulty: QuestionDifficulty): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Based on the following resume for a full stack (React/Node) developer role, generate one ${difficulty.toLowerCase()} technical interview question. The question must be directly related to the skills or experiences listed in the resume.

        Resume:
        ---
        ${resumeContent}
        ---
        
        Generate only the question text.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error('Error generating question:', error);
        return "Can you describe a challenging project you worked on using React and Node.js?"; // Fallback question
    }
};

export const evaluateAnswer = async (question: string, answer: string, resumeContent: string): Promise<{ feedback: string; score: number }> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `You are an expert technical interviewer evaluating a candidate's answer for a full stack (React/Node) role.
        
        Candidate's Resume Context:
        ---
        ${resumeContent}
        ---

        Interview Question:
        ---
        ${question}
        ---

        Candidate's Answer:
        ---
        ${answer || '(No answer provided.)'}
        ---

        Based on the resume context, question, and answer, please provide:
        1. A score for this specific answer on a scale of 0 to 10.
        2. Brief, constructive feedback (2-3 sentences) on the answer's technical accuracy, clarity, and depth. Explain the reasoning for your score.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score for the answer (0-10)" },
                        feedback: { type: Type.STRING, description: "Constructive feedback on the answer." }
                    },
                    required: ["score", "feedback"],
                },
            }
        });

        const result = JSON.parse(response.text);
        // Ensure score is within bounds
        result.score = Math.max(0, Math.min(10, result.score));
        return result;
    } catch (error) {
        console.error('Error evaluating answer:', error);
        return { score: 0, feedback: "Could not evaluate the answer due to an error." };
    }
};

export const generateFinalSummary = async (resumeContent: string, answers: InterviewAnswer[]): Promise<Pick<Candidate, 'finalScore' | 'summary'>> => {
    try {
        const model = 'gemini-2.5-flash';
        
        const totalPossibleScore = answers.length * 10;
        const totalCandidateScore = answers.reduce((acc, a) => acc + (a.score || 0), 0);
        // Avoid division by zero
        const finalScore = totalPossibleScore > 0 ? Math.round((totalCandidateScore / totalPossibleScore) * 100) : 0;
        
        const transcript = answers.map(a => 
            `Q: ${a.question.text}\nScore: ${a.score}/10\nFeedback: ${a.feedback}\nA: ${a.answer || '(No answer provided.)'}`
        ).join('\n\n---\n\n');

        const prompt = `You are an expert technical interviewer reviewing a candidate's performance for a full stack (React/Node) role.
        Based on the candidate's resume and the entire interview transcript (which includes per-question scores and feedback), provide a final, concise summary of their performance. 
        
        The summary should highlight their overall strengths, weaknesses, and suitability for the role, drawing conclusions from the patterns in their answers and scores. Do not just repeat the individual feedback. Synthesize it into a final verdict.

        Resume Context:
        ---
        ${resumeContent}
        ---

        Interview Transcript with Scores & Feedback:
        ---
        ${transcript}
        ---
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "Detailed summary and feedback on strengths and weaknesses." }
                    },
                    required: ["summary"],
                },
            }
        });

        const result = JSON.parse(response.text);

        return { finalScore, summary: result.summary };
    } catch (error) {
        console.error('Error generating summary:', error);
        return { finalScore: 0, summary: "Could not generate a final summary due to an error." };
    }
};