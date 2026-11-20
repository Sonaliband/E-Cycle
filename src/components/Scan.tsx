import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  Check,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Info,
  ScanLine,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  X,
  Server,
  Zap,
} from 'lucide-react';
import {
  db,
  uid,
  recommend,
  categories,
  type Device,
  type State,
  type Action,
} from '../store';
import {
  validateImageFile,
  recognizeDeviceWithBackend,
  CameraController,
  type AIAnalysisResult,
} from '../services/smartScanService';
import {
  fetchRecommendation,
  fetchPriceEstimate,
  type RecommendationData,
  type PriceEstimateData,
} from '../services/apiService';

// Reference to service styling metadata
const serviceInfo: Record<
  Action,
  { title: string; subtitle: string; color: string }
> = {
  repair: {
    title: 'Repair',
    subtitle: 'Restore its potential',
    color: '#3B82F6',
  },
  donate: {
    title: 'Donate',
    subtitle: 'Pass it forward',
    color: '#10B981',
  },
  recycle: {
    title: 'Recycle',
    subtitle: 'Close the loop',
    color: '#0D9488',
  },
};

interface ScanProps {
  useApp: () => {
    state: State;
    update: (fn: (s: State) => State) => void;
    toast: (msg: string) => void;
  };
}

export function Scan({ useApp }: ScanProps) {
  const { state, update, toast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const existing = state.devices.find((item) => item.id === params.get('device'));

  const draftDevice = (): Device => ({
    id: uid('DV'),
    name: '',
    category: 'Smartphone',
    brand: '',
    model: '',
    age: 2,
    condition: 'Good',
    issue: '',
    pincode: '400066',
    locality: 'Borivali',
    createdAt: Date.now(),
    working: true,
    powersOn: true,
    damage: false,
    battery: false,
    swollen: false,
    missing: false,
    usable: true,
    repairCost: 0,
    replacementValue: 0,
  });

  const [d, setD] = useState<Device>(existing || draftDevice());
  const [stage, setStage] = useState(existing ? 2 : 0);
  const [preview, setPreview] = useState<string>('');
  const [uploadedBlob, setUploadedBlob] = useState<Blob | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>('');

  // AI Analysis state
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [recognitionError, setRecognitionError] = useState('');
  const [method, setMethod] = useState<'ai-vision' | 'manual'>('manual');

  // Module 3 & 6: Recommendation & Price Estimation State
  const [recData, setRecData] = useState<RecommendationData | null>(null);
  const [priceData, setPriceData] = useState<PriceEstimateData | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Camera state
  const [cam, setCam] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);

  const set = (k: keyof Device, v: any) => setD((p) => ({ ...p, [k]: v }));

  const loadAIRecommendationAndPricing = async (deviceToAnalyze: Device = d) => {
    setRecLoading(true);
    try {
      const [rec, price] = await Promise.all([
        fetchRecommendation({
          category: deviceToAnalyze.category,
          age: deviceToAnalyze.age,
          condition: deviceToAnalyze.condition,
          damage: deviceToAnalyze.issue,
          repairCost: deviceToAnalyze.repairCost,
          replacementValue: deviceToAnalyze.replacementValue,
          swollen: deviceToAnalyze.swollen,
          batteryIssues: deviceToAnalyze.battery,
          powersOn: deviceToAnalyze.powersOn,
          missingParts: deviceToAnalyze.missing,
          working: deviceToAnalyze.working,
        }),
        fetchPriceEstimate({
          category: deviceToAnalyze.category,
          brand: deviceToAnalyze.brand,
          model: deviceToAnalyze.model,
          age: deviceToAnalyze.age,
          condition: deviceToAnalyze.condition,
          working: deviceToAnalyze.working,
          powersOn: deviceToAnalyze.powersOn,
          damage: deviceToAnalyze.issue,
        }),
      ]);
      setRecData(rec);
      setPriceData(price);
    } catch (e) {
      console.warn('Backend recommendation/price fetch error:', e);
    } finally {
      setRecLoading(false);
    }
  };

  // Load photo preview when photoId changes
  useEffect(() => {
    if (!d.photoId) {
      setPreview('');
      setUploadedBlob(null);
      return;
    }
    let isCancelled = false;
    let url = '';

    db.photos.get(d.photoId).then((p) => {
      if (p && !isCancelled) {
        setUploadedBlob(p.data);
        url = URL.createObjectURL(p.data);
        setPreview(url);
      }
    });

    return () => {
      isCancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [d.photoId]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.stopCamera();
      }
    };
  }, []);

  // Handle file upload with strict validation
  const handleUpload = async (file?: File | Blob, filename?: string) => {
    if (!file) return;

    setUploadError('');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      toast(validation.error || 'Upload error');
      return;
    }

    try {
      const id = uid('IMG');
      await db.photos.put({ id, data: file });
      setUploadedBlob(file);
      setOriginalFilename(filename || (file instanceof File ? file.name : 'camera-capture.jpg'));
      setD((p) => ({ ...p, photoId: id }));
      setAiResult(null);
      setRecognitionError('');
      setMethod('manual');
      setStage(1);
      stopCam();
    } catch {
      toast('Failed to save image. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleUpload(file, file.name);
    }
  };

  // Camera Management
  const openCamera = async () => {
    setCam(true);
    setCamLoading(true);
    setCamReady(false);
    setUploadError('');

    try {
      if (!cameraControllerRef.current) {
        cameraControllerRef.current = new CameraController();
      }

      setTimeout(async () => {
        if (!videoRef.current) return;
        try {
          await cameraControllerRef.current!.startCamera(videoRef.current);
          setCamLoading(false);
          setCamReady(true);
        } catch (err: any) {
          setCam(false);
          setCamLoading(false);
          toast(err.message || 'Camera error');
        }
      }, 60);
    } catch (err: any) {
      setCam(false);
      setCamLoading(false);
      toast(err.message || 'Camera access error');
    }
  };

  const stopCam = () => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.stopCamera();
    }
    setCam(false);
    setCamLoading(false);
    setCamReady(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !cameraControllerRef.current) return;
    try {
      const blob = await cameraControllerRef.current.captureFrame(videoRef.current);
      await handleUpload(blob, 'camera-capture.jpg');
    } catch (err: any) {
      toast(err.message || 'Failed to capture photo from camera');
    }
  };

  // Call Local AI Vision Backend
  const assessImageWithAI = async () => {
    if (!uploadedBlob) {
      toast('No image found to analyze. Please upload a photo.');
      return;
    }

    setLoading(true);
    setRecognitionError('');
    setLoadingStatus('Connecting to AI Vision service...');

    try {
      const result = await recognizeDeviceWithBackend(
        uploadedBlob,
        originalFilename,
        (status) => setLoadingStatus(status)
      );

      setAiResult(result);
      setMethod('ai-vision');

      if (result.isConfident) {
        setD((prev) => ({
          ...prev,
          name: result.deviceName || prev.name,
          category: result.category || prev.category,
          issue: result.description ? `${result.description}${prev.issue ? ' · ' + prev.issue : ''}` : prev.issue,
        }));
        toast(`Identified as ${result.deviceName} (${result.category})`);
      } else {
        // When uncertain, allow user to confirm or choose category
        if (result.deviceName && result.deviceName !== 'Unidentified Item') {
          setD((prev) => ({
            ...prev,
            name: prev.name || result.deviceName,
            category: result.category || prev.category,
          }));
        }
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setRecognitionError(
        err.message || 'Vision AI service is currently unavailable. Please verify category manually.'
      );
      setMethod('manual');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  // Complete and save scan
  const finish = async () => {
    const rec = recommend(d);
    const saved: Device = {
      ...d,
      name: d.name.trim() || `${d.category} device`,
      recommended: rec.action,
      reason: rec.reason,
    };

    // Update state devices without duplicates
    update((s) => ({
      ...s,
      devices: [saved, ...s.devices.filter((x) => x.id !== saved.id)],
      notifications: [
        `Smart Scan saved for ${saved.name} (${saved.category})`,
        ...s.notifications,
      ],
    }));

    // Save scan record in Dexie db
    await db.scans.put({
      id: uid('SC'),
      deviceId: saved.id,
      category: saved.category,
      method,
      isConfident: aiResult ? aiResult.isConfident : true,
      notes: aiResult?.description || 'Saved from Smart Scan',
      at: Date.now(),
    });

    toast('Scan saved! Proceeding to partner matching.');
    navigate('/allocation?device=' + saved.id);
  };

  const recResult = recommend(d);

  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">FLAGSHIP FEATURE / SMART SCAN</div>
          <h1>Scan it. Understand it.</h1>
          <p>AI-assisted e-waste identification, safety assessment, and circular routing.</p>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="scan-stepper">
        {['Upload device', 'Identify category', 'Assess condition', 'Your recommendation'].map(
          (stepTitle, idx) => (
            <div
              key={stepTitle}
              className={
                'stepper-item ' +
                (stage === idx ? 'current' : stage > idx ? 'finished' : '')
              }
              onClick={() => {
                if (stage > idx) setStage(idx);
              }}
              style={{ cursor: stage > idx ? 'pointer' : 'default' }}
            >
              <span>{stage > idx ? <Check size={14} /> : idx + 1}</span>
              {stepTitle}
            </div>
          )
        )}
      </div>

      <div className="scan-layout">
        <div className="panel scan-workspace">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1: UPLOAD */}
              {stage === 0 && (
                <>
                  <div className="inner-heading">
                    <span>STEP 01 / UPLOAD</span>
                    <h2>Meet your device.</h2>
                    <p>
                      Upload a photo of your electronic item, cable, extension board, charger, or hardware.
                    </p>
                  </div>

                  {uploadError && (
                    <div
                      className="warning"
                      style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <AlertTriangle size={18} />
                      <span>{uploadError}</span>
                      <button
                        onClick={() => setUploadError('')}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  <label
                    className={`upload-zone ${isDragging ? 'is-dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      borderColor: isDragging ? '#10b981' : undefined,
                      backgroundColor: isDragging ? '#ecfdf5' : undefined,
                    }}
                  >
                    <div className="upload-zone-icon">
                      <Upload size={29} />
                    </div>
                    <h3>Drop your device photo here</h3>
                    <p>or click to browse (Laptops, Phones, Cables, Extension Boards, Chargers, etc.)</p>
                    <span>
                      Choose photo <ArrowUpRight size={15} />
                    </span>
                    <small>JPG, PNG, WEBP • Max 10MB • Processed securely via local backend</small>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, file.name);
                      }}
                    />
                  </label>

                  <button className="camera-btn" onClick={openCamera}>
                    <Camera size={19} /> Use your camera instead
                  </button>

                  {/* Camera Modal */}
                  {cam && (
                    <div className="camera-modal">
                      <div
                        style={{
                          position: 'relative',
                          backgroundColor: '#0c2a21',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          minHeight: '220px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {camLoading && (
                          <div style={{ color: '#9cf0c8', textAlign: 'center', padding: '20px' }}>
                            <RefreshCw className="spin" size={28} style={{ margin: '0 auto 10px' }} />
                            <p style={{ margin: 0, fontSize: '12px' }}>Initializing camera preview...</p>
                          </div>
                        )}
                        <video
                          autoPlay
                          playsInline
                          muted
                          ref={videoRef}
                          style={{
                            width: '100%',
                            maxHeight: '320px',
                            display: camLoading ? 'none' : 'block',
                            borderRadius: '12px',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-primary"
                          onClick={capturePhoto}
                          disabled={!camReady || camLoading}
                        >
                          <Camera size={17} /> Capture Photo
                        </button>
                        <button className="btn btn-secondary" onClick={stopCam}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: IDENTIFY */}
              {stage === 1 && (
                <>
                  <div className="inner-heading">
                    <span>STEP 02 / IDENTIFY</span>
                    <h2>AI Device Recognition</h2>
                    <p>
                      Vision AI analyzes hardware features, connectors, cables, and components with manual verification.
                    </p>
                  </div>

                  <div className="scan-photo-area">
                    {preview ? (
                      <img src={preview} alt="Uploaded device" className="photo-view" />
                    ) : (
                      <div className="photo-placeholder">
                        <Smartphone size={33} />
                      </div>
                    )}
                    <div className="scan-overlay-line" />
                  </div>

                  <div className="scan-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      className="btn btn-primary"
                      onClick={assessImageWithAI}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="spin" size={17} /> {loadingStatus || 'Analyzing device...'}
                        </>
                      ) : (
                        <>
                          Run Vision AI Recognition <Sparkles size={17} />
                        </>
                      )}
                    </button>
                    <button
                      className="plain-btn"
                      onClick={() => {
                        setD((p) => ({ ...p, photoId: undefined }));
                        setStage(0);
                      }}
                    >
                      Replace photo
                    </button>
                  </div>

                  {/* Backend Error / Missing Key Notice */}
                  {recognitionError && (
                    <div
                      className="warning"
                      style={{
                        margin: '14px 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <strong>AI Recognition Notice:</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '11px' }}>{recognitionError}</p>
                        <small style={{ color: '#6b7280', display: 'block', marginTop: '6px' }}>
                          You can easily choose the device category using the quick buttons below.
                        </small>
                      </div>
                    </div>
                  )}

                  {/* AI Result Card */}
                  {aiResult && (
                    <div
                      style={{
                        margin: '16px 0',
                        borderRadius: '12px',
                        border: aiResult.isConfident ? '1.5px solid #a7f3d0' : '1.5px solid #fde68a',
                        backgroundColor: aiResult.isConfident ? '#f0fdf4' : '#fffbeb',
                        padding: '18px 20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: aiResult.isConfident ? '#10b981' : '#f59e0b',
                              }}
                            />
                            <strong style={{ fontSize: '14px', color: '#111827' }}>
                              {aiResult.isConfident ? aiResult.deviceName : 'Unable to identify reliably'}
                            </strong>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: aiResult.isConfident ? '#dcfce7' : '#fef3c7',
                              color: aiResult.isConfident ? '#166534' : '#92400e',
                            }}
                          >
                            {aiResult.confidenceLevel === 'high'
                              ? 'High Confidence'
                              : aiResult.confidenceLevel === 'medium'
                              ? 'Moderate Confidence'
                              : 'Uncertain / Verification Required'}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Server size={12} /> {aiResult.provider.toUpperCase()}
                        </span>
                      </div>

                      {aiResult.description && (
                        <p style={{ margin: '10px 0 6px', fontSize: '11px', color: '#374151', lineHeight: 1.5 }}>
                          {aiResult.description}
                        </p>
                      )}

                      {aiResult.suggestedAction && (
                        <div style={{ fontSize: '11px', color: '#047857', marginTop: '8px' }}>
                          <strong>Suggested next step: </strong>
                          <span style={{ textTransform: 'capitalize' }}>{aiResult.suggestedAction}</span> — {aiResult.reason}
                        </div>
                      )}

                      {aiResult.safetyWarning && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <AlertTriangle size={15} />
                          <span>{aiResult.safetyWarning}</span>
                        </div>
                      )}

                      {!aiResult.isConfident && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#92400e' }}>
                          <Info size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          The AI model was uncertain about this item. Please confirm or select the correct category below.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category confirmation & selection chips */}
                  <div style={{ margin: '18px 0 10px' }}>
                    <label className="form-field">
                      <span>Confirm device category</span>
                      <select
                        value={d.category}
                        onChange={(e) => {
                          set('category', e.target.value);
                          setMethod('manual');
                        }}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Quick Category Chips for Fast Manual Correction */}
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                        Quick Select:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {categories.map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => {
                              set('category', cat);
                              setMethod('manual');
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: d.category === cat ? '1.5px solid #10b981' : '1px solid #e5e7eb',
                              backgroundColor: d.category === cat ? '#ecfdf5' : '#ffffff',
                              color: d.category === cat ? '#047857' : '#4b5563',
                              fontSize: '11px',
                              fontWeight: d.category === cat ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="form-field" style={{ marginTop: '16px' }}>
                    <span>Device / item name</span>
                    <input
                      value={d.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Electrical Extension Board, VGA Display Cable, Lenovo ThinkPad"
                    />
                  </label>

                  <div style={{ marginTop: '22px' }}>
                    <button className="btn btn-primary" onClick={() => setStage(2)}>
                      Continue to assessment <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3: ASSESS CONDITION */}
              {stage === 2 && (
                <>
                  <div className="inner-heading">
                    <span>STEP 03 / ASSESS</span>
                    <h2>Tell us how it's doing.</h2>
                    <p>A few details help us recommend a responsible, economical next step.</p>
                  </div>

                  <div className="form-grid">
                    <label className="form-field">
                      <span>Approximate age (years)</span>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={d.age}
                        onChange={(e) => set('age', Number(e.target.value))}
                      />
                    </label>

                    <label className="form-field">
                      <span>Condition</span>
                      <select
                        value={d.condition}
                        onChange={(e) => set('condition', e.target.value)}
                      >
                        {['Like New', 'Good', 'Fair', 'Poor', 'Non-working'].map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Estimated repair cost (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={d.repairCost}
                        onChange={(e) => set('repairCost', Number(e.target.value))}
                      />
                    </label>

                    <label className="form-field">
                      <span>Replacement value (₹, optional)</span>
                      <input
                        type="number"
                        min="0"
                        value={d.replacementValue}
                        onChange={(e) => set('replacementValue', Number(e.target.value))}
                      />
                    </label>

                    <label className="form-field">
                      <span>Locality</span>
                      <input
                        value={d.locality}
                        onChange={(e) => set('locality', e.target.value)}
                      />
                    </label>

                    <label className="form-field">
                      <span>Pincode</span>
                      <input
                        value={d.pincode}
                        onChange={(e) => set('pincode', e.target.value)}
                        maxLength={6}
                      />
                    </label>
                  </div>

                  <div className="toggles">
                    {(
                      [
                        ['working', 'Is the device working?'],
                        ['powersOn', 'Does the device power on / transmit signal?'],
                        ['damage', 'Casing, wiring or body damaged?'],
                        ['battery', 'Battery problems?'],
                        ['swollen', 'Swollen battery / hazardous parts?'],
                        ['missing', 'Essential parts / pins missing?'],
                        ['usable', 'Still suitable for everyday use?'],
                      ] as [keyof Device, string][]
                    ).map(([k, label]) => (
                      <label className="toggle-row" key={k}>
                        <span>{label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(d[k])}
                          onChange={(e) => set(k, e.target.checked)}
                        />
                        <span className="toggle-ui" />
                      </label>
                    ))}
                  </div>

                  <label className="form-field">
                    <span>Describe the issue / reason for disposal</span>
                    <textarea
                      rows={3}
                      value={d.issue}
                      onChange={(e) => set('issue', e.target.value)}
                      placeholder="Details regarding functionality, cable wear, loose sockets, or component history..."
                    />
                  </label>

                  <div className="form-action-row" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setStage(1)}>
                      Back
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setStage(3);
                        loadAIRecommendationAndPricing();
                      }}
                    >
                      See recommendation <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              )}

              {/* STEP 4: RECOMMENDATION & VALUATION */}
              {stage === 3 && (
                <>
                  <div className="inner-heading">
                    <span>STEP 04 / RECOMMENDATION & ESTIMATED VALUE</span>
                    <h2>Your next best step.</h2>
                    <p>Explainable circular guidance and algorithmic valuation grounded in real device attributes.</p>
                  </div>

                  {recLoading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#0f3d2e' }}>
                      <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontWeight: 600 }}>Analyzing device circularity & market valuation...</p>
                      <small style={{ color: '#64748b' }}>Applying deterministic safety checks and repairability rules</small>
                    </div>
                  ) : (
                    <>
                      {/* AI Recommendation Banner */}
                      <div className="recommendation-result">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="rec-overline">
                            <Sparkles size={16} /> RECOMMENDED CIRCULAR PATH
                          </span>
                          {recData?.source && (
                            <span style={{ fontSize: '10.5px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {recData.source}
                            </span>
                          )}
                        </div>
                        <div
                          className="rec-big"
                          style={{
                            color:
                              serviceInfo[
                                (recData?.recommendedAction === 'specialist_assessment'
                                  ? 'recycle'
                                  : recData?.recommendedAction || recResult.action) as Action
                              ]?.color || '#10B981',
                          }}
                        >
                          <strong>{recData?.actionTitle || serviceInfo[recResult.action].title}</strong>
                        </div>
                        <p style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '8px' }}>
                          {recData?.explanation || recResult.reason}
                        </p>

                        {recData?.alternativeAction && (
                          <div style={{ marginTop: '10px', fontSize: '12px', color: '#047857' }}>
                            <strong>Secondary alternative: </strong> {recData.alternativeAction}
                          </div>
                        )}
                      </div>

                      {/* Safety Alert (Hazardous battery / broken glass) */}
                      {(!recData?.isSafe || recResult.unsafe) && (
                        <div className="warning" style={{ margin: '14px 0' }}>
                          <AlertTriangle size={21} style={{ flexShrink: 0 }} />
                          <div>
                            <strong>Safety Override Activated:</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                              {recData?.safetyConsiderations ||
                                'Potentially hazardous device: automatic allocation is disabled. Do not puncture, charge, or ship a swollen battery or frayed live wiring without specialist guidance.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Price Estimation Widget (Module 6) */}
                      {priceData?.sufficientData && (
                        <div
                          style={{
                            margin: '18px 0',
                            padding: '16px 20px',
                            borderRadius: '14px',
                            backgroundColor: '#f8faf9',
                            border: '1.5px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Zap size={17} color="#10b981" />
                              <strong style={{ fontSize: '13.5px', color: '#0f3d2e' }}>
                                Estimated Device Valuation (Non-Binding)
                              </strong>
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              FY 2025–26 Benchmark
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                            {priceData.resaleRange && priceData.resaleRange.max > 0 && (
                              <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5ede7' }}>
                                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Refurbished Resale</span>
                                <strong style={{ fontSize: '15px', color: '#10b981' }}>
                                  ₹{priceData.resaleRange.min.toLocaleString('en-IN')} – ₹{priceData.resaleRange.max.toLocaleString('en-IN')}
                                </strong>
                              </div>
                            )}

                            {priceData.repairRange && (
                              <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5ede7' }}>
                                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Estimated Repair Cost</span>
                                <strong style={{ fontSize: '15px', color: '#3b82f6' }}>
                                  ₹{priceData.repairRange.min.toLocaleString('en-IN')} – ₹{priceData.repairRange.max.toLocaleString('en-IN')}
                                </strong>
                              </div>
                            )}

                            {priceData.scrapValueRange && (
                              <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5ede7' }}>
                                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Scrap / Material Recovery</span>
                                <strong style={{ fontSize: '15px', color: '#0d9488' }}>
                                  ₹{priceData.scrapValueRange.min.toLocaleString('en-IN')} – ₹{priceData.scrapValueRange.max.toLocaleString('en-IN')}
                                </strong>
                              </div>
                            )}
                          </div>

                          <p style={{ margin: 0, fontSize: '10px', color: '#64748b', lineHeight: 1.4 }}>
                            <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {priceData.disclaimer}
                          </p>
                        </div>
                      )}

                      <div className="result-summary">
                        <div>
                          <span>Device Name</span>
                          <b>{d.name || d.category}</b>
                        </div>
                        <div>
                          <span>Category</span>
                          <b>{d.category}</b>
                        </div>
                        <div>
                          <span>Identification Method</span>
                          <b>
                            {method === 'ai-vision'
                              ? `Vision AI (${aiResult?.confidenceLevel || 'verified'})`
                              : 'User Confirmed'}
                          </b>
                        </div>
                        <div>
                          <span>Reported Condition</span>
                          <b>{d.condition}</b>
                        </div>
                        <div>
                          <span>Location</span>
                          <b>{d.locality} ({d.pincode})</b>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-action-row" style={{ marginTop: '22px', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setStage(2)}>
                      Edit answers
                    </button>
                    <button className="btn btn-primary" onClick={finish}>
                      Save & find partners <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar info */}
        <aside className="scan-aside">
          <div className="panel scan-side-visual">
            <div className="scan-side-icon">
              <ScanLine size={34} />
            </div>
            <h3>
              Smarter decisions.
              <br />
              Less waste.
            </h3>
            <p>Every registered item gets an explainable pathway to repair, reuse or responsible recycling.</p>
            <div className="scan-side-line">
              <CheckCircle2 size={17} /> Hardware & cable vision reasoning
            </div>
            <div className="scan-side-line">
              <CheckCircle2 size={17} /> Recognizes items despite backgrounds
            </div>
            <div className="scan-side-line">
              <CheckCircle2 size={17} /> Secure local backend API
            </div>
          </div>

          <div className="side-note">
            <ShieldCheck size={21} />
            <div>
              <b>Secure & Verified</b>
              <p>
                API credentials remain securely on your local server in <code>.env</code> and are never leaked to frontend JavaScript.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
