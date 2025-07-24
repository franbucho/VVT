import React from 'react';
import firebase from 'firebase/compat/app';
import { useLanguage } from '../contexts/LanguageContext';
import { EyeAnalysisResult, HealthData, Ophthalmologist, DoctorNote } from '../types';
import { EyeIcon } from '../constants';
import { TranslationKeys } from '../localization/en';

interface ReportContentsProps {
  currentUser: firebase.User | null;
  healthData: HealthData | null;
  analysisResults: EyeAnalysisResult[] | null;
  summary: string;
  capturedImage: string | null;
  ophthalmologists: Ophthalmologist[] | null;
  doctorNotes?: DoctorNote[];
  isForPdf?: boolean;
  pdfPage?: 'summary' | 'details' | 'ophthalmologists';
  hideOphthalmologistSection?: boolean;
}

export const ReportContents = React.forwardRef<HTMLDivElement, ReportContentsProps>(({
  currentUser,
  healthData,
  analysisResults,
  summary,
  capturedImage,
  ophthalmologists,
  doctorNotes,
  isForPdf = false,
  pdfPage,
  hideOphthalmologistSection = false,
}, ref) => {
  const { t } = useLanguage();
  const reportDate = new Date().toLocaleDateString(t('date_locale' as any) || 'en-US');

  const renderQuestionnaireItem = (labelKey: keyof TranslationKeys, value: string | undefined) => {
      const displayValue = value || t('questionnaire_not_answered');
      return (
        <div className="py-2 grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-dark-border">
          <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary col-span-1">{t(labelKey)}</dt>
          {/* For PDF, use a very dark color for high contrast. For web, use theme colors. */}
          <dd className={`text-sm col-span-2 ${isForPdf ? 'font-medium text-gray-900' : 'text-primary-dark dark:text-dark-text-primary'}`}>{displayValue}</dd>
        </div>
      );
  };
  
  const getCheckboxDisplayValues = (group: 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms') => {
      if (!healthData || !healthData[group]) return t('questionnaire_not_answered');

      const getPrefix = (g: typeof group) => {
        switch (g) {
          case 'primaryReason': return 'q1_option';
          case 'illnesses': return 'q4_illness';
          case 'familyHistory': return 'q5_condition';
          case 'symptoms': return 'q6_symptom';
          default: return '';
        }
      };
      
      const healthDataGroup = healthData[group] as Record<string, boolean>;

      const items = Object.entries(healthDataGroup)
          .filter(([, value]) => value)
          .map(([key]) => {
              const keyPrefix = getPrefix(group);
              if (key === 'other' || key === 'otherOrNotSure') return t('q_option_other_not_sure');
              if (key === 'none') return t('q6_symptom_none');
              return t(`${keyPrefix}_${key}` as any);
          });
          
      if (items.includes(t('q6_symptom_none'))) return t('q6_symptom_none');
      
      return items.length > 0 ? items.join(', ') : t('questionnaire_not_answered');
  };

  const getScreenTimeDisplay = () => {
    if (!healthData?.screenTimeHours || healthData.screenTimeHours === '') return t('questionnaire_not_answered');
    const key = `q_screenTime_option_${healthData.screenTimeHours}` as keyof TranslationKeys;
    return t(key);
  };
  
  // Simplified view for the webpage
  if (!isForPdf) {
    return (
        <div ref={ref} className="bg-white dark:bg-dark-card space-y-8">
            <section>
                <div className="bg-blue-50 dark:bg-dark-accent/10 border-l-4 border-accent dark:border-dark-accent p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-primary-dark dark:text-dark-text-primary mb-3">{t('report_ai_summary_title')}</h2>
                    <p className="text-base text-primary-dark dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">{summary || t('results_loadingSummary')}</p>
                </div>
            </section>
             {doctorNotes && doctorNotes.length > 0 && (
                <section>
                    <div className="bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500 p-6 rounded-r-lg shadow-sm">
                        <h2 className="text-xl font-bold text-green-800 dark:text-green-300 mb-3">{t('report_doctor_notes_title')}</h2>
                        {doctorNotes.map((note, index) => (
                           <div key={index} className={`text-sm text-green-900 dark:text-green-200 ${index > 0 ? 'mt-3 pt-3 border-t border-green-200 dark:border-green-500/20' : ''}`}>
                               <p className="italic">"{note.text}"</p>
                               <p className="text-xs text-right mt-1 font-semibold">- {note.doctorName}</p>
                           </div>
                       ))}
                    </div>
                </section>
            )}
             {ophthalmologists && ophthalmologists.length > 0 && !hideOphthalmologistSection && (
              <section>
                  <h2 className="text-lg font-semibold mb-2 text-primary-dark dark:text-dark-text-primary">
                      {t('report_nearby_ophthalmologists')}
                  </h2>
                  <ul className="space-y-2 max-h-72 overflow-y-auto border dark:border-dark-border p-3 rounded-lg bg-gray-50 dark:bg-dark-background">
                      {ophthalmologists.map((doc, idx) => (
                          <li key={idx} className="border-b dark:border-dark-border/50 p-3 rounded-lg bg-white dark:bg-dark-card shadow-sm">
                              <p className="font-bold text-primary-dark dark:text-dark-text-primary">{doc.name}</p>
                              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{doc.specialty}</p>
                              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">{doc.address}</p>
                              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t('report_phone')}: {doc.phone}</p>
                          </li>
                      ))}
                  </ul>
              </section>
            )}
            <section>
                <p className="text-sm text-center text-primary-dark/70 dark:text-dark-text-secondary/70 p-4 bg-gray-50 dark:bg-dark-background rounded-lg">
                    {t('results_download_for_details')}
                </p>
            </section>
        </div>
    );
  }

  // Full, detailed view for the PDF
  return (
    <div ref={ref} className="p-8 font-sans text-base bg-white flex flex-col justify-between" style={{ width: '800px', minHeight: '1123px' }}>
      <div>
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
          {(!pdfPage || pdfPage === 'summary') && (
            <>
              <section>
                <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">{t('report_patient_info')}</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div><strong className="text-gray-600 font-medium">{t('report_patient_name')}:</strong> <span className="font-medium text-gray-900">{healthData?.firstName} {healthData?.lastName}</span></div>
                  <div><strong className="text-gray-600 font-medium">{t('report_patient_dob')}:</strong> <span className="font-medium text-gray-900">{`${healthData?.birthDate.day}/${healthData?.birthDate.month}/${healthData?.birthDate.year}`}</span></div>
                  <div><strong className="text-gray-600 font-medium">{t('report_patient_email')}:</strong> <span className="font-medium text-gray-900">{currentUser?.email}</span></div>
                </div>
              </section>
              <section className="mt-8">
                <div className="bg-blue-50 border-l-4 border-accent p-4 rounded-r-lg">
                  <h2 className="text-lg font-bold text-primary-dark mb-2">{t('report_ai_summary_title')}</h2>
                  <p className="text-sm text-primary-dark leading-relaxed whitespace-pre-wrap">{summary}</p>
                </div>
              </section>
              {doctorNotes && doctorNotes.length > 0 && (
                <section className="mt-8">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h2 className="text-lg font-bold text-green-800 mb-2">{t('report_doctor_notes_title')}</h2>
                    {doctorNotes.map((note, index) => (
                      <div key={index} className={`text-sm text-green-900 ${index > 0 ? 'mt-2 pt-2 border-t border-green-200' : ''}`}>
                        <p className="italic">"{note.text}"</p>
                        <p className="text-xs text-right mt-1 font-semibold">- {note.doctorName}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {(!pdfPage || pdfPage === 'details') && (
            <div className={`grid grid-cols-5 gap-8 ${!pdfPage || pdfPage === 'summary' ? 'mt-8' : ''}`}>
              <section className="col-span-3">
                <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">{t('report_questionnaire_summary')}</h2>
                <dl>
                  {renderQuestionnaireItem('questionnaire_reason', getCheckboxDisplayValues('primaryReason'))}
                  {renderQuestionnaireItem('questionnaire_lenses', healthData?.wearsLenses)}
                  {renderQuestionnaireItem('questionnaire_surgery', healthData?.hadSurgeryOrInjury)}
                  {renderQuestionnaireItem('questionnaire_illnesses', getCheckboxDisplayValues('illnesses'))}
                  {renderQuestionnaireItem('questionnaire_familyHistory', getCheckboxDisplayValues('familyHistory'))}
                  {renderQuestionnaireItem('questionnaire_symptoms', getCheckboxDisplayValues('symptoms'))}
                  {renderQuestionnaireItem('q_screenTime_label', getScreenTimeDisplay())}
                </dl>
              </section>
              <section className="col-span-2">
                <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">{t('report_image_analysis_details')}</h2>
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
          )}

          {(!pdfPage || pdfPage === 'ophthalmologists') && ophthalmologists && ophthalmologists.length > 0 && !hideOphthalmologistSection && (
            <section className="mt-8" style={{ breakInside: 'avoid' }}>
              <h2 className="text-lg font-bold text-primary-dark border-b border-gray-200 pb-2 mb-4">{t('report_nearby_ophthalmologists')}</h2>
              <div className="space-y-3">
                {ophthalmologists.map((doctor, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md text-sm" style={{ breakInside: 'avoid' }}>
                    <p className="font-bold text-primary-dark">{doctor.name}</p>
                    <p className="text-gray-600">{doctor.specialty}</p>
                    <p className="text-gray-600 mt-1">{doctor.address}</p>
                    <p className="text-gray-600">{t('report_phone')}: {doctor.phone}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="text-center text-xs text-gray-500 pt-8 mt-4 border-t">
        <p><strong>{t('results_importantDisclaimerTitle')}:</strong> {t('resultsDisclaimer')}</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} Niria. All Rights Reserved.</p>
      </footer>
    </div>
  );
});