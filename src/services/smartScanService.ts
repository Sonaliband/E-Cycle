/**
 * E-CYCLE Smart Scan Vision AI Client Service
 * Connects securely to the local backend AI vision API (/api/recognize-device).
 * Never exposes API keys in frontend code.
 */

export interface AIAnalysisResult {
  deviceName: string;
  category: string;
  description: string;
  isElectronic: boolean;
  isConfident: boolean;
  confidenceLevel: 'high' | 'medium' | 'low' | 'uncertain';
  suggestedAction: 'repair' | 'donate' | 'recycle';
  reason: string;
  safetyWarning: string | null;
  provider: string;
  uncertaintyNote?: string;
  method: 'ai-vision' | 'manual';
}

export const EWASTE_CATEGORIES = [
  'Smartphone',
  'Laptop',
  'Tablet',
  'Monitor',
  'Television',
  'Keyboard',
  'Mouse',
  'Printer',
  'Headphones',
  'Camera',
  'Cables & Chargers',
  'Extension Boards & Power Strips',
  'Batteries',
  'Small Appliance',
  'Other electronic devices',
] as const;

export type EwasteCategory = (typeof EWASTE_CATEGORIES)[number];

/**
 * Validates uploaded image file type and size.
 */
export function validateImageFile(file: File | Blob): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.type && !validTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Please upload a JPG, PNG, or WEBP image.`,
    };
  }

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB}MB). Maximum allowed image size is 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Converts a Blob to a base64 Data URL string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64.'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error during base64 conversion.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Calls the local backend Vision AI endpoint (/api/recognize-device)
 */
export async function recognizeDeviceWithBackend(
  imageBlob: Blob,
  filename?: string,
  onProgress?: (status: string) => void
): Promise<AIAnalysisResult> {
  onProgress?.('Preparing image for Vision AI analysis...');
  const base64Data = await blobToBase64(imageBlob);

  onProgress?.('Connecting to local E-Cycle Vision AI backend...');

  let response: Response;
  try {
    response = await fetch('/api/recognize-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: imageBlob.type || 'image/jpeg',
        clientHints: {
          filename: filename || '',
        },
      }),
    });
  } catch (netErr: any) {
    console.error('Network error calling backend vision API:', netErr);
    throw new Error(
      'Cannot connect to local AI backend. Please verify that the backend server is running ("npm run server") on localhost.'
    );
  }

  if (!response.ok) {
    let errDetail = 'Unknown backend error';
    try {
      const errJson = await response.json();
      errDetail = errJson.error || errDetail;
    } catch {
      errDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errDetail);
  }

  onProgress?.('Processing structured AI response...');
  const data = await response.json();

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return {
    deviceName: data.deviceName || 'Electronic Device',
    category: data.category || 'Other electronic devices',
    description: data.description || '',
    isElectronic: data.isElectronic !== false,
    isConfident: Boolean(data.isConfident),
    confidenceLevel: data.confidenceLevel || 'uncertain',
    suggestedAction: ['repair', 'donate', 'recycle'].includes(data.suggestedAction)
      ? data.suggestedAction
      : 'recycle',
    reason: data.reason || 'Assessed through circular e-waste guidelines.',
    safetyWarning: data.safetyWarning || null,
    provider: data.provider || 'local',
    uncertaintyNote: data.uncertaintyNote,
    method: 'ai-vision',
  };
}

/**
 * Camera controller with rear camera preference, graceful fallback, and resource cleanup.
 */
export class CameraController {
  private stream: MediaStream | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    this.stopCamera();

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (fallbackErr: any) {
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          throw new Error('No camera hardware found on your device. Please use file upload instead.');
        } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
          throw new Error('Camera is currently in use by another application. Please close it and retry.');
        } else {
          throw new Error(`Unable to start camera: ${fallbackErr.message || 'Unknown error'}`);
        }
      }
    }

    this.stream = stream;
    videoElement.srcObject = stream;

    await new Promise<void>((resolve) => {
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
        resolve();
      } else {
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(() => {});
          resolve();
        };
      }
    });

    return stream;
  }

  captureFrame(videoElement: HTMLVideoElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        reject(new Error('Camera preview is not ready or has zero dimensions.'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas 2D rendering context.'));
        return;
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            reject(new Error('Captured image is blank or zero bytes.'));
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        0.90
      );
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  isActive(): boolean {
    return !!this.stream && this.stream.active;
  }
}
