import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHookOptions {
  language?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: SpeechRecognitionHookOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const hasSupport = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!hasSupport) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentFinal = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript((prev) => {
          const updated = prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim();
          if (options.onResult) options.onResult(updated);
          return updated;
        });
      }

      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Ignorable quiet pause
        return;
      }
      let errorMsg = 'Speech recognition failed.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied. Please allow microphone permissions.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error during speech recognition.';
      }
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [hasSupport, options.language]);

  const startListening = useCallback(() => {
    if (!hasSupport) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    setError(null);
    setInterimTranscript('');
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err: any) {
      console.warn('Start listening error:', err);
      // Already started or restarting
    }
  }, [hasSupport]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    hasSupport,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
