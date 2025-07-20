import React, { useState, useRef } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { ReportContents } from '../components/ReportContents';
import { useLanguage } from '../contexts/LanguageContext';
import { Page, EyeAnalysisResult, HealthData, Ophthalmologist } from '../types';
import { User } from 'firebase/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsPageProps {
  setCurrentPage: (page: Page) => void;
  analysisResults: EyeAnalysisResult[] | null;
  summary: string;
  ophthalmologists: Ophthalmologist[] | null;
  currentUser: User | null;
  healthData: HealthData | null;
  capturedImage: string | null;
  isPaymentComplete: boolean;
  newEvaluationId: string | null;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  setCurrentPage,
  analysisResults,
  summary,
  ophthalmologists,
  currentUser,
  healthData,
  capturedImage,
  isPaymentComplete,
  newEvaluationId,
}) => {
  const { t } = useLanguage();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const ophthRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!summaryRef.current || !detailsRef.current) return;
    setIsDownloading(true);

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfPageWidth = pdf.internal.pageSize.getWidth();
        const canvasOptions = { scale: 2, useCORS: true, backgroundColor: '#ffffff' }; // Force white background for PDF

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
        if (ophthalmologists && ophthalmologists.length > 0 && ophthRef.current) {
            pdf.addPage();
            const ophthCanvas = await html2canvas(ophthRef.current, { ...canvasOptions, windowWidth: ophthRef.current.scrollWidth, windowHeight: ophthRef.current.scrollHeight });
            await addCanvasToPdf(ophthCanvas);
        }
        
        pdf.save("VirtualVisionTest-Report.pdf");

    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsDownloading(false);
    }
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    if (!currentUser || !newEvaluationId) return;
    try {
      const token = await currentUser.getIdToken();
      const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/submitFeedback';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, evaluationId: newEvaluationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setHasSubmittedFeedback(true);
      setIsFeedbackModalOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      // Optionally show an error to the user in the modal
      throw error; // Re-throw to be caught in the modal
    }
  };

  return (
    <>
      <PageContainer title={t('results_title')}>
        <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-8">
          {/* Contenido del Reporte (visible en la página) */}
          <ReportContents
            currentUser={currentUser}
            healthData={healthData}
            analysisResults={analysisResults}
            summary={summary}
            capturedImage={capturedImage}
            ophthalmologists={ophthalmologists}
            isForPdf={false} 
          />
          
          {/* Contenido del Reporte (oculto, para generar el PDF) */}
          <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10, opacity: 0, pointerEvents: 'none' }}>
              <ReportContents 
                  ref={summaryRef}
                  currentUser={currentUser} 
                  healthData={healthData} 
                  analysisResults={analysisResults} 
                  summary={summary} 
                  capturedImage={capturedImage}
                  ophthalmologists={ophthalmologists}
                  isForPdf={true}
                  pdfPage="summary"
              />
              <ReportContents 
                  ref={detailsRef}
                  currentUser={currentUser} 
                  healthData={healthData} 
                  analysisResults={analysisResults} 
                  summary={summary} 
                  capturedImage={capturedImage}
                  ophthalmologists={ophthalmologists}
                  isForPdf={true}
                  pdfPage="details"
              />
              {ophthalmologists && ophthalmologists.length > 0 && (
                  <ReportContents 
                    ref={ophthRef}
                    currentUser={currentUser} 
                    healthData={healthData} 
                    analysisResults={analysisResults} 
                    summary={summary} 
                    capturedImage={capturedImage}
                    ophthalmologists={ophthalmologists}
                    isForPdf={true}
                    pdfPage="ophthalmologists"
                  />
              )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 border-t dark:border-dark-border pt-6">
            <Button onClick={handleDownloadPDF} variant="outline" isLoading={isDownloading}>
              {isDownloading ? t('report_downloading_pdf') : t('report_download_pdf_button')}
            </Button>
            <Button 
              onClick={() => setIsFeedbackModalOpen(true)} 
              disabled={hasSubmittedFeedback || !newEvaluationId}
              variant="secondary"
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