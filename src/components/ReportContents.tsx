// src/components/ReportContents.tsx

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { EyeAnalysisResult, HealthData } from '../types';
import { User } from 'firebase/auth';
import { EyeIcon } from '../constants';

interface ReportContentsProps {
  currentUser: User | null;
  healthData: HealthData | null;
  analysisResults: EyeAnalysisResult[] | null;
  summary: string;
  capturedImage: string | null;
}

export const ReportContents = React.forwardRef<HTMLDivElement, ReportContentsProps>(({
  currentUser,
  healthData,
  analysisResults,
  summary,
  capturedImage,
}, ref) => {
  const { t } = useLanguage();
  const reportDate = new Date().toLocaleDateString(t('date_locale' as any) || 'en-US');

  const renderQuestionnaireItem = (labelKey: any, value: string | undefined | string[]) => {
      const displayValue = Array.isArray(value) ? (value.length > 0 ? value.join(', ') : t('questionnaire_not_answered')) : (value || t('questionnaire_not_answered'));
      return (
        <div className="py-2 grid grid-cols-3 gap-4 border-b border-gray-100">
          <dt className="text-sm font-medium text-gray-500 col-span-1">{t(labelKey)}</dt>
          <dd className="text-sm text-primary-dark col-span-2">{displayValue}</dd>
        </div>
      );
  };
  
  const getCheckboxDisplayValues = (group: 'illnesses' | 'familyHistory' | 'symptoms') => {
      if (!healthData || !healthData[group]) return t('questionnaire_not_answered');

      const getPrefix = (g: 'illnesses' | 'familyHistory' | 'symptoms') => {
        switch (g) {
          case 'illnesses': return 'q4_illness';
          case 'familyHistory': return 'q5_condition';
          case 'symptoms': return 'q6_symptom';
          default: return '';
        }
      };

      const items = Object.entries(healthData[group])
          .filter(([, value]) => value)
          .map(([key]) => {
              const keyPrefix = getPrefix(group);
              if (key === 'otherOrNotSure') return t('q_option_other_not_sure');
              if (key === 'none') return t('q6_symptom_none');
              return t(`${keyPrefix}_${key}` as any);
          });
          
      if (items.includes(t('q6_symptom_none'))) return t('q6_symptom_none');
      
      return items.length > 0 ? items.join(', ') : t('questionnaire_not_answered');
  };

  return (
    <div ref={ref} className="p-8 font-sans text-base bg-white" style={{ width: '800px' }}>
      
      <header className="flex items-center justify-between pb-4 border-b-2 border-accent">
        <div className="flex items-center">
          <EyeIcon className="h-8 w-8 text-accent mr-3" />
          <h1 className="text-2xl font-bold text-primary-dark">Niria</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-primary-dark">{t('report_confidential_title')}</p>
          <p className="text-xs text-gray-500">{t('report_date_generated')}: {reportDate}</p>
        </div>
      </header>

      <main className="mt-8">
        <section>
          <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">
            {t('report_patient_info')}
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><strong className="text-gray-600">{t('report_patient_name')}:</strong> {healthData?.firstName} {healthData?.lastName}</div>
            <div><strong className="text-gray-600">{t('report_patient_dob')}:</strong> {`${healthData?.birthDate.day}/${healthData?.birthDate.month}/${healthData?.birthDate.year}`}</div>
            <div><strong className="text-gray-600">{t('report_patient_email')}:</strong> {currentUser?.email}</div>
          </div>
        </section>

        <section className="mt-8">
          <div className="bg-blue-50 border-l-4 border-accent p-4 rounded-r-lg">
            <h2 className="text-lg font-bold text-primary-dark mb-2">{t('report_ai_summary_title')}</h2>
            <p className="text-sm text-primary-dark leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-5 gap-8">
          
          <section className="col-span-3">
            <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">
              {t('report_questionnaire_summary')}
            </h2>
            <dl>
              {renderQuestionnaireItem('questionnaire_reason', healthData?.primaryReason)}
              {renderQuestionnaireItem('questionnaire_lenses', healthData?.wearsLenses)}
              {renderQuestionnaireItem('questionnaire_surgery', healthData?.hadSurgeryOrInjury)}
              {renderQuestionnaireItem('questionnaire_illnesses', getCheckboxDisplayValues('illnesses'))}
              {renderQuestionnaireItem('questionnaire_familyHistory', getCheckboxDisplayValues('familyHistory'))}
              {renderQuestionnaireItem('questionnaire_symptoms', getCheckboxDisplayValues('symptoms'))}
            </dl>
          </section>

          <section className="col-span-2">
            <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">
              {t('report_image_analysis_details')}
            </h2>
            {capturedImage && (
              <div className="mb-4">
                <img src={capturedImage} alt="Submitted eye" className="rounded-lg shadow-md w-full" />
                <p className="text-xs text-center text-gray-500 mt-1">{t('report_submitted_image')}</p>
              </div>
            )}
            {analysisResults && analysisResults.length > 0 ? (
              <ul className="space-y-2">
                {analysisResults.map((result, index) => (
                  <li key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                    <strong className="text-primary-dark">{t(result.conditionKey as any)}:</strong>
                    <span className="font-semibold ml-2">{t(`results_risk_${result.riskLevel.toLowerCase()}` as any)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">{t('report_no_findings')}</p>
            )}
          </section>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 pt-8 mt-8 border-t">
        <p><strong>{t('results_importantDisclaimerTitle')}:</strong> {t('resultsDisclaimer')}</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} Niria. All Rights Reserved.</p>
      </footer>
    </div>
  );
});