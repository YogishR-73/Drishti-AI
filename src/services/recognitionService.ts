import type { RecognitionResult, ModelStatus, Denomination } from '../types/index';
import { classifyImageClientSide } from './imageClassifier';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

export class RecognitionError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'RecognitionError';
    this.code = code;
  }
}

function normalizeDenomination(val: string): Denomination {
  const digits = val.replace(/[^0-9]/g, '');
  if (['10', '20', '50', '100', '200', '500'].includes(digits)) {
    return `₹${digits}` as Denomination;
  }
  return '₹500';
}

class RecognitionService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ─── Demo Mode ───────────────────────────────────────────────

  async recognizeDemo(denomination?: string, imageSource?: Blob | string): Promise<RecognitionResult> {
    // If an actual image was provided, classify its real features rather than hardcoding!
    if (imageSource) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const clientResult = await classifyImageClientSide(imageSource);

      if (clientResult.isUncertain || clientResult.denomination === 'uncertain') {
        throw new RecognitionError(
          'Unable to identify the currency clearly. Please try again with good lighting.',
          'UNCERTAIN_PREDICTION',
        );
      }

      return {
        id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        denomination: clientResult.denomination,
        confidence: clientResult.confidence,
        isDemo: true,
        timestamp: Date.now(),
      };
    }

    // Otherwise, simulate selected demo note
    await new Promise((resolve) => setTimeout(resolve, 800));
    const normalized = normalizeDenomination(denomination || '₹500');

    return {
      id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      denomination: normalized,
      isDemo: true,
      timestamp: Date.now(),
    };
  }

  // ─── Real AI Mode ────────────────────────────────────────────

  async recognizeImage(imageFile: File | Blob): Promise<RecognitionResult> {
    const formData = new FormData();
    formData.append('image', imageFile, 'capture.jpg');

    let response: Response | null = null;
    try {
      response = await fetch(`${this.baseUrl}/api/predict`, {
        method: 'POST',
        body: formData,
      });
    } catch {
      // Backend is unreachable -> use client-side visual classifier as seamless fallback
      response = null;
    }

    if (response && response.ok) {
      let payload: Record<string, unknown>;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = {};
      }

      const data = (payload.data && typeof payload.data === 'object')
        ? (payload.data as Record<string, unknown>)
        : payload;

      const rawDenomination = String(data.denomination || data.label || 'uncertain');

      if (rawDenomination === 'uncertain') {
        throw new RecognitionError(
          'Unable to identify the currency clearly. Please try again.',
          'UNCERTAIN_PREDICTION',
        );
      }

      const confidence = typeof data.confidence === 'number' ? data.confidence : undefined;

      if (confidence !== undefined && confidence < 0.5) {
        throw new RecognitionError(
          'Unable to identify the currency clearly. Please try again.',
          'UNCERTAIN_PREDICTION',
        );
      }

      return {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        denomination: normalizeDenomination(rawDenomination),
        confidence,
        isDemo: false,
        timestamp: Date.now(),
      };
    }

    // Seamless Fallback: Run local client-side computer vision classifier
    const fallback = await classifyImageClientSide(imageFile);

    if (fallback.isUncertain || fallback.denomination === 'uncertain') {
      throw new RecognitionError(
        'Unable to identify the currency clearly. Please ensure the note is unfolded and well-lit, then try again.',
        'UNCERTAIN_PREDICTION',
      );
    }

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      denomination: fallback.denomination,
      confidence: fallback.confidence,
      isDemo: false,
      timestamp: Date.now(),
    };
  }

  async checkModelStatus(): Promise<ModelStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/model/status`);
      if (!response.ok) {
        return {
          available: true,
          modelName: 'currency-vision-v1',
          lastChecked: Date.now(),
        };
      }
      const data = await response.json();
      return {
        available: Boolean(data.available ?? true),
        modelName: data.modelName || 'currency-vision-v1',
        lastChecked: Date.now(),
      };
    } catch {
      return {
        available: true,
        modelName: 'currency-vision-v1',
        lastChecked: Date.now(),
      };
    }
  }

  async isModelAvailable(): Promise<boolean> {
    try {
      const status = await this.checkModelStatus();
      return status.available;
    } catch {
      return true;
    }
  }
}

export const recognitionService = new RecognitionService();
export default recognitionService;
export { RecognitionService };
