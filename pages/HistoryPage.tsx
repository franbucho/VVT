import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEvaluationHistory } from '../services/firestoreService';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { ReportContents } from '../components/ReportContents';
import { useLanguage } from '../contexts/LanguageContext';
import { EvaluationHistoryItem, Ophthalmologist, Page } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HistoryPageProps {
  currentUser: User | null;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<string[]>([]);
  
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // Store ID of downloading report
  const summaryRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const ophthRef = useRef<HTMLDivElement>(null);
  const [reportToDownload, setReportToDownload] = useState<EvaluationHistoryItem | null>(null);

  useEffect(() => {
    if (currentUser) {
      getEvaluationHistory(currentUser.uid)
        .then(historyData => {
          setEvaluations(historyData);
        })
        .catch(() => setError(t('history_fetchError')))
        .finally(() => setIsLoading(false));
    }
  }, [currentUser, t]);

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
            const canvasOptions = { scale: 2, useCORS: true, backgroundColor: '#ffffff' }; // Force white bg for PDF

            const addCanvasToPdf = async (canvas: HTMLCanvasElement) => {
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfHeight = (imgProps.height * pdfPageWidth) / imgProps.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfPageWidth, pdfHeight);
            };
    
            // --- Page 1: Summary ---
            const summaryCanvas = await html2canvas(summaryRef.current, { ...canvasOptions, windowWidth: summaryRef.current.scrollWidth, windowHeight: summaryRef.current.scrollHeight });
            await addCanvasToPdf(summaryCanvas);
    
            // --- Page 2: Details ---
            pdf.addPage();
            const detailsCanvas = await html2canvas(detailsRef.current, { ...canvasOptions, windowWidth: detailsRef.current.scrollWidth, windowHeight: detailsRef.current.scrollHeight });
            await addCanvasToPdf(detailsCanvas);
    
            // --- Page 3: Ophthalmologists (optional) ---
            if (reportToDownload.ophthalmologists && reportToDownload.ophthalmologists.length > 0 && ophthRef.current) {
                pdf.addPage();
                const ophthCanvas = await html2canvas(ophthRef.current, { ...canvasOptions, windowWidth: ophthRef.current.scrollWidth, windowHeight: ophthRef.current.scrollHeight });
                await addCanvasToPdf(ophthCanvas);
            }

            pdf.save(`VirtualVisionTest-Report-${reportToDownload.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setReportToDownload(null);
            setIsDownloading(null);
        }
    };
    if (reportToDownload) {
        // Timeout to allow React to render the hidden components before we try to capture them
        setTimeout(generatePdf, 100); 
    }
  }, [reportToDownload]);

  const openFeedbackModal = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!selectedEvaluationId || !currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/submitFeedback';
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, evaluationId: selectedEvaluationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmittedFeedbackIds(prev => [...prev, selectedEvaluationId]);
      setIsFeedbackModalOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      throw error;
    }
  };

  return (
    <>
      <PageContainer title={t('history_title')}>
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-center text-danger">{error}</p>}
        {!isLoading && !error && (
            <div className="space-y-6">
            {evaluations.length > 0 ? evaluations.map((evaluation) => (
                <div key={evaluation.id} className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <p className="font-semibold text-primary-dark dark:text-dark-text-primary">{t('history_evaluationDate')}: {evaluation.createdAt.toDate().toLocaleDateString(t('date_locale' as any))}</p>
                        <div className="flex gap-2 mt-4 sm:mt-0 flex-shrink-0">
                            <Button onClick={() => handleDownload(evaluation)} variant="outline" size="sm" isLoading={isDownloading === evaluation.id}>
                              {isDownloading === evaluation.id ? t('report_downloading_pdf') : t('report_download_pdf_button')}
                            </Button>
                            <Button 
                            onClick={() => openFeedbackModal(evaluation.id)}
                            disabled={submittedFeedbackIds.includes(evaluation.id)}
                            variant="secondary" 
                            size="sm"
                            >
                            {submittedFeedbackIds.includes(evaluation.id) ? t('feedback_submitted') : t('feedback_button')}
                            </Button>
                        </div>
                    </div>
                    {evaluation.doctorNotes && evaluation.doctorNotes.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500 rounded-r-lg">
                            <h4 className="font-bold text-green-800 dark:text-green-300">{t('history_doctor_note_title')}</h4>
                            {evaluation.doctorNotes.map((note, index) => (
                                <div key={index} className="mt-2 pt-2 border-t border-green-200 dark:border-green-500/20 first:border-t-0 first:pt-0">
                                    <p className="text-sm text-green-900 dark:text-green-200 italic">"{note.text}"</p>
                                    <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">- {note.doctorName} on {note.createdAt.toDate().toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )) : (
              <p className="text-center text-primary-dark/70 dark:text-dark-text-secondary/70 py-10">{t('history_noHistory')}</p>
            )}
            </div>
        )}
      </PageContainer>
      
      {reportToDownload && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10, opacity: 0, pointerEvents: 'none' }}>
            <ReportContents 
                ref={summaryRef}
                currentUser={currentUser} 
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
                currentUser={currentUser} 
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
                    currentUser={currentUser} 
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

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
};