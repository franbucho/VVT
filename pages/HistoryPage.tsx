
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEvaluationHistory } from '../services/firestoreService';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { ReportContents } from '../components/ReportContents';
import { useLanguage } from '../contexts/LanguageContext';
import { EvaluationHistoryItem, Ophthalmologist } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HistoryPageProps {
  currentUser: User | null;
}

// A dedicated component for the ophthalmologist list PDF page to keep the code clean.
const OphthalmologistPdfPage = React.forwardRef<HTMLDivElement, { ophthalmologists: Ophthalmologist[]; t: (key: any) => string; }>(({ ophthalmologists, t }, ref) => {
    return (
        <div ref={ref} className="p-8 font-sans text-base bg-white" style={{ width: '800px' }}>
            <main>
                <section>
                    <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">
                        {t('report_nearby_ophthalmologists')}
                    </h2>
                    <div className="space-y-3">
                        {ophthalmologists.map((doctor, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-md text-sm" style={{ breakInside: 'avoid' }}>
                                <p className="font-bold text-primary-dark">{doctor.name}</p>
                                <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                <p className="text-sm text-gray-600 mt-1">{doctor.address}</p>
                                <p className="text-sm text-gray-600">{t('report_phone')}: {doctor.phone}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
});


export const HistoryPage: React.FC<HistoryPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<string[]>([]);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const ophthalmologistsRef = useRef<HTMLDivElement>(null);
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
    setReportToDownload(evaluation);
  };

  useEffect(() => {
    const generatePdf = async () => {
        if (!reportToDownload || !reportRef.current) return;
        
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfPageWidth = pdf.internal.pageSize.getWidth();
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
            const canvasOptions = { scale: 2, useCORS: true, windowWidth: reportRef.current.scrollWidth, windowHeight: reportRef.current.scrollHeight };

            // --- Process Page 1 (Main Report) ---
            const mainCanvas = await html2canvas(reportRef.current, canvasOptions);
            const mainImgData = mainCanvas.toDataURL('image/png');
            const mainImgProps = pdf.getImageProperties(mainImgData);
            const mainPdfImgHeight = (mainImgProps.height * pdfPageWidth) / mainImgProps.width;

            let mainHeightLeft = mainPdfImgHeight;
            let mainPosition = 0;

            pdf.addImage(mainImgData, 'PNG', 0, mainPosition, pdfPageWidth, mainPdfImgHeight);
            mainHeightLeft -= pdfPageHeight;

            while (mainHeightLeft > 0) {
                mainPosition -= pdfPageHeight;
                pdf.addPage();
                pdf.addImage(mainImgData, 'PNG', 0, mainPosition, pdfPageWidth, mainPdfImgHeight);
                mainHeightLeft -= pdfPageHeight;
            }

            // --- Process Subsequent Pages (Ophthalmologists) ---
            if (reportToDownload.ophthalmologists && reportToDownload.ophthalmologists.length > 0 && ophthalmologistsRef.current) {
                pdf.addPage();
                const ophthCanvas = await html2canvas(ophthalmologistsRef.current, canvasOptions);
                const ophthImgData = ophthCanvas.toDataURL('image/png');
                const ophthImgProps = pdf.getImageProperties(ophthImgData);
                const ophthPdfImgHeight = (ophthImgProps.height * pdfPageWidth) / ophthImgProps.width;

                let ophthHeightLeft = ophthPdfImgHeight;
                let ophthPosition = 0;

                pdf.addImage(ophthImgData, 'PNG', 0, ophthPosition, pdfPageWidth, ophthPdfImgHeight);
                ophthHeightLeft -= pdfPageHeight;

                while (ophthHeightLeft > 0) {
                    ophthPosition -= pdfPageHeight;
                    pdf.addPage();
                    pdf.addImage(ophthImgData, 'PNG', 0, ophthPosition, pdfPageWidth, ophthPdfImgHeight);
                    ophthHeightLeft -= pdfPageHeight;
                }
            }

            pdf.save(`VirtualVisionTest-Report-${reportToDownload.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setReportToDownload(null); // Reset after download
        }
    };
    generatePdf();
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
      // Re-throw to be caught in the modal
      throw error;
    }
  };

  return (
    <>
      <PageContainer title={t('history_title')}>
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-center text-danger">{error}</p>}
        {!isLoading && !error && (
            <div className="space-y-4">
            {evaluations.length > 0 ? evaluations.map((evaluation) => (
                <div key={evaluation.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <p className="font-semibold text-primary-dark">{t('history_evaluationDate')}: {evaluation.createdAt.toDate().toLocaleDateString(t('date_locale' as any))}</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button onClick={() => handleDownload(evaluation)} variant="outline" size="sm">
                    {t('report_download_pdf_button')}
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
            )) : (
              <p className="text-center text-primary-dark/70 py-10">{t('history_noHistory')}</p>
            )}
            </div>
        )}
      </PageContainer>
      
      {/* Contenedor oculto para la generación del PDF */}
      {reportToDownload && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10, opacity: 0, pointerEvents: 'none' }}>
          <div ref={reportRef}>
            <ReportContents 
              currentUser={currentUser} 
              healthData={reportToDownload.healthData} 
              analysisResults={reportToDownload.analysisResults} 
              summary={reportToDownload.summary || ''} 
              capturedImage={reportToDownload.capturedImage}
              ophthalmologists={reportToDownload.ophthalmologists || null}
              isForPdf={true}
              hideOphthalmologistSection={true}
            />
          </div>
          {reportToDownload.ophthalmologists && reportToDownload.ophthalmologists.length > 0 && (
              <OphthalmologistPdfPage ref={ophthalmologistsRef} ophthalmologists={reportToDownload.ophthalmologists} t={t} />
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
