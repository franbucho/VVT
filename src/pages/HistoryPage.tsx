
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEvaluationHistory } from '../services/firestoreService';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { ReportContents } from '../components/ReportContents';
import { useLanguage } from '../contexts/LanguageContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebaseConfig';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HistoryPageProps {
  currentUser: User | null;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<string[]>([]);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportToDownload, setReportToDownload] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      getEvaluationHistory(currentUser.uid)
        .then(snapshot => {
          const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEvaluations(historyData);
        })
        .catch(() => setError('Failed to load history.'))
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  const handleDownload = (evaluation: any) => {
    setReportToDownload(evaluation);
  };

  useEffect(() => {
    const generatePdf = async () => {
      if (reportToDownload && reportRef.current) {
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Niria-Report-${reportToDownload.id}.pdf`);
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
    if (!selectedEvaluationId) return;
    try {
      const submitFeedbackCallable = httpsCallable(functions, 'submitFeedback');
      await submitFeedbackCallable({ rating, comment, evaluationId: selectedEvaluationId });
      setSubmittedFeedbackIds(prev => [...prev, selectedEvaluationId]);
      setIsFeedbackModalOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <>
      <PageContainer title={t('history_title')}>
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-center text-danger">{error}</p>}
        {!isLoading && !error && (
            <div className="space-y-4">
            {evaluations.map((evaluation) => (
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
            ))}
            </div>
        )}
      </PageContainer>
      
      {/* Contenedor oculto para la generación del PDF */}
      {reportToDownload && (
        <div className="absolute -left-[9999px] -top-[9999px]">
          <div ref={reportRef} style={{ width: '210mm', minHeight: '297mm', padding: '10mm', backgroundColor: 'white' }}>
            <ReportContents 
              currentUser={currentUser} 
              healthData={reportToDownload.healthData} 
              analysisResults={reportToDownload.analysisResults} 
              summary={reportToDownload.summary} 
              capturedImage={reportToDownload.capturedImage} 
            />
          </div>
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