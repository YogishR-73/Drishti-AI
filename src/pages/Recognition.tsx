import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  XCircle,
  Eye,
} from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import DemoModeBanner from '../components/DemoModeBanner';
import { useApp } from '../contexts/AppContext';
import { useVoice } from '../contexts/VoiceContext';
import { recognitionService, RecognitionError } from '../services/recognitionService';
import { historyService } from '../services/historyService';
import type { RecognitionResult } from '../types';

export default function Recognition() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { capturedImage, setCapturedImage, setCurrentResult, recognitionMode } = useApp();
  const { speak, announceError, triggerHaptic } = useVoice();

  const demoDenomParam = searchParams.get('demo');
  const isDemo = recognitionMode === 'demo' || Boolean(demoDenomParam);

  const [statusText, setStatusText] = useState('Initializing banknote analysis…');
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    async function processRecognition() {
      setIsProcessing(true);
      setError(null);

      try {
        if (demoDenomParam) {
          // Explicit sample note selected from Home dashboard quick demo grid
          const targetDenom = demoDenomParam;
          setStatusText(`Analyzing currency banknote [Demo: ${targetDenom}]…`);
          speak(`Demonstration mode for ${targetDenom}`);

          const result: RecognitionResult = await recognitionService.recognizeDemo(targetDenom);
          handleSuccess(result);
        } else if (capturedImage) {
          // User captured from Camera or uploaded an actual Banknote Image
          setStatusText('Extracting currency chromatic profile, color patterns, and features…');
          speak('Extracting banknote features and identifying denomination.');

          let result: RecognitionResult;
          if (isDemo) {
            result = await recognitionService.recognizeDemo(undefined, capturedImage);
          } else {
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            result = await recognitionService.recognizeImage(blob);
          }

          result.imageUrl = capturedImage;
          handleSuccess(result);
        } else {
          navigate('/home');
          return;
        }
      } catch (err: any) {
        setIsProcessing(false);

        let errorMsg = 'Unable to identify the currency clearly. Please try again.';
        if (err instanceof RecognitionError) {
          errorMsg = err.message;
        } else if (err?.message) {
          errorMsg = err.message;
        }

        setError({ message: errorMsg, code: err?.code });
        announceError(errorMsg);
      }
    }

    processRecognition();
  }, [capturedImage, isDemo, demoDenomParam, navigate, speak]);

  const handleSuccess = (result: RecognitionResult) => {
    setIsProcessing(false);
    // Persist to history
    historyService.addRecord(result);
    // Store in global app context
    setCurrentResult(result);
    // Navigate to Result screen
    navigate('/result');
  };

  const handleRetry = () => {
    hasExecutedRef.current = false;
    setError(null);
    setIsProcessing(true);
    setStatusText('Retrying analysis…');

    // Trigger re-run
    if (capturedImage) {
      navigate(0); // reload this screen
    } else {
      navigate('/scan');
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    speak('Recognition cancelled.');
    navigate('/home');
  };

  return (
    <Layout title="Identifying Banknote" showBack={false}>
      <div className="space-y-6 text-center">
        {isDemo && <DemoModeBanner />}

        {/* Center Analysis Area */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1b3a] border border-cyan-500/30 p-6 sm:p-10 shadow-2xl">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-6" role="status" aria-live="polite">
              {/* Image with laser scanning effect if photo available */}
              {capturedImage && (
                <div className="relative w-48 h-32 rounded-2xl overflow-hidden border border-cyan-400/40 mx-auto shadow-lg bg-black">
                  <img
                    src={capturedImage}
                    alt="Captured note undergoing AI classification"
                    className="w-full h-full object-cover opacity-80"
                  />
                  {/* Glowing Laser Scan Line Animation */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scanLine_2s_easeInOut_infinite]" />
                </div>
              )}

              {/* Glowing Pulse Ring Spinner */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-teal-400/20 border-b-teal-300 animate-spin" style={{ animationDirection: 'reverse' }} />
                <Eye className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white mb-2 tracking-wide">
                  Drishti AI Neural Engine
                </h2>
                <p className="text-sm font-semibold text-cyan-300 max-w-xs mx-auto leading-relaxed">
                  {statusText}
                </p>
              </div>

              <span className="text-xs text-gray-400 tracking-wide">
                Please wait • Spoken announcement will play on completion
              </span>
            </div>
          ) : error ? (
            /* Error / Uncertainty State */
            <div className="flex flex-col items-center justify-center space-y-4" role="alert">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-bold text-white">
                Recognition Unsuccessful
              </h2>

              <p className="text-sm text-amber-200 max-w-sm leading-relaxed font-medium">
                {error.message}
              </p>

              {/* Troubleshooting Tips */}
              <div className="text-left w-full max-w-sm bg-black/40 rounded-xl p-3 border border-white/10 text-xs text-gray-300 space-y-1">
                <span className="font-bold text-cyan-300 block mb-1">Helpful Tips:</span>
                <div>• Ensure the banknote is unfolded and clearly visible.</div>
                <div>• Increase ambient lighting to reduce glare and shadows.</div>
                <div>• In case of server unavailability, switch to Demo Mode.</div>
              </div>

              {/* Action buttons */}
              <div className="w-full max-w-sm space-y-2 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleRetry}
                  iconLeft={<RotateCcw className="w-5 h-5 text-gray-950" />}
                  className="font-extrabold text-gray-950 bg-gradient-to-r from-cyan-400 to-teal-400"
                >
                  Try Again
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleCancel}
                >
                  Scan Another Banknote
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Cancel button while running */}
        {isProcessing && (
          <Button
            variant="ghost"
            size="md"
            onClick={handleCancel}
            iconLeft={<XCircle className="w-5 h-5" />}
          >
            Cancel Analysis
          </Button>
        )}

        <style>{`
          @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
      </div>
    </Layout>
  );
}
