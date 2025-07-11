
import React from 'react';
import { User } from 'firebase/auth';
import { EyeAnalysisResult, HealthData } from '../types';
import { EyeIcon } from '../constants';
import { TranslationKeys } from '../localization/en';

// Helper components for structured data
const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 page-break-inside-avoid">
    <h2 className="text-xl font-bold text-primary border-b-2 border-gray-200 pb-2 mb-3">{title}</h2>
    <div className="text-sm text-primary">{children}</div>
  </div>
);

const DataRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    value ? (
        <div className="flex justify-between py-1.5 border-b border-gray-100">
            <p className="font-semibold text-primary/80 w-2/5 pr-2">{label}:</p>
            <p className="text-left w-3/5">{String(value)}</p>
        </div>
    ) : null
);

interface ReportContentsProps {
  user: User | null;
  questionnaireAnswers: HealthData | null;
  analysisResults: EyeAnalysisResult[] | null;
  imageSrc: string | null;
  summary?: string | null;
  t: (key: keyof TranslationKeys, replacements?: Record<string, string | number>) => string;
}

const getRiskLevelStyles = (riskLevel: EyeAnalysisResult['riskLevel']) => {
  switch (riskLevel) {
    case 'Low': return 'bg-green-600';
    case 'Medium': return 'bg-yellow-600';
    case 'High': return 'bg-red-600';
    default: return 'bg-gray-600';
  }
};

export const ReportContents = React.forwardRef<HTMLDivElement, ReportContentsProps>(
  ({ user, questionnaireAnswers, analysisResults, imageSrc, summary, t }, ref) => {

    const renderHealthData = (data: HealthData) => {
      const getRadioDisplayValue = (value: 'yes' | 'no' | 'other' | '') => {
        if (value === 'yes') return t('q2_yes');
        if (value === 'no') return t('q2_no');
        if (value === 'other') return t('q_option_other_not_sure');
        return 'N/A';
      };

      const getCheckboxList = (group: 'illnesses' | 'familyHistory' | 'symptoms') => {
        let items = Object.entries(data[group])
          .filter(([, value]) => value)
          .map(([key]) => {
            if (key === 'otherOrNotSure') return t('q_option_other_not_sure');
            const keyPrefix = group === 'illnesses' ? 'q4_illness' : group === 'familyHistory' ? 'q5_condition' : 'q6_symptom';
            return t(`${keyPrefix}_${key}` as any);
          });
        
        if (items.includes(t('q6_symptom_none'))) return t('q6_symptom_none');
        if (items.includes(t('q_option_other_not_sure'))) return t('q_option_other_not_sure');

        return items.length > 0 ? items.join(', ') : 'None reported';
      };

      const birthDate = data.birthDate;
      const birthDateString = birthDate && birthDate.day && birthDate.month && birthDate.year
        ? `${birthDate.day}/${birthDate.month}/${birthDate.year}`
        : 'N/A';
        
      return (
        <div className="space-y-1">
          <DataRow label={t('q_dob_label')} value={birthDateString} />
          <DataRow label={t('q1_label_new')} value={data.primaryReason || 'N/A'} />
          <DataRow label={t('q2_label')} value={getRadioDisplayValue(data.wearsLenses)} />
          {data.wearsLenses === 'yes' && (
            <>
              <DataRow label={t('q2_satisfactionLabel')} value={data.lensesSatisfaction || 'N/A'} />
              <DataRow label={t('q2_lastUpdateLabel')} value={data.lensesLastUpdate || 'N/A'} />
            </>
          )}
          <DataRow label={t('q3_label')} value={getRadioDisplayValue(data.hadSurgeryOrInjury)} />
          {data.hadSurgeryOrInjury === 'yes' && (
            <DataRow label={t('q3_detailsLabel')} value={data.surgeryOrInjuryDetails || 'N/A'} />
          )}
          <DataRow label={t('q4_label')} value={getCheckboxList('illnesses')} />
          <DataRow label={t('q5_label')} value={getCheckboxList('familyHistory')} />
          <DataRow label={t('q6_label')} value={getCheckboxList('symptoms')} />
        </div>
      );
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black font-sans" style={{ width: '800px' }}>
        <header className="flex items-center justify-between mb-8 border-b-2 border-accent pb-4">
          <div className="flex items-center space-x-3">
            <EyeIcon className="w-12 h-12 text-accent" />
            <h1 className="text-3xl font-bold text-primary">{t('appName')}</h1>
          </div>
          <p className="text-gray-500 text-sm">Date Generated: {new Date().toLocaleDateString()}</p>
        </header>

        <main>
          <h1 className="text-2xl font-bold text-center text-primary mb-8">Confidential Eye Health Report</h1>

          <ReportSection title="Patient Information">
            <DataRow label="Name" value={`${questionnaireAnswers?.firstName || ''} ${questionnaireAnswers?.lastName || ''}`} />
            <DataRow label="Email" value={user?.email} />
          </ReportSection>

          {summary && (
             <ReportSection title={t('results_summaryTitle')}>
                <div className="prose prose-sm max-w-none text-primary">
                  {summary.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
            </ReportSection>
          )}

          {questionnaireAnswers && (
            <ReportSection title="Questionnaire Summary">
              {renderHealthData(questionnaireAnswers)}
            </ReportSection>
          )}

          <ReportSection title="AI Image Analysis Details">
            {analysisResults && analysisResults.length > 0 ? (
              <div className="space-y-3">
                {analysisResults.map((result, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-primary/5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-bold text-primary">{t(result.conditionKey as any)}</h4>
                      <span className={`px-3 py-1 text-xs font-semibold text-white ${getRiskLevelStyles(result.riskLevel)} rounded-full`}>
                        {t(`results_risk_${result.riskLevel.toLowerCase()}` as any)} {t('results_riskLevelSuffix')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-primary/80">{t(result.detailsKey as any)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>The initial image analysis did not detect any immediate signs of major conditions.</p>
            )}
          </ReportSection>
          
          <ReportSection title="Submitted Eye Image">
            {imageSrc ? (
              <div className="flex justify-center mt-2">
                <img src={imageSrc} alt="User's eye" style={{ maxWidth: '300px', borderRadius: '8px', border: '1px solid #ccc' }}/>
              </div>
            ) : (
              <p>No image was provided.</p>
            )}
          </ReportSection>
        </main>
        
        <footer className="mt-10 pt-4 border-t-2 border-gray-200">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md">
                <p className="font-bold">Disclaimer</p>
                <p className="text-sm">This report was generated by an AI and is for informational purposes only. It is NOT a medical diagnosis. Please consult a qualified ophthalmologist.</p>
            </div>
             <p className="text-center text-xs text-primary/70 mt-4">&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    );
  }
);
