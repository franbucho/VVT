
import React, { useState } from 'react';
import { Page, EvaluationHistoryItem, DoctorNote } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { addDoctorNote } from '../services/firestoreService';
import { Timestamp } from 'firebase/firestore';
import { ReportContents } from '../components/ReportContents';
import { auth } from '../firebase';

interface EvaluationDetailPageProps {
  evaluation: EvaluationHistoryItem;
  setCurrentPage: (page: Page, data?: any) => void;
}

export const EvaluationDetailPage: React.FC<EvaluationDetailPageProps> = ({ evaluation, setCurrentPage }) => {
  const { t } = useLanguage();
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentNotes, setCurrentNotes] = useState<DoctorNote[]>(evaluation.doctorNotes || []);

  const handleAddNote = async () => {
    const currentUser = auth.currentUser;
    if (!noteText.trim() || !currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      await addDoctorNote(evaluation.id, noteText);
      // Optimistically update UI
      const newNote: DoctorNote = {
        text: noteText,
        doctorId: currentUser.uid, 
        doctorName: currentUser.displayName || 'Doctor', // Use display name
        createdAt: new Timestamp(Date.now() / 1000, 0),
      };
      setCurrentNotes(prev => [newNote, ...prev]);
      setNoteText('');
    } catch (err) {
      console.error('Error adding note:', err);
      setError(t('evaluation_detail_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer title={`${t('evaluation_detail_title')}: ${evaluation.patientName}`}>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-8">
            
            <div className="border rounded-lg p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
                 <ReportContents
                    currentUser={{ email: evaluation.healthData.lastName, uid: evaluation.userId } as any}
                    healthData={evaluation.healthData}
                    analysisResults={evaluation.analysisResults}
                    summary={evaluation.summary || ''}
                    capturedImage={evaluation.capturedImage}
                    ophthalmologists={evaluation.ophthalmologists || []}
                    doctorNotes={currentNotes}
                    isForPdf={true}
                    hideOphthalmologistSection={true}
                 />
            </div>
            
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-primary-dark mb-2">{t('evaluation_detail_add_note')}</h3>
                <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md h-28 focus:ring-2 focus:ring-accent focus:border-accent transition-shadow"
                    placeholder={t('evaluation_detail_note_placeholder')}
                    disabled={isLoading}
                    aria-label={t('evaluation_detail_add_note')}
                />
                {error && <p className="text-danger text-sm mt-2">{error}</p>}
                <div className="mt-4 flex justify-between items-center">
                    <Button onClick={() => setCurrentPage(Page.DoctorPortal)} variant="outline">
                        {t('doctor_portal_back_button')}
                    </Button>
                    <Button onClick={handleAddNote} isLoading={isLoading}>
                        {isLoading ? t('evaluation_detail_adding_note') : t('evaluation_detail_add_button')}
                    </Button>
                </div>
            </div>

        </div>
    </PageContainer>
  );
};
