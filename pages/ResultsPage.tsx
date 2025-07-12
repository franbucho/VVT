
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Page, EyeAnalysisResult, HealthData } from '../types';
import { Button } from '../components/common/Button';
import { PageContainer } from '../components/common/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InfoIcon, LightbulbIcon } from '../constants';
import { getGeneralEyeHealthTips } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKeys } from '../localization/en';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportContents } from '../components/ReportContents';


interface ResultsPageProps {
  setCurrentPage: (page: Page) => void;
  analysisResults: EyeAnalysisResult[] | null;
  summary: string | null;
  currentUser: User | null;
  healthData: HealthData | null;
  capturedImage: string | null;
  isPaymentComplete: boolean;
}

const getRiskLevelStyles = (riskLevel: EyeAnalysisResult['riskLevel']) => {
  switch (riskLevel) {
    case 'Low':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        icon: CheckCircleIcon,
        translationKey: 'results_risk_low' as keyof TranslationKeys
      };
    case 'Medium':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        icon: ExclamationTriangleIcon,
        translationKey: 'results_risk_medium' as keyof TranslationKeys
      };
    case 'High':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        icon: XCircleIcon,
        translationKey: 'results_risk_high' as keyof TranslationKeys
      };
    default: // Undetermined or other
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
        icon: InfoIcon,
        translationKey: 'results_risk_undetermined' as keyof TranslationKeys
      };
  }
};

export const ResultsPage: React.FC<ResultsPageProps> = ({ setCurrentPage, analysisResults, summary, currentUser, healthData, capturedImage, isPaymentComplete }) => {
  const { t, language } = useLanguage();
  const [eyeTips, setEyeTips] = useState<string>('');
  const [isLoadingTips, setIsLoadingTips] = useState<boolean>(false);
  const [tipsError, setTipsError] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const isReportDataReady = !!currentUser && !!healthData && !!capturedImage && !!analysisResults && !!summary;

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !isReportDataReady) {
      alert("Report data is not fully available. Please try again.");
      return;
    }
    setIsDownloadingPdf(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = canvasWidth / canvasHeight;
      const totalPdfHeight = pdfWidth / ratio;
      
      let position = 0;
      let heightLeft = totalPdfHeight;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save('VirtualVisionTest-Report.pdf');

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  const fetchEyeTips = useCallback(async () => {
    setIsLoadingTips(true);
    setTipsError('');
    try {
      const tips = await getGeneralEyeHealthTips(language);
      setEyeTips(tips);
    } catch (error) {
      console.error("Failed to fetch eye health tips:", error);
      setTipsError(error instanceof Error ? error.message : t('error_generic_unexpected_api'));
    } finally {
      setIsLoadingTips(false);
    }
  }, [language, t]);
  
  useEffect(() => {
    if(isPaymentComplete && analysisResults) {
      fetchEyeTips();
    }
  }, [isPaymentComplete, analysisResults, fetchEyeTips]);


  const renderContent = () => {
    if (!analysisResults && isPaymentComplete) {
      return (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-danger mb-2">{t('auth_error_unexpected')}</h2>
          <p className="text-primary-dark/80 mb-6">
            {t('results_error_loading')}{' '}
            <button onClick={() => setCurrentPage(Page.Support)} className="font-semibold text-accent hover:underline">
              {t('payment_support_link')}
            </button>
            .
          </p>
        </div>
      );
    }

    if (!analysisResults) {
      return <LoadingSpinner text={t('results_loadingSummary')} />;
    }
    
    if (!isPaymentComplete) {
      return (
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-primary-dark mb-2">{t('payment_unlock_title')}</h2>
          <p className="text-primary-dark/80 mb-6">{t('payment_unlock_description')}</p>
          <Button onClick={() => setCurrentPage(Page.Payment)} size="lg" variant="primary">
            {t('results_proceedToPaymentButton')}
          </Button>
        </div>
      );
    }

    // Paid and has results view
    return (
      <>
        {/* Hidden component for PDF generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ReportContents
            ref={reportRef}
            currentUser={currentUser}
            healthData={healthData}
            analysisResults={analysisResults}
            summary={summary || ''}
            capturedImage={capturedImage}
          />
        </div>
        
        <div className="mb-8 p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
            <h3 className="font-semibold text-lg text-primary-dark flex items-center mb-2">
                <LightbulbIcon className="w-6 h-6 mr-2 text-accent" />
                {t('results_summaryTitle')}
            </h3>
            <p className="text-primary-dark leading-relaxed whitespace-pre-wrap">{summary || t('results_loadingSummary')}</p>
        </div>

        {analysisResults.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-primary-dark mb-4">{t('results_detailedFindingsTitle')}</h3>
            <div className="space-y-4">
              {analysisResults.map((result, index) => {
                const styles = getRiskLevelStyles(result.riskLevel);
                const IconComponent = styles.icon;
                return (
                  <div key={index} className={`p-4 border ${styles.borderColor} ${styles.bgColor} rounded-lg shadow`}>
                    <div className="flex items-center mb-2">
                      <span className="mr-2"><IconComponent /></span>
                      <h4 className={`text-lg font-semibold ${styles.textColor}`}>{t(result.conditionKey as keyof TranslationKeys)}</h4>
                      <span className={`ml-auto px-2 py-0.5 text-xs font-medium ${styles.textColor} ${styles.bgColor} border ${styles.borderColor} rounded-full`}>
                        {t(styles.translationKey)} {t('results_riskLevelSuffix')}
                      </span>
                    </div>
                    <p className={`text-sm ${styles.textColor}`}>{t(result.detailsKey as keyof TranslationKeys)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg mb-8">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center"><InfoIcon /> {t('results_importantDisclaimerTitle')}</h4>
          <p className="text-sm text-yellow-700 leading-relaxed">{t('resultsDisclaimer')}</p>
        </div>

        <div className="mb-8 p-4 bg-primary-dark/5 border border-primary-dark/20 rounded-lg">
          <h3 className="font-semibold text-lg text-primary-dark flex items-center mb-3"><LightbulbIcon className="w-6 h-6 mr-2 text-primary-dark" /> {t('results_generalEyeHealthTipsTitle')}</h3>
          {isLoadingTips && <LoadingSpinner size="sm" text={t('results_fetchingTips')} />}
          {tipsError && <p className="text-sm text-danger">{tipsError.startsWith('error_') ? t(tipsError as keyof TranslationKeys) : tipsError}</p>}
          {!isLoadingTips && !tipsError && eyeTips && (
            <div className="text-sm text-primary-dark/90 space-y-2">
              {eyeTips.split('\n').map((tip, idx) => tip.trim() && <p key={idx}>{tip.startsWith('- ') || tip.startsWith('* ') ? tip : `- ${tip}`}</p>)}
            </div>
          )}
        </div>
        
        <div className="text-center space-y-4">
          <Button 
              onClick={handleDownloadPdf} 
              variant="secondary"
              size="lg"
              isLoading={isDownloadingPdf}
              disabled={!isReportDataReady || isDownloadingPdf}
              title={!isReportDataReady ? "Report data not ready" : "Download PDF Report"}
          >
              {isDownloadingPdf ? "Generating..." : "Download PDF Report"}
          </Button>
        </div>
      </>
    );
  };

  return (
    <PageContainer title={t('results_title')} className="max-w-3xl mx-auto">
      <div className="bg-card-bg p-6 sm:p-8 rounded-xl shadow-2xl">
        {renderContent()}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 mt-6 border-t border-gray-200">
            <Button onClick={() => setCurrentPage(Page.Home)} variant="outline">
                {t('results_backToHomeButton')}
            </Button>
            <Button onClick={() => setCurrentPage(Page.Exam)} variant="outline">
                {t('results_performAnotherAnalysisButton')}
            </Button>
        </div>
      </div>
    </PageContainer>
  );
};
