
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
  const reportRef = useRef<HTMLDivElement>(null);
  const ophthalmologistsRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const canvasOptions = { scale: 2, useCORS: true, windowWidth: reportRef.current.scrollWidth, windowHeight: reportRef.current.scrollHeight };

    try {
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
        if (ophthalmologists && ophthalmologists.length > 0 && ophthalmologistsRef.current) {
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
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-8">
          {/* Contenido del Reporte (visible en la página, simplified view) */}
          <ReportContents
            currentUser={currentUser}
            healthData={healthData}
            analysisResults={analysisResults}
            summary={summary}
            capturedImage={capturedImage}
            ophthalmologists={ophthalmologists}
            isForPdf={false} 
          />
          
          {/* Contenido del Reporte (oculto, solo para generar el PDF, detailed view) */}
          <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10, opacity: 0, pointerEvents: 'none' }}>
              <div ref={reportRef}>
                  <ReportContents 
                      currentUser={currentUser} 
                      healthData={healthData} 
                      analysisResults={analysisResults} 
                      summary={summary} 
                      capturedImage={capturedImage}
                      ophthalmologists={ophthalmologists}
                      isForPdf={true}
                      hideOphthalmologistSection={true}
                  />
              </div>
              {ophthalmologists && ophthalmologists.length > 0 && (
                  <OphthalmologistPdfPage ref={ophthalmologistsRef} ophthalmologists={ophthalmologists} t={t} />
              )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 border-t pt-6">
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
