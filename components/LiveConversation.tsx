

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { t, Language } from '../localization/i18n';
import { decode, encode, decodeAudioData, createBlob } from '../utils';

interface LiveConversationProps {
  language: Language;
  addLog: (message: string) => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface TranscriptionTurn {
  id: number;
  user: string;
  model: string;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ language, addLog }) => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionTurn[]>([]);
  
  const currentUserInputRef = useRef('');
  const currentModelOutputRef = useRef('');
  const [displayedUserInput, setDisplayedUserInput] = useState('');
  const [displayedModelOutput, setDisplayedModelOutput] = useState('');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close().catch(console.error);
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(console.error);
      outputAudioContextRef.current = null;
    }
    
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();

    nextStartTimeRef.current = 0;
  }, []);

  const stopConversation = useCallback(async () => {
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {
        console.error("Error closing session:", e);
      } finally {
        sessionPromiseRef.current = null;
      }
    }
    cleanup();
    setStatus('disconnected');
  }, [cleanup]);
  
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  const startConversation = async () => {
    setStatus('connecting');
    setError(null);
    setTranscriptionHistory([]);
    currentUserInputRef.current = '';
    currentModelOutputRef.current = '';
    setDisplayedUserInput('');
    setDisplayedModelOutput('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentModelOutputRef.current += text;
              setDisplayedModelOutput(currentModelOutputRef.current);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentUserInputRef.current += text;
              setDisplayedUserInput(currentUserInputRef.current);
            }

            if (message.serverContent?.turnComplete) {
              const fullInput = currentUserInputRef.current;
              const fullOutput = currentModelOutputRef.current;

              setTranscriptionHistory(prev => [
                ...prev,
                { id: Date.now(), user: fullInput, model: fullOutput }
              ]);
              currentUserInputRef.current = '';
              currentModelOutputRef.current = '';
              setDisplayedUserInput('');
              setDisplayedModelOutput('');
            }
            
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64EncodedAudioString && outputAudioContextRef.current) {
                const outputAudioContext = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
                
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                
                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(source => source.stop());
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            setError(e.message);
            setStatus('error');
            cleanup();
          },
          onclose: (e: CloseEvent) => {
            setStatus('disconnected');
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: t('geminiPrompts.liveSystemInstruction', language),
        },
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('permission denied')) {
        setError(t('liveConversation.micPermission', language));
      } else {
        setError(message);
      }
      setStatus('error');
      cleanup();
    }
  };

  const getStatusText = () => {
    switch (status) {
        case 'idle': return t('liveConversation.status.idle', language);
        case 'connecting': return t('liveConversation.status.connecting', language);
        case 'connected': return t('liveConversation.status.connected', language);
        case 'disconnected': return t('liveConversation.status.disconnected', language);
        case 'error': return `${t('liveConversation.status.error', language)}: ${error || ''}`;
    }
  };

  const isConversationActive = status === 'connecting' || status === 'connected';

  return (
    <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-300">{t('liveConversation.title', language)}</h4>
        
        <div className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700 rounded-md">
            <button
                onClick={isConversationActive ? stopConversation : startConversation}
                className={`w-full font-semibold py-2 px-4 rounded-md transition-all text-sm ${isConversationActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'}`}
            >
                {isConversationActive ? t('liveConversation.stop', language) : t('liveConversation.start', language)}
            </button>
            <div className="text-xs font-mono text-slate-400 whitespace-nowrap">{getStatusText()}</div>
        </div>

        <div className="space-y-3">
            <div className="h-48 bg-black/20 border border-fuchsia-900/50 rounded-lg p-3 overflow-y-auto text-sm flex flex-col-reverse">
                <div className="space-y-4">
                    {displayedUserInput || displayedModelOutput ? (
                        <div>
                             {displayedUserInput && <p><strong className="text-cyan-400">{t('liveConversation.user', language)}:</strong> {displayedUserInput}</p>}
                             {displayedModelOutput && <p><strong className="text-fuchsia-400">{t('liveConversation.model', language)}:</strong> {displayedModelOutput}</p>}
                        </div>
                    ) : null}
                    {transcriptionHistory.slice().reverse().map((turn) => (
                        <div key={turn.id}>
                            <p><strong className="text-cyan-400">{t('liveConversation.user', language)}:</strong> {turn.user}</p>
                            <p><strong className="text-fuchsia-400">{t('liveConversation.model', language)}:</strong> {turn.model}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default LiveConversation;