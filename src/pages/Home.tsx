import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Volume2,
  VolumeX,
  History as HistoryIcon,
  Settings,
  HelpCircle,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import DemoModeBanner from '../components/DemoModeBanner';
import AccessibilityModeToggle from '../components/AccessibilityModeToggle';
import { useApp } from '../contexts/AppContext';
import { useVoice } from '../contexts/VoiceContext';
import { useSettings } from '../contexts/SettingsContext';
import { historyService } from '../services/historyService';
import type { HistoryRecord, Denomination } from '../types';

const SAMPLE_DENOMINATIONS: { value: Denomination; label: string; color: string }[] = [
  { value: '₹10', label: 'Ten Rupees (Brown)', color: 'from-amber-700 to-yellow-800' },
  { value: '₹20', label: 'Twenty Rupees (Green-Yellow)', color: 'from-lime-600 to-green-700' },
  { value: '₹50', label: 'Fifty Rupees (Cyan/Fluorescent)', color: 'from-teal-600 to-cyan-700' },
  { value: '₹100', label: 'One Hundred Rupees (Lavender)', color: 'from-indigo-600 to-violet-700' },
  { value: '₹200', label: 'Two Hundred Rupees (Bright Orange)', color: 'from-orange-600 to-amber-700' },
  { value: '₹500', label: 'Five Hundred Rupees (Stone Grey)', color: 'from-slate-600 to-emerald-800' },
];

export default function Home() {
  const navigate = useNavigate();
  const { recognitionMode, setRecognitionMode, isModelAvailable } = useApp();
  const { speak } = useVoice();
  const { settings } = useSettings();
  const [recentScans, setRecentScans] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    // Load recent scans
    const history = historyService.getHistory();
    setRecentScans(history.slice(0, 3));
    if (settings.accessibilityMode === 'voice') {
      speak('Drishti AI Home. Tap Scan Currency Note to scan with camera, or tap Push to Talk to speak a command.');
    }
  }, []);

  const handleStartDemoScan = (denom: Denomination) => {
    speak(`Demo scan selected for ${denom}`);
    navigate(`/recognition?demo=${encodeURIComponent(denom)}`);
  };

  const handleNavigateScan = () => {
    speak('Opening live camera scanner.');
    navigate('/scan');
  };

  const handleNavigateUpload = () => {
    speak('Opening image upload.');
    navigate('/upload');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="space-y-5">
        {/* Quick Accessibility Mode Switcher */}
        <AccessibilityModeToggle compact />

        {/* Hero Branding Card */}
        <section
          aria-label="Welcome and App Overview"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c2452] via-[#0b1f44] to-[#07132a] border border-cyan-500/20 p-6 shadow-xl shadow-cyan-950/40"
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Drishti Assistant
              </span>

              {/* Voice Status Pill */}
              <button
                onClick={() => speak(settings.voiceEnabled ? 'Voice assistance is active.' : 'Voice assistance is off.')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  settings.voiceEnabled
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
                aria-label={`Voice assistance is ${settings.voiceEnabled ? 'enabled' : 'disabled'}`}
              >
                {settings.voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Voice {settings.voiceEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Currency Recognition
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Recognize Currency. Hear the Value. Gain Independence.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Mode Selector Toggle */}
        <section aria-label="Recognition Engine Mode" className="rounded-2xl bg-[#0f2347]/60 border border-white/10 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Engine Mode</span>
            </div>

            {/* Mode switch */}
            <div className="flex rounded-xl bg-gray-900/90 p-1 border border-white/10" role="radiogroup" aria-label="Select recognition mode">
              <button
                role="radio"
                aria-checked={recognitionMode === 'demo'}
                onClick={() => {
                  setRecognitionMode('demo');
                  speak('Switched to Demo Mode.');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  recognitionMode === 'demo'
                    ? 'bg-amber-500 text-gray-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                DEMO MODE
              </button>
              <button
                role="radio"
                aria-checked={recognitionMode === 'real'}
                onClick={() => {
                  setRecognitionMode('real');
                  speak('Switched to Real AI Mode.');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  recognitionMode === 'real'
                    ? 'bg-cyan-500 text-gray-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                REAL AI
              </button>
            </div>
          </div>

          {/* Mode description & status */}
          {recognitionMode === 'demo' ? (
            <div className="flex items-start gap-2 pt-1 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Demo Mode Active:</strong> Allows instant testing of all 6 banknotes with full voice feedback without requiring the Python inference backend.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 pt-1 text-xs">
              {isModelAvailable ? (
                <div className="flex items-center gap-1.5 text-teal-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>AI Inference Backend Connected (FastAPI + CNN Service)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>AI Model service not connected. Demo Mode is available.</span>
                </div>
              )}
            </div>
          )}
        </section>

        {recognitionMode === 'demo' && <DemoModeBanner />}

        {/* Primary Action Buttons */}
        <section aria-label="Scan and Upload Actions" className="space-y-4">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={handleNavigateScan}
            iconLeft={<Camera className="w-7 h-7 text-gray-950" />}
            className="shadow-2xl shadow-cyan-500/20 py-5 text-xl font-extrabold text-gray-950 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 hover:from-cyan-300 hover:to-teal-300"
            aria-label="Scan Currency using live camera"
          >
            SCAN CURRENCY NOTE
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleNavigateUpload}
            iconLeft={<Upload className="w-6 h-6 text-cyan-400" />}
            className="py-4 font-bold border-cyan-500/30 hover:border-cyan-400 text-cyan-200"
            aria-label="Upload currency note image from device"
          >
            Upload Banknote Image
          </Button>
        </section>

        {/* Quick Demo Denomination Selector (always available in demo mode) */}
        {recognitionMode === 'demo' && (
          <section aria-label="Demo Denomination Selector" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-amber-400" />
                Quick Demo: Select Banknote
              </h2>
              <span className="text-xs text-amber-400/90 font-medium">Click any note to test</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SAMPLE_DENOMINATIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStartDemoScan(value)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0f2347] border border-cyan-500/30 hover:border-cyan-400 hover:bg-[#163569] active:scale-95 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  aria-label={`Test demo recognition for ${label}`}
                >
                  <span className="text-2xl font-black bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                    {value}
                  </span>
                  <span className="text-[11px] text-gray-300 font-medium mt-1">
                    {label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recent Scans Section */}
        <section aria-label="Recent Scans" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-cyan-400" />
              Recent Scans
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold focus:ring-1 focus:ring-cyan-400 rounded px-1"
              aria-label="View all recognition history"
            >
              View All
            </button>
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-2">
              {recentScans.map((record) => (
                <Card
                  key={record.id}
                  padding="sm"
                  onClick={() => {
                    speak(`Previous scan: ${record.denomination}`);
                    navigate('/result');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-lg font-black text-cyan-300">
                      {record.denomination}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          Indian Rupee Note
                        </span>
                        {record.isDemo && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            DEMO
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTime(record.timestamp)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(`This is a ${record.denomination.replace('₹', '')} rupees note.`);
                    }}
                    className="p-2.5 rounded-xl text-cyan-400 hover:bg-cyan-500/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={`Hear denomination ${record.denomination} aloud`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="md" className="text-center py-6 text-gray-400">
              <p className="text-sm font-medium">No previous scans yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                Tap 'Scan Currency Note' or try a quick demo note above.
              </p>
            </Card>
          )}
        </section>

        {/* Quick Accessibility Shortcuts */}
        <section aria-label="Help and Settings Shortcuts" className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#0f2347] border border-white/10 hover:border-cyan-500/30 text-left transition-colors focus:ring-2 focus:ring-cyan-400"
            aria-label="Open Settings"
          >
            <Settings className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Settings</div>
              <div className="text-[11px] text-gray-400">Voice & Display</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#0f2347] border border-white/10 hover:border-cyan-500/30 text-left transition-colors focus:ring-2 focus:ring-cyan-400"
            aria-label="Open Help & Guidance"
          >
            <HelpCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Help Guide</div>
              <div className="text-[11px] text-gray-400">Tips & Permissions</div>
            </div>
          </button>
        </section>
      </div>
    </Layout>
  );
}
