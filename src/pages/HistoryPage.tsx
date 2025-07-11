import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';
import { PageContainer } from '../components/common/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getEvaluationHistory } from '../services/firestoreService';
import { EvaluationHistoryItem } from '../types';
import { Button } from '../components/common/Button';
import { ReportContents } from '../components/ReportContents';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HistoryPageProps {
  currentUser: User;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationHistoryItem | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await getEvaluationHistory(currentUser.uid);
        setEvaluations(historyData);
      } catch (err) {
        setError(t('history_fetchError'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [currentUser.uid, t]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !selectedEvaluation) {
      alert("Report data is not fully available. Please try again.");
      return;
    }
    setIsGeneratingPdf(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const imgHeight = pdfWidth / ratio;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`VirtualVisionTest-Report-${selectedEvaluation.id}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
      setSelectedEvaluation(null);
    }
  };
  
  useEffect(() => {
    if (selectedEvaluation && reportRef.current) {
      handleDownloadPdf();
    }
  }, [selectedEvaluation]);

  const handleViewReportClick = (evaluation: EvaluationHistoryItem) => {
    setSelectedEvaluation(evaluation);
  };

  const renderSummary = () => (
    <div className="bg-card-bg p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
      <div>
        <h3 className="text-sm font-semibold text-primary-dark/80 uppercase tracking-wider">{t('history_totalEvaluations')}</h3>
        <p className="text-3xl font-bold text-accent">{evaluations.length}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-primary-dark/80 uppercase tracking-wider">{t('history_lastEvaluation')}</h3>
        <p className="text-3xl font-bold text-accent">
          {evaluations.length > 0 ? evaluations[0].createdAt.toDate().toLocaleDateString(t('date_locale' as any) || 'en-US') : 'N/A'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {selectedEvaluation && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ReportContents
            ref={reportRef}
            currentUser={currentUser}
            healthData={selectedEvaluation.healthData}
            analysisResults={selectedEvaluation.analysisResults}
            summary={selectedEvaluation.summary || ''}
            capturedImage={selectedEvaluation.capturedImage}
          />
        </div>
      )}
      <PageContainer title={t('history_title')} className="max-w-4xl mx-auto">
        {isLoading ? (
          <LoadingSpinner text={t('history_loading')} />
        ) : error ? (
          <p className="text-center text-danger">{error}</p>
        ) : (
          <>
            {renderSummary()}
            <div className="bg-card-bg p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-primary-dark mb-4">{t('history_historyTitle')}</h2>
                {evaluations.length === 0 ? (
                  <p className="text-center text-primary-dark/70 py-8">{t('history_noHistory')}</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {evaluations.map((evaluation) => (
                      <li key={evaluation.id} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-primary-dark">{t('history_evaluationDate')}</p>
                          <p className="text-primary-dark/80">{evaluation.createdAt.toDate().toLocaleString(t('date_locale' as any) || 'en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                        </div>
                        <Button 
                            onClick={() => handleViewReportClick(evaluation)}
                            isLoading={isGeneratingPdf && selectedEvaluation?.id === evaluation.id}
                            variant="outline"
                        >
                          {isGeneratingPdf && selectedEvaluation?.id === evaluation.id 
                            ? t('history_generatingReport') 
                            : t('history_viewReportButton')
                          }
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
};
