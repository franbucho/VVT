
import React, { useState, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { ReportContents } from '../components/ReportContents';
import { useLanguage } from '../contexts/LanguageContext';
import { Page, EyeAnalysisResult, HealthData } from '../types';
import { User } from 'firebase/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsPageProps {
  setCurrentPage: (page: Page) => void;
  analysisResults: EyeAnalysisResult[] | null;
  summary: string;
  currentUser: User | null;
  healthData: HealthData | null;
  capturedImage: string | null;
  isPaymentComplete: boolean;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  setCurrentPage,
  analysisResults,
  summary,
  currentUser,
  healthData,
  capturedImage,
  isPaymentComplete,
}) => {
  const { t } = useLanguage();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save("VirtualVisionTest-Report.pdf");
    setIsDownloading(false);
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!currentUser) return;
    try {
      const submitFeedbackCallable = httpsCallable(functions, 'submitFeedback');
      await submitFeedbackCallable({ rating, comment });
      setHasSubmittedFeedback(true);
      setIsFeedbackModalOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <>
      <PageContainer title={t('results_title')}>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-8">
          {/* Contenido del Reporte (visible en la página) */}
          <ReportContents
            currentUser={currentUser}
            healthData={healthData}
            analysisResults={analysisResults}
            summary={summary}
            capturedImage={capturedImage}
          />
          
          {/* Contenido del Reporte (oculto, solo para generar el PDF) */}
          <div className="absolute -left-[9999px] -top-[9999px]">
              <div ref={reportRef} style={{ width: '210mm', minHeight: '297mm', padding: '10mm', backgroundColor: 'white' }}>
                  <ReportContents 
                      currentUser={currentUser} 
                      healthData={healthData} 
                      analysisResults={analysisResults} 
                      summary={summary} 
                      capturedImage={capturedImage} 
                  />
              </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 border-t pt-6">
            <Button onClick={handleDownloadPDF} variant="outline" isLoading={isDownloading}>
              {isDownloading ? t('report_downloading_pdf') : t('report_download_pdf_button')}
            </Button>
            <Button 
              onClick={() => setIsFeedbackModalOpen(true)} 
              disabled={hasSubmittedFeedback}
              variant="primary"
            >
              {hasSubmittedFeedback ? t('feedback_submitted') : t('feedback_button')}
            </Button>
          </div>
        </div>
      </PageContainer>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
};
