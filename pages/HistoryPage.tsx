import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEvaluationHistory, getUserProfile, uploadProfilePicture } from '../services/firestoreService';
import { PageContainer } from '../components/common/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { ReportContents } from '../components/ReportContents';
import { useLanguage } from '../contexts/LanguageContext';
import { EvaluationHistoryItem, UserProfile } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InputField } from '../components/common/InputField';
import { auth } from '../firebase';
import firebase from 'firebase/compat/app';

interface ProfilePageProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | null) => void;
}

const Countdown: React.FC<{ date: Date | null, t: (key: any, replacements?: any) => string }> = ({ date, t }) => {
    if (!date) {
        return <span className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">{t('profile_countdown_no_date')}</span>;
    }
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return <span className="text-sm font-bold text-danger">{t('profile_countdown_overdue')}</span>;
    }
    if (diffDays === 0) {
        return <span className="text-sm font-bold text-yellow-500">{t('profile_countdown_due_today')}</span>;
    }
    return <span className="text-sm font-medium text-primary-dark dark:text-dark-text-primary">{t('profile_countdown_due_in_days', { days: diffDays })}</span>;
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile, setUserProfile }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const ophthRef = useRef<HTMLDivElement>(null);
  const [reportToDownload, setReportToDownload] = useState<EvaluationHistoryItem | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      getEvaluationHistory(userProfile.uid)
        .then(historyData => {
          setEvaluations(historyData);
        })
        .catch(() => setError(t('profile_fetchError')))
        .finally(() => setIsLoading(false));
    }
    setFormData(userProfile);
  }, [userProfile, t]);
  
  const handleDownload = (evaluation: EvaluationHistoryItem) => {
    setIsDownloading(evaluation.id);
    setReportToDownload(evaluation);
  };

  useEffect(() => {
    const generatePdf = async () => {
        if (!reportToDownload || !summaryRef.current || !detailsRef.current) return;
        
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfPageWidth = pdf.internal.pageSize.getWidth();
            const canvasOptions = { scale: 2, useCORS: true, backgroundColor: '#ffffff' };

            const addCanvasToPdf = async (canvas: HTMLCanvasElement) => {
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfHeight = (imgProps.height * pdfPageWidth) / imgProps.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfPageWidth, pdfHeight);
            };
    
            const summaryCanvas = await html2canvas(summaryRef.current, { ...canvasOptions, windowWidth: summaryRef.current.scrollWidth, windowHeight: summaryRef.current.scrollHeight });
            await addCanvasToPdf(summaryCanvas);
    
            pdf.addPage();
            const detailsCanvas = await html2canvas(detailsRef.current, { ...canvasOptions, windowWidth: detailsRef.current.scrollWidth, windowHeight: detailsRef.current.scrollHeight });
            await addCanvasToPdf(detailsCanvas);
    
            if (reportToDownload.ophthalmologists && reportToDownload.ophthalmologists.length > 0 && ophthRef.current) {
                pdf.addPage();
                const ophthCanvas = await html2canvas(ophthRef.current, { ...canvasOptions, windowWidth: ophthRef.current.scrollWidth, windowHeight: ophthRef.current.scrollHeight });
                await addCanvasToPdf(ophthCanvas);
            }

            pdf.save(`Niria-Report-${reportToDownload.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setReportToDownload(null);
            setIsDownloading(null);
        }
    };
    if (reportToDownload) {
        setTimeout(generatePdf, 100); 
    }
  }, [reportToDownload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith("medicalHistory.")) {
        const key = name.split('.')[1];
        setFormData(prev => ({ ...prev, medicalHistory: { ...prev.medicalHistory, [key]: value }}));
    } else if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [(e.target as HTMLInputElement).name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "nextConsultation") {
        setFormData(prev => ({ ...prev, nextConsultation: value ? firebase.firestore.Timestamp.fromDate(new Date(value)) : null }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;
    setIsUploading(true);
    setError('');
    try {
        const photoURL = await uploadProfilePicture(userProfile.uid, file);
        setFormData(prev => ({ ...prev, photoURL }));
    } catch {
        setError(t('profile_error_upload'));
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleSave = async () => {
    if (!userProfile?.uid) return;
    setIsSaving(true);
    setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const functionUrl = `https://us-central1-virtual-vision-test-app.cloudfunctions.net/updateUserProfile`;
      
      const payload = { ...formData };
      if (payload.nextConsultation && !(payload.nextConsultation instanceof firebase.firestore.Timestamp)) {
        payload.nextConsultation = firebase.firestore.Timestamp.fromDate(new Date(payload.nextConsultation as any));
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: payload })
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || 'Failed to save profile');
      }
      const updatedProfile = await getUserProfile(userProfile.uid);
      setUserProfile(updatedProfile);
      setIsEditing(false);
    } catch (err: any) {
        setError(err.message || t('profile_error_save'));
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading || !userProfile) {
    return <PageContainer title={t('profile_title')}><LoadingSpinner text={t('profile_loading')} /></PageContainer>
  }

  return (
    <>
      <PageContainer title={t('profile_title')}>
        <div className="space-y-8">
            <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('profile_personal_info_title')}</h2>
                    {!isEditing && <Button onClick={() => setIsEditing(true)}>{t('profile_edit_button')}</Button>}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex flex-col items-center space-y-3 flex-shrink-0">
                        <img src={formData.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName || 'User'}&background=random`} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-white dark:border-dark-card" />
                        {isEditing && (
                            <>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                                <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" isLoading={isUploading}>
                                    {isUploading ? t('profile_uploading_photo') : t('profile_change_photo_button')}
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="space-y-4 w-full">
                        <InputField label={t('auth_firstNameLabel')} name="firstName" value={formData.firstName || ''} onChange={handleInputChange} disabled={!isEditing} />
                        <InputField label={t('auth_lastNameLabel')} name="lastName" value={formData.lastName || ''} onChange={handleInputChange} disabled={!isEditing} />
                        <InputField label={t('auth_emailLabel')} name="email" type="email" value={formData.email || ''} onChange={handleInputChange} disabled={true} />
                        <InputField label={t('profile_label_phone')} name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} disabled={!isEditing} placeholder={t('profile_placeholder_phone')} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-4">
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('profile_medical_info_title')}</h2>
                <InputField label={t('profile_label_allergies')} name="medicalHistory.allergies" value={formData.medicalHistory?.allergies || ''} onChange={handleInputChange} disabled={!isEditing} placeholder={t('profile_placeholder_allergies')} />
                <InputField label={t('profile_label_conditions')} name="medicalHistory.conditions" value={formData.medicalHistory?.conditions || ''} onChange={handleInputChange} disabled={!isEditing} placeholder={t('profile_placeholder_conditions')} />
                <InputField label={t('profile_label_surgeries')} name="medicalHistory.surgeries" value={formData.medicalHistory?.surgeries || ''} onChange={handleInputChange} disabled={!isEditing} placeholder={t('profile_placeholder_surgeries')} />
            </div>
            
            <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-4">
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('profile_upcoming_evaluation_title')}</h2>
                 <div className="p-4 bg-gray-50 dark:bg-dark-background rounded-lg flex justify-between items-center">
                    <Countdown date={formData.nextConsultation ? formData.nextConsultation.toDate() : null} t={t} />
                    <label className="flex items-center space-x-2 text-sm text-primary-dark dark:text-dark-text-secondary">
                        <input type="checkbox" name="enableReminders" checked={formData.enableReminders || false} onChange={handleInputChange} disabled={!isEditing} className="accent-primary dark:accent-dark-accent" />
                        <span>{t('profile_label_enable_reminders')}</span>
                    </label>
                </div>
                <InputField label={t('profile_label_assigned_doctor')} name="assignedDoctor" value={formData.assignedDoctor || ''} onChange={handleInputChange} disabled={!isEditing} placeholder={t('profile_placeholder_doctor')} />
                <InputField label={t('profile_label_next_consultation')} name="nextConsultation" type="date" value={formData.nextConsultation ? formData.nextConsultation.toDate().toISOString().split('T')[0] : ''} onChange={handleInputChange} disabled={!isEditing} />
            </div>

             {isEditing && (
                <div className="flex justify-end gap-4 mt-6">
                    {error && <p className="text-danger text-sm self-center">{error}</p>}
                    <Button variant="outline" onClick={() => { setIsEditing(false); setFormData(userProfile); setError(''); }}>{t('profile_cancel_button')}</Button>
                    <Button onClick={handleSave} isLoading={isSaving}>{t(isSaving ? 'profile_saving_button' : 'profile_save_button')}</Button>
                </div>
            )}

            <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('profile_history_title')}</h2>
                {evaluations.length > 0 ? evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="bg-gray-50 dark:bg-dark-background/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <p className="font-semibold text-primary-dark dark:text-dark-text-primary">{t('history_evaluationDate')}: {evaluation.createdAt.toDate().toLocaleDateString(t('date_locale' as any))}</p>
                        <div className="flex gap-2 mt-4 sm:mt-0 flex-shrink-0">
                            <Button onClick={() => handleDownload(evaluation)} variant="outline" size="sm" isLoading={isDownloading === evaluation.id}>
                              {isDownloading === evaluation.id ? t('report_downloading_pdf') : t('report_download_pdf_button')}
                            </Button>
                        </div>
                    </div>
                )) : (
                <p className="text-center text-primary-dark/70 dark:text-dark-text-secondary py-10">{t('profile_noHistory')}</p>
                )}
            </div>
        </div>
      </PageContainer>
      
      {reportToDownload && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10, opacity: 0, pointerEvents: 'none' }}>
            <ReportContents 
                ref={summaryRef}
                currentUser={auth.currentUser} 
                healthData={reportToDownload.healthData} 
                analysisResults={reportToDownload.analysisResults} 
                summary={reportToDownload.summary || ''} 
                capturedImage={reportToDownload.capturedImage}
                ophthalmologists={reportToDownload.ophthalmologists || null}
                doctorNotes={reportToDownload.doctorNotes || []}
                isForPdf={true}
                pdfPage="summary"
            />
            <ReportContents 
                ref={detailsRef}
                currentUser={auth.currentUser} 
                healthData={reportToDownload.healthData} 
                analysisResults={reportToDownload.analysisResults} 
                summary={reportToDownload.summary || ''} 
                capturedImage={reportToDownload.capturedImage}
                ophthalmologists={reportToDownload.ophthalmologists || null}
                doctorNotes={reportToDownload.doctorNotes || []}
                isForPdf={true}
                pdfPage="details"
            />
            {reportToDownload.ophthalmologists && reportToDownload.ophthalmologists.length > 0 && (
                <ReportContents 
                    ref={ophthRef}
                    currentUser={auth.currentUser}
                    healthData={reportToDownload.healthData} 
                    analysisResults={reportToDownload.analysisResults} 
                    summary={reportToDownload.summary || ''} 
                    capturedImage={reportToDownload.capturedImage}
                    ophthalmologists={reportToDownload.ophthalmologists || null}
                    doctorNotes={reportToDownload.doctorNotes || []}
                    isForPdf={true}
                    pdfPage="ophthalmologists"
                />
            )}
        </div>
      )}
    </>
  );
};