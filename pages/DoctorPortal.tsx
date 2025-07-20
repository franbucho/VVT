import React, { useState, useEffect, useCallback } from 'react';
import { Page, EvaluationHistoryItem } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllEvaluations } from '../services/firestoreService';
import { InputField } from '../components/common/InputField';

interface DoctorPortalProps {
  setCurrentPage: (page: Page, data?: any) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const [evaluations, setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPageNum] = useState(1);
  const evaluationsPerPage = 5;

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

  const filteredEvaluations = evaluations.filter(
    (item) =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvaluations.length / evaluationsPerPage);
  const paginatedEvaluations = filteredEvaluations.slice(
    (currentPage - 1) * evaluationsPerPage,
    currentPage * evaluationsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPageNum(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPageNum(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPageNum(currentPage - 1);
    }
  };

  return (
    <PageContainer title={t('doctor_portal_title')}>
        <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl">
            {isLoading ? (
                <LoadingSpinner text={t('doctor_portal_loading')} className="py-20" />
            ) : error ? (
                <p className="text-center text-danger bg-red-50 p-4 rounded-md">{error}</p>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row justify-end sm:items-center mb-4 gap-4">
                        <div className="w-full sm:w-72">
                            <InputField
                                label=""
                                id="evaluation-search"
                                type="search"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder={t('doctor_portal_search_placeholder')}
                                wrapperClassName="!mb-0"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                            <thead className="bg-primary-dark/5 dark:bg-dark-background/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('doctor_portal_table_patient')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('doctor_portal_table_date')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('doctor_portal_table_status')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('doctor_portal_table_action')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                                {paginatedEvaluations.length > 0 ? paginatedEvaluations.map((item) => {
                                    const isResponded = item.status === 'responded' || (item.doctorNotes && item.doctorNotes.length > 0);
                                    return (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-dark dark:text-dark-text-primary">{item.patientName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/80 dark:text-dark-text-secondary">{item.createdAt.toDate().toLocaleString(t('date_locale' as any))}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {isResponded ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
                                                    {t('doctor_portal_status_responded')}
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300">
                                                    {t('doctor_portal_status_pending')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button onClick={() => setCurrentPage(Page.EvaluationDetail, { evaluation: item })} size="sm">
                                                {isResponded ? t('doctor_portal_view_button') : t('doctor_portal_review_button')}
                                            </Button>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-primary-dark/70 dark:text-dark-text-secondary">
                                            {searchQuery ? t('doctor_portal_no_match') : t('doctor_portal_no_evals')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="px-6 py-3 bg-white dark:bg-dark-card border-t dark:border-dark-border flex items-center justify-between">
                                <span className="text-sm text-primary/70 dark:text-dark-text-secondary">
                                    {t('pagination_page_info', { currentPage, totalPages })}
                                </span>
                                <div className="flex space-x-2">
                                <Button onClick={handlePrevPage} disabled={currentPage === 1} size="sm" variant="outline">{t('pagination_previous')}</Button>
                                <Button onClick={handleNextPage} disabled={currentPage === totalPages} size="sm" variant="outline">{t('pagination_next')}</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    </PageContainer>
  );
};