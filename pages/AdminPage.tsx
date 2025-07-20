import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { Feedback } from '../types';
import { StarIcon, UsersGroupIcon, ShieldCheckIcon, SparklesIcon, StethoscopeIcon, UserIcon, DocumentTextIcon } from '../constants';
import { auth } from '../firebase';
import { InputField } from '../components/common/InputField';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  isPremium: boolean;
  isDoctor: boolean;
}

interface AdminStats {
  totalUsers: number;
  adminCount: number;
  premiumCount: number;
  doctorCount: number;
  normalUserCount: number;
  totalEvaluations: number;
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

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string, colorClass: string }> = ({ icon, label, value, colorClass }) => (
    <div className={`p-4 bg-white rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${colorClass}`}>
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-primary-dark">{value}</p>
        </div>
    </div>
);


export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'feedback'>('users');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [users, setUsers] = useState<AppUser[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 5;

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackError, setFeedbackError] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 for all
  const [feedbackCurrentPage, setFeedbackCurrentPage] = useState(1);
  const feedbackPerPage = 5;
  
  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    setIsStatsLoading(true);
    setStatsError('');
    try {
        const token = await currentUser.getIdToken();
        const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/getAdminDashboardStats';
        const response = await fetch(functionUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to fetch stats');
        }
        const result = await response.json();
        setStats(result);
    } catch (err: any) {
        setStatsError(err.message || t('admin_stats_error'));
    } finally {
        setIsStatsLoading(false);
    }
  }, [currentUser, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    } else if (activeTab === 'feedback' && feedbackList.length === 0) {
      fetchFeedback();
    }
  }, [activeTab, fetchUsers, fetchFeedback, users.length, feedbackList.length]);

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
      
      // Update stats optimistically
      fetchStats();

      setUserMessage(t('admin_success_role_update'));
    } catch (err: any) {
      console.error('toggleUserRole error:', err);
      setUserError(err?.message || t('admin_error_role_update'));
    } finally {
      setUpdatingUid(null);
    }
  }, [currentUser, t, fetchStats]);

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

  const renderUsersTab = () => {
    const filteredUsers = users.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = filteredUsers.slice(
      (userCurrentPage - 1) * usersPerPage,
      userCurrentPage * usersPerPage
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setUserCurrentPage(1);
    };

    const handleNextPage = () => {
      if (userCurrentPage < totalPages) {
        setUserCurrentPage(userCurrentPage + 1);
      }
    };
    
    const handlePrevPage = () => {
      if (userCurrentPage > 1) {
        setUserCurrentPage(userCurrentPage - 1);
      }
    };
    
    return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-primary">{t('admin_manageUsers')}</h2>
        <div className="w-full sm:w-72">
          <InputField
            label=""
            id="user-search"
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('admin_search_placeholder')}
            wrapperClassName="!mb-0"
          />
        </div>
      </div>

      {userMessage && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm">{userMessage}</p>}
      {userError && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{userError}</p>}
      
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {isUsersLoading ? (
          <LoadingSpinner text="Loading users..." className="py-20" />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 uppercase tracking-wider">{t('admin_table_header_action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-primary/70">
                      {searchQuery ? t('admin_no_users_match') : t('admin_no_users_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-6 py-3 bg-white border-t flex items-center justify-between">
                <span className="text-sm text-primary/70">
                  {t('pagination_page_info', { currentPage: userCurrentPage, totalPages })}
                </span>
                <div className="flex space-x-2">
                  <Button onClick={handlePrevPage} disabled={userCurrentPage === 1} size="sm" variant="outline">{t('pagination_previous')}</Button>
                  <Button onClick={handleNextPage} disabled={userCurrentPage === totalPages} size="sm" variant="outline">{t('pagination_next')}</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )};

  const renderFeedbackTab = () => {
    const filteredFeedback = ratingFilter > 0 
      ? feedbackList.filter(fb => fb.rating === ratingFilter) 
      : feedbackList;

    const totalPages = Math.ceil(filteredFeedback.length / feedbackPerPage);
    const paginatedFeedback = filteredFeedback.slice(
        (feedbackCurrentPage - 1) * feedbackPerPage,
        feedbackCurrentPage * feedbackPerPage
    );

    const handleRatingFilterChange = (rating: number) => {
        setRatingFilter(rating);
        setFeedbackCurrentPage(1);
    };

    const handleNextPage = () => {
      if (feedbackCurrentPage < totalPages) {
        setFeedbackCurrentPage(feedbackCurrentPage + 1);
      }
    };
  
    const handlePrevPage = () => {
      if (feedbackCurrentPage > 1) {
        setFeedbackCurrentPage(feedbackCurrentPage - 1);
      }
    };

    return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-primary">{t('admin_feedback_title')}</h2>
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary/80">{t('admin_feedback_filter_by_rating')}:</span>
            <Button onClick={() => handleRatingFilterChange(0)} size="sm" variant={ratingFilter === 0 ? 'primary' : 'outline'}>{t('admin_feedback_filter_all')}</Button>
            {[5, 4, 3, 2, 1].map(star => (
                <Button key={star} onClick={() => handleRatingFilterChange(star)} size="sm" variant={ratingFilter === star ? 'primary' : 'outline'}>
                    {star} <StarIcon className="w-4 h-4 ml-1 text-yellow-400"/>
                </Button>
            ))}
        </div>
      </div>

      {feedbackError && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{feedbackError}</p>}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {isFeedbackLoading ? <LoadingSpinner text="Loading feedback..." className="py-20" /> : (
            <>
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
              {paginatedFeedback.length > 0 ? paginatedFeedback.map(fb => (
                <tr key={fb.id}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-primary/70">{fb.userEmail}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><RatingStars rating={fb.rating} /></td>
                  <td className="px-6 py-4"><p className="text-sm text-primary max-w-sm whitespace-pre-wrap break-words">{fb.comment || 'N/A'}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary/70">{new Date(fb.createdAt).toLocaleDateString(t('date_locale' as any))}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-primary/70">
                      {feedbackList.length === 0 ? t('admin_no_feedback_found') : t('admin_no_feedback_match')}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-white border-t flex items-center justify-between">
                <span className="text-sm text-primary/70">
                  {t('pagination_page_info', { currentPage: feedbackCurrentPage, totalPages })}
                </span>
                <div className="flex space-x-2">
                  <Button onClick={handlePrevPage} disabled={feedbackCurrentPage === 1} size="sm" variant="outline">{t('pagination_previous')}</Button>
                  <Button onClick={handleNextPage} disabled={feedbackCurrentPage === totalPages} size="sm" variant="outline">{t('pagination_next')}</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )};

  return (
    <PageContainer title={t('admin_title')} className="max-w-6xl mx-auto">
        <div className="mb-8">
            {isStatsLoading ? (
                <LoadingSpinner text={t('admin_stats_loading')} />
            ) : statsError ? (
                <p className="text-center text-danger bg-red-50 p-4 rounded-md">{statsError}</p>
            ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard icon={<UsersGroupIcon className="text-blue-500"/>} label={t('admin_stats_total_users')} value={stats.totalUsers} colorClass="border-blue-500" />
                    <StatCard icon={<ShieldCheckIcon className="text-green-500"/>} label={t('admin_stats_admins')} value={stats.adminCount} colorClass="border-green-500" />
                    <StatCard icon={<SparklesIcon className="text-yellow-500"/>} label={t('admin_stats_premium_users')} value={stats.premiumCount} colorClass="border-yellow-500" />
                    <StatCard icon={<StethoscopeIcon className="text-purple-500"/>} label={t('admin_stats_doctors')} value={stats.doctorCount} colorClass="border-purple-500" />
                    <StatCard icon={<UserIcon className="text-gray-500"/>} label={t('admin_stats_normal_users')} value={stats.normalUserCount ?? 0} colorClass="border-gray-500" />
                    <StatCard icon={<DocumentTextIcon className="text-indigo-500"/>} label={t('admin_stats_total_evaluations')} value={stats.totalEvaluations} colorClass="border-indigo-500" />
                </div>
            ) : null}
        </div>
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