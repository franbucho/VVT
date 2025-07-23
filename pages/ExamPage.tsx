import React, { useState, useRef, useCallback, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page, EyeAnalysisResult, HealthData, Ophthalmologist, UserProfile } from '../types';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PageContainer } from '../components/common/PageContainer';
import { UploadIcon, CameraIcon, XCircleIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { HealthQuestionnaire } from '../components/exam/HealthQuestionnaire';
import { InformedConsent } from '../components/exam/InformedConsent';
import { saveEvaluationResult } from '../services/firestoreService';
import { analyzeEyeImage } from '../services/geminiService';
import { getNearbyOphthalmologists } from '../services/nppesService';
import imageCompression from 'browser-image-compression';

/**
 * Converts a Blob object to a Base64 encoded string.
 * This method is robust and works consistently across browsers, including Safari on iOS.
 * @param blob The blob to convert.
 * @returns A promise that resolves with the Base64 string (without the data URL prefix).
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read blob for Base64 conversion.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Content = dataUrl.split(',')[1];
      if (!base64Content) {
        reject(new Error('Could not extract base64 content from data URL.'));
      } else {
        resolve(base64Content);
      }
    };
    reader.readAsDataURL(blob);
  });
};

interface ExamPageProps {
  setCurrentPage: (page: Page) => void;
  setAnalysisResults: (results: EyeAnalysisResult[] | null) => void;
  setHealthData: (data: HealthData) => void;
  healthData: HealthData | null;
  setCapturedImage: (image: string | null) => void;
  setOphthalmologistSummary: (summary: string) => void;
  setOphthalmologists: (list: Ophthalmologist[] | null) => void;
  setNewEvaluationId: (id: string | null) => void;
  setIsPaymentComplete: (status: boolean) => void;
  currentUser: User | null;
  isAdmin: boolean;
  isPremium: boolean;
  evaluationsCount: number;
}

export const ExamPage: React.FC<ExamPageProps> = ({
  setCurrentPage,
  setAnalysisResults,
  setHealthData,
  healthData,
  setCapturedImage,
  setOphthalmologistSummary,
  setOphthalmologists,
  setNewEvaluationId,
  setIsPaymentComplete,
  currentUser,
  isAdmin,
  isPremium,
  evaluationsCount,
}) => {
  const { t, language } = useLanguage();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    try {
        const savedConsent = localStorage.getItem('niria-user-consent');
        if (savedConsent === 'true') {
            setConsentGiven(true);
        }
    } catch (e) {
        console.error("Could not access localStorage for consent check:", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const cleanupImageState = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageBlob(null);
    setPreviewUrl(null);
    setError(null);
  }, [previewUrl]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  const startCamera = async () => {
    stopCamera();
    cleanupImageState();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
      try {
        const constraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        if ((err as Error).name !== 'NotAllowedError' && (err as Error).name !== 'AbortError') {
          setError(t('exam_error_cameraAccess'));
        }
        setIsCameraOn(false);
      }
    } else {
      setError(t('exam_error_cameraNotSupported'));
    }
  };

  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn) return;

    setIsProcessingImage(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context.');

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      if (!videoWidth || !videoHeight) throw new Error("Video has no dimensions.");

      const outputWidth = 500;
      const outputHeight = videoHeight * (outputWidth / videoWidth);
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      context.drawImage(video, 0, 0, outputWidth, outputHeight);

      stopCamera();

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(async (result) => {
          if (result) {
            resolve(result);
          } else {
            // Fallback for browsers that might fail toBlob (e.g., specific security settings)
            try {
              const dataURL = canvas.toDataURL('image/jpeg', 0.8);
              const byteString = atob(dataURL.split(',')[1]);
              const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const fallbackBlob = new Blob([ab], { type: mimeString });
              resolve(fallbackBlob);
            } catch (e) {
              reject(new Error("Fallback toDataURL->Blob failed: " + (e as Error).message));
            }
          }
        }, 'image/jpeg', 0.8);
      });

      cleanupImageState();
      setImageBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));

    } catch (e) {
      console.error("Error during photo capture:", e);
      setError(t('error_image_processing'));
      if (isCameraOn) stopCamera();
    } finally {
      setIsProcessingImage(false);
    }
  }, [isCameraOn, stopCamera, t, cleanupImageState]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isCameraOn) stopCamera();
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError(t('exam_error_fileTooLarge'));
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)) {
      setError(t('exam_error_invalidFileType'));
      return;
    }

    setIsProcessingImage(true);
    cleanupImageState();

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };

    try {
      const compressedBlob = await imageCompression(file, options);
      setImageBlob(compressedBlob);
      setPreviewUrl(URL.createObjectURL(compressedBlob));
    } catch (error) {
      console.error("Image compression error:", error);
      setError(t('error_image_processing'));
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBlob) {
      setError(t('exam_error_noPhoto'));
      return;
    }
    if (!currentUser || !healthData) {
      setError(t('exam_error_missingData'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Image = await blobToBase64(imageBlob);
      const mimeType = 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      setCapturedImage(dataUrl);

      const { analysisResults: imageResults, summary: summaryText } = await analyzeEyeImage(base64Image, mimeType, healthData, language);
      
      const ophthalmologistsList = healthData.state 
        ? await getNearbyOphthalmologists(healthData.state, healthData.city || undefined) 
        : [];
      
      const evaluationId = await saveEvaluationResult(currentUser.uid, {
        healthData: healthData,
        analysisResults: imageResults,
        summary: summaryText,
        capturedImage: dataUrl,
        ophthalmologists: ophthalmologistsList,
      });

      setNewEvaluationId(evaluationId);
      setAnalysisResults(imageResults);
      setOphthalmologistSummary(summaryText);
      setOphthalmologists(ophthalmologistsList);

      const freePass = isAdmin || (isPremium && evaluationsCount < 2);

      if (freePass) {
        setIsPaymentComplete(true);
        setCurrentPage(Page.Results);
      } else {
        setIsPaymentComplete(false);
        setCurrentPage(Page.Payment);
      }

    } catch (err) {
      console.error("Analysis or save failed. Raw error:", err);
      const userMessage = (err instanceof Error) ? err.message : t('error_generic_unexpected_api');
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireSubmit = (data: HealthData) => {
    setHealthData(data);
    setIsQuestionnaireCompleted(true);
  };
  
  const handleAcceptConsent = () => {
      try {
          localStorage.setItem('niria-user-consent', 'true');
      } catch (e) {
          console.error("Could not save consent to localStorage:", e);
      }
      setConsentGiven(true);
  };

  const handleDeclineConsent = () => {
      setConsentDeclined(true);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  if (!consentGiven) {
    return (
        <PageContainer title={consentDeclined ? t('consent_declined_title') : t('consent_title')} className="max-w-2xl mx-auto">
            {consentDeclined ? (
                <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-2xl text-center">
                    <XCircleIcon className="w-12 h-12 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-primary-dark dark:text-dark-text-primary">{t('consent_declined_title')}</h2>
                    <p className="mt-2 text-primary-dark/80 dark:text-dark-text-secondary">{t('consent_declined_message')}</p>
                    <Button onClick={() => setCurrentPage(Page.Home)} className="mt-6">
                        {t('results_backToHomeButton')}
                    </Button>
                </div>
            ) : (
                <InformedConsent onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />
            )}
        </PageContainer>
    );
  }

  return (
    <PageContainer title={!isQuestionnaireCompleted ? t('questionnaire_title') : t('exam_title')} className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-2xl">
        {!isQuestionnaireCompleted ? (
          <HealthQuestionnaire onSubmit={handleQuestionnaireSubmit} currentUser={currentUser} />
        ) : (
          <>
            <div className={`space-y-4 ${isCameraOn ? '' : 'hidden'}`}>
              <h3 className="text-lg font-medium text-primary-dark dark:text-dark-text-primary mb-2 text-center">{t('exam_livePreviewTitle')}</h3>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" muted />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={takePhoto} variant="primary" size="lg" isLoading={isProcessingImage}>
                  {isProcessingImage ? t('exam_processing_image') : t('exam_capturePhotoButton')}
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  {t('exam_cancelButton')}
                </Button>
              </div>
            </div>

            <div className={`${isCameraOn ? 'hidden' : ''}`}>
              {!previewUrl && !isProcessingImage && (
                <>
                  <div className="space-y-6 mb-6">
                    <div className="bg-gray-100 dark:bg-dark-card/50 border border-gray-300 dark:border-dark-border rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">{t('exam_instructions_title')}</h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-dark-text-secondary space-y-2 text-sm leading-relaxed">
                        <li>{t('exam_instructions_step1')}</li>
                        <li>{t('exam_instructions_step2')}</li>
                        <li>{t('exam_instructions_step3')}</li>
                        <li>{t('exam_instructions_step4')}</li>
                        <li>{t('exam_instructions_step5')}</li>
                      </ul>
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <video 
                        src="https://storage.googleapis.com/felipec-_bucket/ojo-1.mp4" 
                        className="w-full h-auto"
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        aria-label={t('exam_instructional_video_aria')}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label htmlFor="eye-photo-upload" className="w-full">
                      <Button as="span" variant="outline" className="w-full cursor-pointer">
                        <UploadIcon /> {t('exam_uploadPhotoButton')}
                      </Button>
                    </label>
                    <input type="file" id="eye-photo-upload" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileChange} className="hidden" />
                    <Button type="button" variant="primary" className="w-full" onClick={startCamera}>
                      <CameraIcon /> {t('exam_takePhotoWithCameraButton')}
                    </Button>
                  </div>
                </>
              )}

              {isProcessingImage && <LoadingSpinner text={t('exam_processing_image')} className="my-6" />}

              {previewUrl && !isProcessingImage && (
                <div className="space-y-4 text-center">
                  <h3 className="text-lg font-medium text-primary-dark dark:text-dark-text-primary">{t('exam_imagePreviewTitle')}</h3>
                  <img src={previewUrl} alt="Eye preview" className="max-w-xs mx-auto rounded-lg shadow-md border border-gray-300 dark:border-dark-border" />
                  {!isLoading && (
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                      <Button onClick={handleAnalyze} variant="primary" size="lg" isLoading={isLoading}>
                        {t('exam_analyzeButton')}
                      </Button>
                      <Button onClick={cleanupImageState} variant="outline">
                        {t('exam_retakePhotoButton')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-danger text-sm my-4 p-3 bg-red-50 border border-danger rounded-md text-center whitespace-pre-wrap">{error}</p>}
              {isLoading && <LoadingSpinner text={t('exam_analyzingText')} className="my-6" />}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};