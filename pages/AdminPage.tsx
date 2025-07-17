
import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { Feedback } from '../types';
import { StarIcon } from '../constants';
import { auth } from '../firebase';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  isPremium: boolean;
  isDoctor: boolean;
}

interface AdminPageProps {
  currentUser: User | null;
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

  const [users, setUsers] = useState<AppUser[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackError, setFeedbackError] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    setIsUsersLoading(true);
    setUserError('');
    try {
      const token = await currentUser.getIdToken();
      const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/listAllUsers';
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch users');
      }
      const result = await response.json();
      setUsers(result.users);
    } catch (err: any) {
      setUserError(err.message || t('admin_error_load_users'));
      console.error(err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [t, currentUser]);

  const fetchFeedback = useCallback(async () => {
    if (!currentUser) return;
    setIsFeedbackLoading(true);
    setFeedbackError('');
    try {
      const token = await currentUser.getIdToken();
      const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/getFeedback';
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to load feedback');
      }
      const result = await response.json();
      setFeedbackList(result.feedbackList);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to load feedback.');
      console.error(err);
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [currentUser]);


  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab, fetchUsers, fetchFeedback]);

  const handleToggleRole = useCallback(async (uid: string, role: 'admin' | 'premium' | 'doctor', status: boolean) => {
    if (!currentUser) return;
    setUserMessage('');
    setUserError('');

    if (currentUser?.uid === uid && role === 'admin' && !status) {
      setUserError(t('admin_error_self_remove'));
      return;
    }

    setUpdatingUid(uid);

    try {
      const token = await currentUser.getIdToken();
      const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/toggleUserRole';
      const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uid, role, status })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to toggle role');
      }

      setUsers((current) =>
        current.map((u) => {
          if (u.uid === uid) {
            const updatedUser = { ...u };
            if (role === 'admin') updatedUser.isAdmin = status;
            if (role === 'premium') updatedUser.isPremium = status;
            if (role === 'doctor') updatedUser.isDoctor = status;
            return updatedUser;
          }
          return u;
        })
      );

      setUserMessage(t('admin_success_role_update'));
    } catch (err: any) {
      console.error('toggleUserRole error:', err);
      setUserError(err?.message || t('admin_error_role_update'));
    } finally {
      setUpdatingUid(null);
    }
  }, [currentUser, t]);

  const RoleBadge: React.FC<{ user: AppUser }> = ({ user }) => {
    if (user.isAdmin) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('admin_role_admin')}</span>;
    }
    if (user.isDoctor) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">{t('admin_role_doctor')}</span>;
    }
    if (user.isPremium) {
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{t('admin_role_premium')}</span>;
    }
    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{t('admin_role_user')}</span>;
  }

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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary">{user.displayName || t('admin_no_name')}</div>
                    <div className="text-sm text-primary/70">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><RoleBadge user={user} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button onClick={() => handleToggleRole(user.uid, 'premium', !user.isPremium)} variant={user.isPremium ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid}>
                      {user.isPremium ? t('admin_action_remove_premium') : t('admin_action_make_premium')}
                    </Button>
                    <Button onClick={() => handleToggleRole(user.uid, 'doctor', !user.isDoctor)} variant={user.isDoctor ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid}>
                      {user.isDoctor ? t('admin_action_remove_doctor') : t('admin_action_make_doctor')}
                    </Button>
                    <Button onClick={() => handleToggleRole(user.uid, 'admin', !user.isAdmin)} variant={user.isAdmin ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid} disabled={currentUser?.uid === user.uid} title={currentUser?.uid === user.uid ? t('admin_error_self_remove') : ''}>
                      {user.isAdmin ? t('admin_action_remove') : t('admin_action_make')}
                    </Button>
                  </td>
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
