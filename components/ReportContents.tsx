// src/components/ReportContents.tsx

import React from 'react';
import { User } from 'firebase/auth';
import { EyeAnalysisResult, HealthData } from '../types';
import { EyeIcon } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKeys } from '../localization/en';

// Componentes auxiliares para un diseño estructurado
const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
      <div className="w-1 h-6 bg-cyan-500 rounded-full mr-3"></div>
      {title}
    </h3>
    {children}
  </div>
);

const DataRow: React.FC<{ label: string; value?: React.ReactNode; icon?: string }> = ({ label, value, icon }) => (
  (value || value === 0) ? (
    <div className="flex justify-between py-3 border-b border-gray-100">
      <div className="flex items-center w-2/5 pr-2">
        {icon && <span className="mr-2 text-cyan-500">{icon}</span>}
        <p className="font-semibold text-blue-900">{label}:</p>
      </div>
      <p className="text-left w-3/5 text-blue-900">{String(value)}</p>
    </div>
  ) : null
);

interface ReportContentsProps {
  currentUser: User | null;
  healthData: HealthData | null;
  analysisResults: EyeAnalysisResult[] | null;
  capturedImage: string | null;
  summary: string | null;
}

const getRiskLevelStyles = (riskLevel: EyeAnalysisResult['riskLevel']) => {
  switch (riskLevel) {
    case 'Low': return 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-200';
    case 'Medium': return 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-amber-200';
    case 'High': return 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-200';
    default: return 'bg-gradient-to-r from-slate-500 to-gray-500 shadow-gray-200';
  }
};

const getRiskIconColor = (riskLevel: EyeAnalysisResult['riskLevel']) => {
  switch (riskLevel) {
    case 'Low': return 'text-emerald-600';
    case 'Medium': return 'text-amber-600';
    case 'High': return 'text-red-600';
    default: return 'text-slate-600';
  }
};

export const ReportContents = React.forwardRef<HTMLDivElement, ReportContentsProps>(
  ({ currentUser, healthData, analysisResults, capturedImage, summary }, ref) => {
    const { t } = useLanguage();
    const reportDate = new Date().toLocaleDateString(t('date_locale' as any));

    const renderHealthData = (data: HealthData) => {
      const getRadioDisplayValue = (value: 'yes' | 'no' | 'other' | '') => {
        if (!value) return t('questionnaire_not_answered');
        if (value === 'yes') return t('q2_yes');
        if (value === 'no') return t('q2_no');
        return t('q_option_other_not_sure');
      };

      const getListDisplayValue = (list: string[] | undefined, group: 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms' | 'occupationalHazards') => {
        if (!list || list.length === 0) return t('questionnaire_not_answered');
        if (list.includes('none')) {
             if (group === 'occupationalHazards') return t('hazards_none');
             return t('q_option_none_of_the_above');
        }

        const keyPrefixMap: Record<string, string> = {
          primaryReason: 'q1_reason_',
          illnesses: 'q4_illness_',
          familyHistory: 'q5_condition_',
          symptoms: 'q6_symptom_',
          occupationalHazards: 'hazards_'
        };
        const prefix = keyPrefixMap[group];
        return list.map(item => t(`${prefix}${item}` as keyof TranslationKeys)).join(', ');
      };
      
      const getScreenTimeDisplayValue = (value: string | undefined) => {
        if (!value) return t('questionnaire_not_answered');
        const key = `screen_time_${value.replace(/ /g, '_').replace('>', 'more_than_').replace('<', 'less_than_')}` as keyof TranslationKeys;
        return t(key) || value;
      };
      
      return (
        <div className="space-y-1">
          <DataRow label={t('questionnaire_reason')} value={getListDisplayValue(data.primaryReason, 'primaryReason')} />
          <DataRow label={t('questionnaire_lenses')} value={getRadioDisplayValue(data.wearsLenses)} />
          {data.wearsLenses === 'yes' && (
            <>
              <DataRow label={t('questionnaire_satisfactionLabel')} value={data.lensesSatisfaction || t('questionnaire_not_answered')} />
              <DataRow label={t('questionnaire_lastUpdateLabel')} value={data.lensesLastUpdate || t('questionnaire_not_answered')} />
            </>
          )}
          <DataRow label={t('questionnaire_surgery')} value={getRadioDisplayValue(data.hadSurgeryOrInjury)} />
          {data.hadSurgeryOrInjury === 'yes' && (
            <DataRow label={t('questionnaire_surgeryOrInjuryDetails')} value={data.surgeryOrInjuryDetails || t('questionnaire_not_answered')} />
          )}
          <DataRow label={t('questionnaire_illnesses')} value={getListDisplayValue(data.illnesses, 'illnesses')} />
          <DataRow label={t('questionnaire_familyHistory')} value={getListDisplayValue(data.familyHistory, 'familyHistory')} />
          <DataRow label={t('questionnaire_symptoms')} value={getListDisplayValue(data.symptoms, 'symptoms')} />
          <DataRow label={t('questionnaire_screenTime_label')} value={getScreenTimeDisplayValue(data.screenTime)} />
          <DataRow label={t('questionnaire_occupationalHazards_label')} value={getListDisplayValue(data.occupationalHazards, 'occupationalHazards')} />
        </div>
      );
    };

    return (
      <div ref={ref} className="bg-white text-slate-800 font-sans" style={{ width: '800px', margin: '0 auto' }}>
        {/* --- PÁGINA 1 --- */}
        <div className="p-10 flex flex-col" style={{ minHeight: '1122px', position: 'relative' }}>
          <header className="border-b-4 border-cyan-500 pb-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-cyan-500 rounded-full p-3"><EyeIcon className="w-12 h-12 text-white" /></div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-900">{t('appName')}</h1>
                  <p className="text-cyan-500 text-sm font-medium">Vision Analysis Report</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-cyan-500 text-sm font-medium">{t('report_date_generated')}</p>
                <p className="text-blue-900 text-lg font-semibold">{reportDate}</p>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">{t('report_confidential_title')}</h1>
              <div className="w-24 h-1 bg-cyan-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <InfoCard title={t('report_patient_info')}>
                <div className="space-y-1">
                  <DataRow label={t('report_patient_name')} value={healthData ? `${healthData.firstName} ${healthData.lastName}` : ''} />
                  <DataRow label={t('report_patient_email')} value={currentUser?.email} />
                  <DataRow label={t('report_patient_dob')} value={healthData ? `${healthData.birthDate.day}/${healthData.birthDate.month}/${healthData.birthDate.year}` : ''} />
                </div>
              </InfoCard>
              <InfoCard title={t('report_submitted_image')}>
                {capturedImage && <img src={capturedImage} alt={t('report_submitted_image')} className="rounded-lg shadow-lg border-2 border-gray-200 mx-auto" style={{ maxWidth: '200px' }} />}
              </InfoCard>
            </div>

            {summary && (
              <InfoCard title={t('report_ai_summary_title')} className="bg-cyan-50 border-cyan-200">
                <div className="prose prose-sm max-w-none text-blue-900 leading-relaxed">
                  {summary.split('\n').map((p, i) => <p key={i} className="mb-3 last:mb-0">{p}</p>)}
                </div>
              </InfoCard>
            )}
          </main>
          
          <footer className="text-center text-xs text-gray-400 pt-4 mt-auto">Página 1 de 2</footer>
        </div>

        {/* --- SALTO DE PÁGINA --- */}
        <div style={{ pageBreakAfter: 'always' }}></div>

        {/* --- PÁGINA 2 --- */}
        <div className="p-10 flex flex-col" style={{ minHeight: '1122px', position: 'relative' }}>
           <header className="border-b-2 border-gray-200 pb-4 mb-8">
             <h2 className="text-2xl font-bold text-blue-900">{t('report_page2_header')}</h2>
           </header>
          
          <main className="flex-grow space-y-8">
            {analysisResults && analysisResults.length > 0 && (
              <div className="page-break-inside-avoid">
                <InfoCard title={t('report_image_analysis_details')}>
                  <div className="space-y-3">
                      {analysisResults.map((result, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-blue-900 flex items-center">
                              <span className={`mr-2 ${getRiskIconColor(result.riskLevel)}`}>👁️</span>
                              {t(result.conditionKey as any)}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-semibold text-white ${getRiskLevelStyles(result.riskLevel)} rounded-full`}>
                              {t(`results_risk_${result.riskLevel.toLowerCase()}` as any)} {t('results_riskLevelSuffix')}
                            </span>
                          </div>
                          <p className="text-xs text-blue-900 leading-relaxed">{t(result.detailsKey as any)}</p>
                        </div>
                      ))}
                  </div>
                </InfoCard>
              </div>
            )}
            
            {healthData && (
              <div className="page-break-inside-avoid">
                <InfoCard title={t('report_questionnaire_summary')}>
                    {renderHealthData(healthData)}
                </InfoCard>
              </div>
            )}
          </main>

          <footer className="bg-gray-50 px-8 py-6 border-t border-gray-200 mt-auto">
            <div className="text-center">
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 text-red-700 text-xs text-left">
                <strong>{t('results_importantDisclaimerTitle')}:</strong> {t('resultsDisclaimer')}
              </div>
              <p className="text-xs text-blue-900 mt-4">
                © {new Date().getFullYear()} {t('footerText')}
              </p>
              <p className="text-xs text-gray-400 mt-2">Página 2 de 2</p>
            </div>
          </footer>
        </div>
      </div>
    );
  }
);