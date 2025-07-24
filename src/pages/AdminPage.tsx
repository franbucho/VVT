import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import firebase from 'firebase/compat/app';
import { functions } from '../firebase';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { Feedback } from '../types';
import { StarIcon } from '../constants';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

interface AdminPageProps {
  currentUser: firebase.User | null;
}

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'feedback'>('users');

  // User management state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackError, setFeedbackError] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true);
    setUserError('');
    try {
      const listUsersCallable = httpsCallable(functions, 'listAllUsers');
      const result = await listUsersCallable();
      setUsers((result.data as any).users);
    } catch (err) {
      setUserError(t('admin_error_load_users'));
      console.error(err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [t]);

  const fetchFeedback = useCallback(async () => {
    setIsFeedbackLoading(true);
    setFeedbackError('');
    try {
        const getFeedbackCallable = httpsCallable(functions, 'getFeedback');
        const result = await getFeedbackCallable();
        const data = (result.data as { feedbackList: Feedback[] }).feedbackList;
        setFeedbackList(data);
    } catch (err) {
        setFeedbackError('Failed to load feedback.');
        console.error(err);
    } finally {
        setIsFeedbackLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab, fetchUsers, fetchFeedback]);

  const handleToggleAdmin = async (uid: string, makeAdmin: boolean) => {
    setUserMessage('');
    setUserError('');

    if (currentUser?.uid === uid && !makeAdmin) {
      setUserError(t('admin_error_self_remove'));
      return;
    }

    setUpdatingUid(uid);

    try {
      const toggleAdminRoleCallable = httpsCallable(functions, 'toggleAdminRole');
      await toggleAdminRoleCallable({ uid, makeAdmin });
      
      setUsers(currentUsers =>
        currentUsers.map(u => u.uid === uid ? { ...u, isAdmin: makeAdmin } : u)
      );
      setUserMessage(t('admin_success_role_update'));
    } catch (err: any) {
      setUserError(err.message || t('admin_error_role_update'));
    } finally {
      setUpdatingUid(null);
    }
  };

  const renderUsersTab = () => (
    <>
      <h2 className="text-2xl font-bold text-primary">{t('admin_manageUsers')}</h2>
      {userMessage && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm">{userMessage}</p>}
      {userError && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{userError}</p>}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {isUsersLoading ? <LoadingSpinner text="Loading users..." className="py-20" /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-primary">{user.displayName || t('admin_no_name')}</div><div className="text-sm text-primary/70">{user.email}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.isAdmin ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('admin_role_admin')}</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{t('admin_role_user')}</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.isAdmin ? <Button onClick={() => handleToggleAdmin(user.uid, false)} variant="danger" size="sm" isLoading={updatingUid === user.uid} disabled={currentUser?.uid === user.uid} title={currentUser?.uid === user.uid ? t('admin_error_self_remove') : ''}>{t('admin_action_remove')}</Button> : <Button onClick={() => handleToggleAdmin(user.uid, true)} variant="secondary" size="sm" isLoading={updatingUid === user.uid}>{t('admin_action_make')}</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderFeedbackTab = () => (
    <>
      <h2 className="text-2xl font-bold text-primary">{t('admin_feedback_title')}</h2>
      {feedbackError && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{feedbackError}</p>}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {isFeedbackLoading ? <LoadingSpinner text="Loading feedback..." className="py-20" /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_feedback_table_header_rating')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_feedback_table_header_comment')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_feedback_table_header_date')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbackList.map(fb => (
                <tr key={fb.id}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-primary/70">{fb.userEmail}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><RatingStars rating={fb.rating} /></td>
                  <td className="px-6 py-4"><p className="text-sm text-primary max-w-sm whitespace-pre-wrap break-words">{fb.comment || 'N/A'}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary/70">{new Date(fb.createdAt).toLocaleDateString(t('date_locale' as any))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  return (
    <PageContainer title={t('admin_title')} className="max-w-6xl mx-auto">
        <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-4 -mb-px" aria-label="Tabs">
                <button onClick={() => setActiveTab('users')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'users' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    {t('admin_tab_users')}
                </button>
                <button onClick={() => setActiveTab('feedback')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'feedback' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    {t('admin_tab_feedback')}
                </button>
            </nav>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
            {activeTab === 'users' ? renderUsersTab() : renderFeedbackTab()}
        </div>
    </PageContainer>
  );
};