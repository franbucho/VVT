
import React, { useState, useEffect, useCallback } from 'react';
import { Page, EvaluationHistoryItem } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllEvaluations } from '../services/firestoreService';

interface DoctorPortalProps {
  setCurrentPage: (page: Page, data?: any) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllEvaluations();
      setEvaluations(data);
    } catch (err) {
      console.error(err);
      setError(t('doctor_portal_error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return (
    <PageContainer title={t('doctor_portal_title')}>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
            {isLoading ? (
                <LoadingSpinner text={t('doctor_portal_loading')} className="py-20" />
            ) : error ? (
                <p className="text-center text-danger bg-red-50 p-4 rounded-md">{error}</p>
            ) : (
                <div className="overflow-x-auto">
                    {evaluations.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-primary-dark/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('doctor_portal_table_patient')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('doctor_portal_table_date')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-primary/80 uppercase tracking-wider">{t('doctor_portal_table_action')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {evaluations.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-dark">{item.patientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/80">{item.createdAt.toDate().toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button onClick={() => setCurrentPage(Page.EvaluationDetail, { evaluation: item })} size="sm">
                                                {t('doctor_portal_review_button')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-primary-dark/70 py-10">{t('doctor_portal_no_evals')}</p>
                    )}
                </div>
            )}
        </div>
    </PageContainer>
  );
};
