import React, { useState } from 'react';
import { Page, EvaluationHistoryItem, DoctorNote, HealthData } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { addDoctorNote } from '../services/firestoreService';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase';
import { TranslationKeys } from '../localization/en';

interface EvaluationDetailPageProps {
  evaluation: EvaluationHistoryItem;
  setCurrentPage: (page: Page, data?: any) => void;
}

const QuestionnaireSummary: React.FC<{ healthData: HealthData, t: (key: keyof TranslationKeys, replacements?: Record<string, string | number>) => string }> = ({ healthData, t }) => {
    
    const getCheckboxDisplayValues = (group: keyof Pick<HealthData, 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms'>) => {
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
              if (key === 'other' || key === 'otherOrNotSure') return t('q_option_other_not_sure');
              if (key === 'none') return t('q6_symptom_none');
              const keyPrefix = getPrefix(group);
              return t(`${keyPrefix}_${key}` as any);
          });
          
      if (items.includes(t('q6_symptom_none'))) return t('q6_symptom_none');
      return items.length > 0 ? items.join(', ') : t('questionnaire_not_answered');
  };
    
    return (
        <dl className="space-y-3">
            <div className="text-sm"><dt className="font-semibold text-primary-dark/80 dark:text-dark-text-secondary">{t('questionnaire_reason')}</dt><dd className="text-primary-dark dark:text-dark-text-primary">{getCheckboxDisplayValues('primaryReason')}</dd></div>
            <div className="text-sm"><dt className="font-semibold text-primary-dark/80 dark:text-dark-text-secondary">{t('questionnaire_lenses')}</dt><dd className="text-primary-dark dark:text-dark-text-primary">{healthData.wearsLenses || t('questionnaire_not_answered')}</dd></div>
            <div className="text-sm"><dt className="font-semibold text-primary-dark/80 dark:text-dark-text-secondary">{t('questionnaire_surgery')}</dt><dd className="text-primary-dark dark:text-dark-text-primary">{healthData.hadSurgeryOrInjury || t('questionnaire_not_answered')}</dd></div>
            <div className="text-sm"><dt className="font-semibold text-primary-dark/80 dark:text-dark-text-secondary">{t('questionnaire_illnesses')}</dt><dd className="text-primary-dark dark:text-dark-text-primary">{getCheckboxDisplayValues('illnesses')}</dd></div>
            <div className="text-sm"><dt className="font-semibold text-primary-dark/80 dark:text-dark-text-secondary">{t('questionnaire_familyHistory')}</dt><dd className="text-primary-dark dark:text-dark-text-primary">{getCheckboxDisplayValues('familyHistory')}</dd></div>
            <div className="text-sm"><dt className="font-semibold text-primary-dark/80 dark:text-dark-text-secondary">{t('questionnaire_symptoms')}</dt><dd className="text-primary-dark dark:text-dark-text-primary">{getCheckboxDisplayValues('symptoms')}</dd></div>
        </dl>
    );
};


export const EvaluationDetailPage: React.FC<EvaluationDetailPageProps> = ({ evaluation, setCurrentPage }) => {
  const { t } = useLanguage();
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentNotes, setCurrentNotes] = useState<DoctorNote[]>(evaluation.doctorNotes || []);
  const currentUser = auth.currentUser;

  const handleAddNote = async () => {
    if (!noteText.trim() || !currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      await addDoctorNote(evaluation.id, noteText);
      const newNote: DoctorNote = {
        text: noteText,
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || 'Doctor',
        createdAt: firebase.firestore.Timestamp.now(),
      };
      setCurrentNotes(prev => [newNote, ...prev]);
      setNoteText('');
    } catch (err) {
      console.error('Error adding note:', err);
      const errorMessage = err instanceof Error ? err.message : t('evaluation_detail_error');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedNotes = [...currentNotes].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <PageContainer title={`${t('evaluation_detail_title')}: ${evaluation.patientName}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Image (smaller) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-xl sticky top-24">
             <h3 className="text-lg font-semibold text-primary-dark dark:text-dark-text-primary mb-4 border-b dark:border-dark-border pb-2">{t('report_submitted_image')}</h3>
            <img src={evaluation.capturedImage} alt="Patient's eye" className="rounded-lg shadow-md w-full border dark:border-dark-border" />
          </div>
        </div>

        {/* Right Column: AI Analysis, Questionnaire, and Doctor's Notes (larger) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold text-primary-dark dark:text-dark-text-primary mb-4 border-b dark:border-dark-border pb-2">{t('report_ai_summary_title')}</h3>
            <p className="text-sm text-primary-dark dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap mb-4">{evaluation.summary}</p>
            {evaluation.analysisResults && evaluation.analysisResults.length > 0 && (
                <ul className="space-y-2">
                    {evaluation.analysisResults.map((result, index) => (
                      <li key={index} className="p-2 bg-gray-50 dark:bg-dark-background/50 rounded-md text-sm">
                        <strong className="text-primary-dark dark:text-dark-text-primary">{t(result.conditionKey as any)}:</strong>
                        <span className="font-semibold ml-2 text-primary-dark/80 dark:text-dark-text-secondary">{t(`results_risk_${result.riskLevel.toLowerCase()}` as any)}</span>
                      </li>
                    ))}
                  </ul>
            )}
          </div>
          
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-xl">
             <h3 className="text-lg font-semibold text-primary-dark dark:text-dark-text-primary mb-4 border-b dark:border-dark-border pb-2">{t('report_questionnaire_summary')}</h3>
            <QuestionnaireSummary healthData={evaluation.healthData} t={t} />
          </div>

          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold text-primary-dark dark:text-dark-text-primary mb-4">{t('evaluation_detail_add_note')}</h3>
            <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-md h-28 focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent focus:border-accent dark:focus:border-dark-accent transition-shadow bg-white dark:bg-dark-background dark:text-dark-text-primary"
                placeholder={t('evaluation_detail_note_placeholder')}
                disabled={isLoading}
                aria-label={t('evaluation_detail_add_note')}
            />
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
            <div className="mt-4 flex justify-end">
                <Button onClick={handleAddNote} isLoading={isLoading}>
                    {isLoading ? t('evaluation_detail_adding_note') : t('evaluation_detail_add_button')}
                </Button>
            </div>
          </div>
          
           {sortedNotes.length > 0 && (
              <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-xl">
                  <h3 className="text-lg font-semibold text-primary-dark dark:text-dark-text-primary mb-4">{t('evaluation_detail_previous_notes')}</h3>
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {sortedNotes.map((note, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-dark-background/50 border-l-4 border-gray-300 dark:border-dark-border p-3 rounded-r-md">
                              <p className="text-sm text-primary-dark dark:text-dark-text-secondary italic">"{note.text}"</p>
                              <p className="text-xs text-right text-gray-500 dark:text-dark-text-secondary/80 mt-2">
                                  - {note.doctorName} ({note.createdAt.toDate().toLocaleDateString(t('date_locale' as any))})
                              </p>
                          </div>
                      ))}
                  </div>
              </div>
            )}
        </div>
      </div>
      <div className="mt-8 pt-6 border-t dark:border-dark-border">
          <Button onClick={() => setCurrentPage(Page.DoctorPortal)} variant="outline">
              {t('doctor_portal_back_button')}
          </Button>
      </div>
    </PageContainer>
  );
};