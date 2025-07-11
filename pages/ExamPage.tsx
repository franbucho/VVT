import React, { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { User } from 'firebase/auth';
import { Page, EyeAnalysisResult, HealthData } from '../types';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PageContainer } from '../components/common/PageContainer';
import { UploadIcon, CameraIcon, InfoIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { HealthQuestionnaire } from '../components/exam/HealthQuestionnaire';
import { saveEvaluationResult } from '../services/firestoreService';
import { analyzeEyeImage, getOphthalmologistSummary } from '../services/geminiService';
import { TranslationKeys } from '../localization/en';

// --- Guided Capture Types & Constants ---
enum CaptureState {
  Idle,
  Initializing,
  NoFace,
  TooManyFaces,
  CenterFace,
  GetCloser,
  OpenEyes,
  Perfect,
  Capturing,
  Success,
  Timeout,
}

const MIN_FACE_WIDTH_RATIO = 0.45;
const STATE_STABILITY_THRESHOLD_MS = 1500;
const CAPTURE_TIMEOUT_MS = 25000;
const CAPTURE_SUCCESS_DELAY_MS = 3000;

interface GuidedState {
  currentState: CaptureState;
  isGuidedMode: boolean;
  isProcessing: boolean;
  guideText: string;
  isDetectorSupported: boolean;
}

type GuidedAction =
  | { type: 'START' }
  | { type: 'INITIALIZED' }
  | { type: 'SET_STATE'; payload: { state: CaptureState; text: string } }
  | { type: 'CAPTURE_SUCCESS' }
  | { type: 'TIMEOUT'; text: string }
  | { type: 'RESET' }
  | { type: 'SET_DETECTOR_SUPPORT'; payload: boolean };

const initialGuidedState: GuidedState = {
  currentState: CaptureState.Idle,
  isGuidedMode: false,
  isProcessing: false,
  guideText: '',
  isDetectorSupported: true,
};

function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case 'START':
      return { ...state, isGuidedMode: true, isProcessing: true, currentState: CaptureState.Initializing, guideText: 'Initializing...' };
    case 'INITIALIZED':
      return { ...state, currentState: CaptureState.NoFace };
    case 'SET_STATE':
      return { ...state, currentState: action.payload.state, guideText: action.payload.text };
    case 'CAPTURE_SUCCESS':
      return { ...state, isProcessing: false, currentState: CaptureState.Success, guideText: 'Image captured successfully!' };
    case 'TIMEOUT':
      return { ...state, isProcessing: false, currentState: CaptureState.Timeout, guideText: action.text };
    case 'RESET':
      return { ...initialGuidedState, isDetectorSupported: state.isDetectorSupported };
    case 'SET_DETECTOR_SUPPORT':
      return { ...state, isDetectorSupported: action.payload };
    default:
      return state;
  }
}

// --- Component ---

interface ExamPageProps {
  setCurrentPage: (page: Page) => void;
  setAnalysisResults: (results: EyeAnalysisResult[] | null) => void;
  setHealthData: (data: HealthData) => void;
  healthData: HealthData | null;
  setCapturedImage: (image: string | null) => void;
  setOphthalmologistSummary: (summary: string) => void;
  setIsPaymentComplete: (status: boolean) => void;
  currentUser: User | null;
  isAdmin: boolean;
}

export const ExamPage: React.FC<ExamPageProps> = ({ 
  setCurrentPage, 
  setAnalysisResults, 
  setHealthData, 
  healthData, 
  setCapturedImage, 
  setOphthalmologistSummary,
  setIsPaymentComplete,
  currentUser,
  isAdmin 
}) => {
  const { t, language } = useLanguage();
  const [guidedState, dispatch] = useReducer(guidedReducer, initialGuidedState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraIntent, setCameraIntent] = useState<'none' | 'standard' | 'guided'>('none');
  const [lastCameraIntent, setLastCameraIntent] = useState<'standard' | 'guided'>('standard');


  const faceDetectorRef = useRef<any>(null);
  const potentialStateRef = useRef<{ state: CaptureState | null; timer: number | null }>({ state: null, timer: null });
  const processIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopGuidedCapture = useCallback(() => {
    if (processIntervalRef.current) clearInterval(processIntervalRef.current);
    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    if (potentialStateRef.current.timer) clearTimeout(potentialStateRef.current.timer);
    processIntervalRef.current = null;
    captureTimeoutRef.current = null;
    potentialStateRef.current = { state: null, timer: null };
    window.speechSynthesis.cancel();
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    stopGuidedCapture();
  }, [stopGuidedCapture]);
  
  const takePhoto = useCallback((isFromGuided: boolean = false) => {
    if (videoRef.current && canvasRef.current && isCameraOn) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        setCapturedImage(dataUrl);
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "capture.jpeg", { type: "image/jpeg" });
            setSelectedFile(file);
          });
        stopCamera();
        setCameraIntent('none');
        if (isFromGuided) {
          dispatch({ type: 'CAPTURE_SUCCESS' });
        }
      }
    }
  }, [isCameraOn, stopCamera, setCapturedImage]);

  const updateStableState = useCallback((newState: CaptureState) => {
      const stateToTextKey: Record<CaptureState, string> = {
        [CaptureState.Idle]: '',
        [CaptureState.Initializing]: t('exam_guide_initializing'),
        [CaptureState.NoFace]: t('exam_guide_no_person'),
        [CaptureState.TooManyFaces]: t('exam_guide_too_many'),
        [CaptureState.CenterFace]: t('exam_guide_center_face'),
        [CaptureState.GetCloser]: t('exam_guide_get_closer'),
        [CaptureState.OpenEyes]: t('exam_guide_open_eyes'),
        [CaptureState.Perfect]: t('exam_guide_perfect'),
        [CaptureState.Capturing]: '',
        [CaptureState.Success]: t('exam_guide_capture_success'),
        [CaptureState.Timeout]: t('exam_guide_timeout'),
      };
      const text = stateToTextKey[newState] || '';
      
      if (newState !== guidedState.currentState) {
        dispatch({ type: 'SET_STATE', payload: { state: newState, text } });
        speak(text);

        if (newState === CaptureState.GetCloser) {
           setTimeout(() => updateStableState(CaptureState.OpenEyes), 2000);
        } else if (newState === CaptureState.OpenEyes) {
           setTimeout(() => updateStableState(CaptureState.Perfect), 2000);
        } else if (newState === CaptureState.Perfect) {
           setTimeout(() => {
             speak(t('exam_guide_capture_success'));
             takePhoto(true);
           }, CAPTURE_SUCCESS_DELAY_MS);
        }
      }
  }, [t, speak, guidedState.currentState, takePhoto]);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !faceDetectorRef.current) return;

    try {
      const faces = await faceDetectorRef.current.detect(videoRef.current);
      let detectedStateThisFrame: CaptureState;

      if (faces.length === 0) {
        detectedStateThisFrame = CaptureState.NoFace;
      } else if (faces.length > 1) {
        detectedStateThisFrame = CaptureState.TooManyFaces;
      } else {
        const face = faces[0];
        const video = videoRef.current;
        const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
        const videoCenterX = video.videoWidth / 2;
        
        if (Math.abs(faceCenterX - videoCenterX) > video.videoWidth * 0.15) {
          detectedStateThisFrame = CaptureState.CenterFace;
        } else if (face.boundingBox.width / video.videoWidth < MIN_FACE_WIDTH_RATIO) {
          detectedStateThisFrame = CaptureState.GetCloser;
        } else {
          detectedStateThisFrame = guidedState.currentState < CaptureState.GetCloser ? CaptureState.GetCloser : guidedState.currentState;
        }
      }

      if (potentialStateRef.current.state !== detectedStateThisFrame) {
        if (potentialStateRef.current.timer) clearTimeout(potentialStateRef.current.timer);
        potentialStateRef.current.state = detectedStateThisFrame;
        potentialStateRef.current.timer = window.setTimeout(() => {
          if (potentialStateRef.current.state !== null) {
            updateStableState(potentialStateRef.current.state);
          }
        }, STATE_STABILITY_THRESHOLD_MS);
      }
    } catch (e) {
      console.error("Face detection error:", e);
    }
  }, [updateStableState, guidedState.currentState]);
  
  const processFrameRef = useRef(processFrame);
  useEffect(() => { processFrameRef.current = processFrame; });
  
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });
  
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; });

  const stopCameraRef = useRef(stopCamera);
  useEffect(() => { stopCameraRef.current = stopCamera; });


  useEffect(() => {
    if (cameraIntent === 'none') {
      return;
    }

    let isCancelled = false;

    const start = async () => {
        stopCameraRef.current();
        setSelectedFile(null);
        setPreviewUrl(null);
        setCapturedImage(null);
        setError(null);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                
                if (isCancelled || !videoRef.current) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                
                const isGuided = cameraIntent === 'guided';
                if (isGuided) {
                    dispatch({ type: 'START' });
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                if (isCancelled) return;

                setIsCameraOn(true);

                if (isGuided) {
                    speakRef.current(tRef.current('exam_guide_welcome'));
                    
                    faceDetectorRef.current = new (window as any).FaceDetector({ fastMode: true });
                    dispatch({ type: 'INITIALIZED' });
                    speakRef.current(tRef.current('exam_guide_start_process'));
                    
                    processIntervalRef.current = window.setInterval(processFrameRef.current, 200);

                    captureTimeoutRef.current = window.setTimeout(() => {
                        if (isCancelled) return;
                        dispatch({ type: 'TIMEOUT', text: tRef.current('exam_guide_timeout')});
                        stopCameraRef.current();
                        setCameraIntent('none');
                        speakRef.current(tRef.current('exam_guide_timeout'));
                    }, CAPTURE_TIMEOUT_MS);
                }
            } catch (err) {
                if (isCancelled) return;

                console.error("Error accessing camera:", err);
                if ((err as Error).name !== 'NotAllowedError' && (err as Error).name !== 'AbortError') {
                   setError(tRef.current('exam_error_cameraAccess'));
                }
                setIsCameraOn(false);
                setCameraIntent('none');
            }
        } else {
            if (isCancelled) return;
            setError(tRef.current('exam_error_cameraNotSupported'));
            setCameraIntent('none');
        }
    };
    
    start();
    
    return () => {
        isCancelled = true;
        stopCameraRef.current();
    };
  }, [cameraIntent, setCapturedImage]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isCameraOn) stopCamera();
    setCameraIntent('none');
    dispatch({ type: 'RESET' });
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('exam_error_fileTooLarge'));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(t('exam_error_invalidFileType'));
        return;
      }
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        setCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!previewUrl) {
      setError(t('exam_error_noPhoto'));
      return;
    }
    if (!currentUser || !healthData) {
        setError(t('exam_error_missingData'));
        return;
    }
    setError(null);
    setIsLoading(true);

    try {
        const base64Image = previewUrl.split(',')[1];
        if (!base64Image) {
            throw new Error(t('exam_error_invalid_image_data'));
        }

        // 1. Analyze the image first.
        const imageResults = await analyzeEyeImage(base64Image);

        // 2. Generate the ophthalmologist summary.
        const summaryText = await getOphthalmologistSummary(healthData, imageResults, language);

        // 3. Save everything to the database.
        await saveEvaluationResult(currentUser.uid, {
            healthData: healthData,
            analysisResults: imageResults,
            summary: summaryText,
            capturedImage: previewUrl, 
        });

        // 4. Pass the results to the app state.
        setAnalysisResults(imageResults);
        setOphthalmologistSummary(summaryText);

        // 5. Decision Logic: Check if user is an admin
        if (isAdmin) {
          console.log("User is an admin, skipping payment.");
          setIsPaymentComplete(true); // Mark as paid to view results directly
          setCurrentPage(Page.Results);
        } else {
          setIsPaymentComplete(false); // Ensure regular users are not marked as paid
          setCurrentPage(Page.Payment); // Send non-admins to the payment page
        }

    } catch(err) {
        console.error("Analysis or save failed:", err);
        const messageKey = (err instanceof Error && (err.message as keyof TranslationKeys).startsWith('error_')) 
          ? err.message as keyof TranslationKeys 
          : 'exam_error_analysisFailed' as keyof TranslationKeys;
        setError(t(messageKey));
    } finally {
        setIsLoading(false);
    }
  };
  
  const resetAndRetry = () => {
    speak(t('exam_guide_retry'));
    dispatch({ type: 'RESET' });
    setCameraIntent('guided');
  };
  
  const handleQuestionnaireSubmit = (data: HealthData) => {
    setHealthData(data);
    setIsQuestionnaireCompleted(true);
  };

  useEffect(() => {
    const isSupported = 'FaceDetector' in window;
    dispatch({ type: 'SET_DETECTOR_SUPPORT', payload: isSupported });
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <PageContainer title={!isQuestionnaireCompleted ? t('questionnaire_title') : t('exam_title')} className="max-w-2xl mx-auto">
      <div className={`bg-white p-8 rounded-xl shadow-2xl`}>

        {!isQuestionnaireCompleted ? (
            <HealthQuestionnaire onSubmit={handleQuestionnaireSubmit} />
        ) : (
          <>
            {/* Step 1: Initial Options */}
            {!previewUrl && cameraIntent === 'none' && (
              <>
                <p className="text-primary-dark/80 mb-6 text-sm">
                  <InfoIcon className="inline mr-2" />
                  {t('exam_instructions')}
                </p>
                <div className="space-y-4">
                  <label htmlFor="eye-photo-upload" className="w-full">
                    <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('eye-photo-upload')?.click()}>
                      <UploadIcon /> {t('exam_uploadPhotoButton')}
                    </Button>
                  </label>
                  <input type="file" id="eye-photo-upload" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="hidden" />

                  <Button type="button" variant="outline" className="w-full" onClick={() => { setCameraIntent('standard'); setLastCameraIntent('standard'); }}>
                    <CameraIcon /> {t('exam_takePhotoWithCameraButton')}
                  </Button>

                  {guidedState.isDetectorSupported && (
                    <Button type="button" variant="primary" className="w-full" onClick={() => { setCameraIntent('guided'); setLastCameraIntent('guided'); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9a4.5 4.5 0 0 0 9 0V5.5A4.5 4.5 0 0 0 10 1ZM8.5 5.5a1.5 1.5 0 0 1 3 0V9a1.5 1.5 0 0 1-3 0V5.5Z" clipRule="evenodd" /><path d="M10 10.5a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V11.5a1 1 0 0 1 1-1Z" /><path d="M5.023 12.336a.75.75 0 0 1 1.058-.235 5.49 5.49 0 0 0 7.838 0 .75.75 0 1 1 .823 1.225A6.99 6.99 0 0 1 10 15.5a6.99 6.99 0 0 1-4.902-1.939.75.75 0 0 1-.075-1.225Z" /></svg>
                      {t('exam_guidedCaptureButton')}
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Camera View */}
            {cameraIntent !== 'none' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-primary-dark mb-2 text-center">{t('exam_livePreviewTitle')}</h3>
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" muted />
                  <canvas ref={canvasRef} className="hidden" />
                  {cameraIntent === 'guided' && guidedState.currentState !== CaptureState.Success && guidedState.currentState !== CaptureState.Timeout && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="w-4/5 h-4/5 border-4 border-dashed border-white/50 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                      <p className="absolute bottom-5 text-white text-center font-semibold text-lg bg-black/50 px-4 py-2 rounded-lg">
                        {guidedState.guideText}
                      </p>
                    </div>
                  )}
                </div>
                {cameraIntent === 'standard' && isCameraOn && (
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => takePhoto(false)} variant="primary" size="lg">
                      {t('exam_capturePhotoButton')}
                    </Button>
                    <Button onClick={() => { setCameraIntent('none'); stopCamera(); }} variant="outline">
                      {t('exam_cancelButton')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Preview View */}
            {previewUrl && cameraIntent === 'none' && (
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-medium text-primary-dark">{t('exam_imagePreviewTitle')}</h3>
                <img src={previewUrl} alt="Eye preview" className="max-w-xs mx-auto rounded-lg shadow-md border border-gray-300" />
                {!isLoading && (
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                    <Button onClick={handleAnalyze} variant="primary" size="lg" isLoading={isLoading}>
                      {t('exam_analyzeButton')}
                    </Button>
                    <Button onClick={() => { setPreviewUrl(null); setSelectedFile(null); setCapturedImage(null); setCameraIntent(lastCameraIntent); }} variant="outline">
                      {t('exam_retakePhotoButton')}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 4: Loading/Error States */}
            {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
            {isLoading && <LoadingSpinner text={t('exam_analyzingText')} className="my-6" />}
            {guidedState.currentState === CaptureState.Timeout && (
              <Button onClick={resetAndRetry} variant="primary" size="lg" className="w-full">
                {t('exam_retryButton')}
              </Button>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};
