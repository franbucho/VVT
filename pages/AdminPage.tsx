import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { Feedback, Team } from '../types';
import { StarIcon, UsersGroupIcon, ShieldCheckIcon, SparklesIcon, StethoscopeIcon, UserIcon, DocumentTextIcon, BriefcaseIcon } from '../constants';
import { auth } from '../firebase';
import { InputField } from '../components/common/InputField';
import { StatCard } from '../components/common/StatCard';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  isPremium: boolean;
  isDoctor: boolean;
  isHrAdmin: boolean;
  teamId: string | null;
}

interface AdminStats {
  totalUsers: number;
  adminCount: number;
  premiumCount: number;
  doctorCount: number;
  hrAdminCount: number;
  normalUserCount: number;
  totalEvaluations: number;
}

interface AdminPageProps {
  currentUser: User | null;
}

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-dark-border'}`} />
    ))}
  </div>
);

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'feedback'>('users');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [users, setUsers] = useState<AppUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackError, setFeedbackError] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 for all
  const [feedbackCurrentPage, setFeedbackCurrentPage] = useState(1);
  const feedbackPerPage = 5;
  
  const callAdminFunction = useCallback(async (endpoint: string, method: 'GET' | 'POST', body?: any) => {
    if (!currentUser) throw new Error("Authentication required.");
    const token = await currentUser.getIdToken();
    const functionUrl = `https://us-central1-virtual-vision-test-app.cloudfunctions.net/${endpoint}`;
    const response = await fetch(functionUrl, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to call ${endpoint}`);
    }
    return response.json();
  }, [currentUser]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError('');
    try {
        const result = await callAdminFunction('getAdminDashboardStats', 'GET');
        setStats(result);
    } catch (err: any) {
        setStatsError(err.message || t('admin_stats_error'));
    } finally {
        setIsStatsLoading(false);
    }
  }, [callAdminFunction, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchUsersAndTeams = useCallback(async () => {
    setIsUsersLoading(true);
    setUserError('');
    try {
        const [usersResult, teamsResult] = await Promise.all([
            callAdminFunction('listAllUsers', 'POST'),
            callAdminFunction('manageTeams', 'GET'),
        ]);
        setUsers(usersResult.users);
        setTeams(teamsResult);
    } catch (err: any) {
      setUserError(err.message || t('admin_error_load_users'));
      console.error(err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [callAdminFunction, t]);

  const fetchFeedback = useCallback(async () => {
    setIsFeedbackLoading(true);
    setFeedbackError('');
    try {
      const result = await callAdminFunction('getFeedback', 'GET');
      setFeedbackList(result.feedbackList);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to load feedback.');
      console.error(err);
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [callAdminFunction]);


  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersAndTeams();
    } else if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab, fetchUsersAndTeams, fetchFeedback]);

  const handleToggleRole = useCallback(async (uid: string, role: 'admin' | 'premium' | 'doctor' | 'hr_admin', status: boolean) => {
    setUserMessage('');
    setUserError('');
    if (currentUser?.uid === uid && role === 'admin' && !status) {
      setUserError(t('admin_error_self_remove'));
      return;
    }
    setUpdatingUid(uid);
    try {
      await callAdminFunction('toggleUserRole', 'POST', { uid, role, status });
      setUsers((current) =>
        current.map((u) => u.uid === uid ? { ...u, [role === 'admin' ? 'isAdmin' : role === 'premium' ? 'isPremium' : role === 'doctor' ? 'isDoctor' : 'isHrAdmin']: status } : u)
      );
      fetchStats();
      setUserMessage(t('admin_success_role_update'));
    } catch (err: any) {
      setUserError(err?.message || t('admin_error_role_update'));
    } finally {
      setUpdatingUid(null);
    }
  }, [currentUser, t, callAdminFunction, fetchStats]);

  const handleAssignTeam = async (userId: string, teamId: string) => {
    setUpdatingUid(userId);
    setUserMessage('');
    setUserError('');
    try {
        await callAdminFunction('assignTeamToUser', 'POST', { userId, teamId });
        setUsers(current => current.map(u => u.uid === userId ? { ...u, teamId } : u));
        setUserMessage("User's team updated.");
    } catch (err: any) {
        setUserError(err.message || "Failed to update user's team.");
    } finally {
        setUpdatingUid(null);
    }
  };


  const RoleBadge: React.FC<{ user: AppUser }> = ({ user }) => {
    const roles = [];
    if (user.isAdmin) roles.push(<span key="admin" className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">{t('admin_role_admin')}</span>);
    if (user.isHrAdmin) roles.push(<span key="hr" className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300">{t('admin_role_hr_admin')}</span>);
    if (user.isDoctor) roles.push(<span key="doctor" className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">{t('admin_role_doctor')}</span>);
    if (user.isPremium) roles.push(<span key="premium" className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">{t('admin_role_premium')}</span>);
    if (roles.length === 0) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-dark-border/50 dark:text-dark-text-secondary">{t('admin_role_user')}</span>;
    return <div className="flex flex-wrap gap-1">{roles}</div>;
  }

  const renderUsersTab = () => {
    const filteredUsers = users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = filteredUsers.slice((userCurrentPage - 1) * usersPerPage, userCurrentPage * usersPerPage);
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setUserCurrentPage(1); };
    const handleNextPage = () => { if (userCurrentPage < totalPages) setUserCurrentPage(userCurrentPage + 1); };
    const handlePrevPage = () => { if (userCurrentPage > 1) setUserCurrentPage(userCurrentPage - 1); };
    
    return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-primary dark:text-dark-text-primary">{t('admin_manageUsers')}</h2>
        <div className="w-full sm:w-72">
          <InputField label="" id="user-search" type="search" value={searchQuery} onChange={handleSearchChange} placeholder={t('admin_search_placeholder')} wrapperClassName="!mb-0" />
        </div>
      </div>
      {userMessage && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm">{userMessage}</p>}
      {userError && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{userError}</p>}
      <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
        {isUsersLoading ? <LoadingSpinner text="Loading users..." className="py-20" /> : (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-primary/5 dark:bg-dark-card/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-primary-dark dark:text-dark-text-primary">{user.displayName || t('admin_no_name')}</div><div className="text-sm text-primary/70 dark:text-dark-text-secondary">{user.email}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><RoleBadge user={user} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2 items-center">
                           <Button onClick={() => handleToggleRole(user.uid, 'admin', !user.isAdmin)} variant={user.isAdmin ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid} disabled={currentUser?.uid === user.uid} title={currentUser?.uid === user.uid ? t('admin_error_self_remove') : ''}>{user.isAdmin ? t('admin_action_remove') : t('admin_action_make')}</Button>
                           <Button onClick={() => handleToggleRole(user.uid, 'hr_admin', !user.isHrAdmin)} variant={user.isHrAdmin ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid}>{user.isHrAdmin ? t('admin_action_remove_hr_admin') : t('admin_action_make_hr_admin')}</Button>
                           <Button onClick={() => handleToggleRole(user.uid, 'doctor', !user.isDoctor)} variant={user.isDoctor ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid}>{user.isDoctor ? t('admin_action_remove_doctor') : t('admin_action_make_doctor')}</Button>
                           <Button onClick={() => handleToggleRole(user.uid, 'premium', !user.isPremium)} variant={user.isPremium ? 'danger' : 'secondary'} size="sm" isLoading={updatingUid === user.uid}>{user.isPremium ? t('admin_action_remove_premium') : t('admin_action_make_premium')}</Button>
                           {user.isHrAdmin && (
                            <select value={user.teamId || ''} onChange={(e) => handleAssignTeam(user.uid, e.target.value)} disabled={updatingUid === user.uid} className="ml-2 p-1.5 border border-gray-300 dark:border-dark-border rounded-md text-xs bg-white dark:bg-dark-card dark:text-dark-text-primary focus:ring-accent focus:border-accent">
                                <option value="">Assign Team</option>
                                {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                            </select>
                           )}
                        </div>
                      </td>
                    </tr>
                )) : (
                  <tr><td colSpan={3} className="text-center py-10 text-primary/70 dark:text-dark-text-secondary">{searchQuery ? t('admin_no_users_match') : t('admin_no_users_found')}</td></tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-white dark:bg-dark-card border-t dark:border-dark-border flex items-center justify-between">
                <span className="text-sm text-primary/70 dark:text-dark-text-secondary">{t('pagination_page_info', { currentPage: userCurrentPage, totalPages })}</span>
                <div className="flex space-x-2"><Button onClick={handlePrevPage} disabled={userCurrentPage === 1} size="sm" variant="outline">{t('pagination_previous')}</Button><Button onClick={handleNextPage} disabled={userCurrentPage === totalPages} size="sm" variant="outline">{t('pagination_next')}</Button></div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )};

  const renderFeedbackTab = () => {
    const filteredFeedback = ratingFilter > 0 ? feedbackList.filter(fb => fb.rating === ratingFilter) : feedbackList;
    const totalPages = Math.ceil(filteredFeedback.length / feedbackPerPage);
    const paginatedFeedback = filteredFeedback.slice((feedbackCurrentPage - 1) * feedbackPerPage, feedbackCurrentPage * feedbackPerPage);
    const handleRatingFilterChange = (rating: number) => { setRatingFilter(rating); setFeedbackCurrentPage(1); };
    const handleNextPage = () => { if (feedbackCurrentPage < totalPages) setFeedbackCurrentPage(feedbackCurrentPage + 1); };
    const handlePrevPage = () => { if (feedbackCurrentPage > 1) setFeedbackCurrentPage(feedbackCurrentPage - 1); };

    return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-primary dark:text-dark-text-primary">{t('admin_feedback_title')}</h2>
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary/80 dark:text-dark-text-secondary">{t('admin_feedback_filter_by_rating')}:</span>
            <Button onClick={() => handleRatingFilterChange(0)} size="sm" variant={ratingFilter === 0 ? 'primary' : 'outline'}>{t('admin_feedback_filter_all')}</Button>
            {[5, 4, 3, 2, 1].map(star => <Button key={star} onClick={() => handleRatingFilterChange(star)} size="sm" variant={ratingFilter === star ? 'primary' : 'outline'}>{star} <StarIcon className="w-4 h-4 ml-1 text-yellow-400"/></Button>)}
        </div>
      </div>
      {feedbackError && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{feedbackError}</p>}
      <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
        {isFeedbackLoading ? <LoadingSpinner text="Loading feedback..." className="py-20" /> : (
            <>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-primary/5 dark:bg-dark-card/50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_user')}</th><th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_feedback_table_header_rating')}</th><th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_feedback_table_header_comment')}</th><th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_feedback_table_header_date')}</th></tr></thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
              {paginatedFeedback.length > 0 ? paginatedFeedback.map(fb => (<tr key={fb.id}><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-primary/70 dark:text-dark-text-secondary">{fb.userEmail}</div></td><td className="px-6 py-4 whitespace-nowrap"><RatingStars rating={fb.rating} /></td><td className="px-6 py-4"><p className="text-sm text-primary dark:text-dark-text-primary max-w-sm whitespace-pre-wrap break-words">{fb.comment || 'N/A'}</p></td><td className="px-6 py-4 whitespace-nowrap text-sm text-primary/70 dark:text-dark-text-secondary">{new Date(fb.createdAt).toLocaleDateString(t('date_locale' as any))}</td></tr>)) : (<tr><td colSpan={4} className="text-center py-10 text-primary/70 dark:text-dark-text-secondary">{feedbackList.length === 0 ? t('admin_no_feedback_found') : t('admin_no_feedback_match')}</td></tr>)}</tbody>
          </table>
            {totalPages > 1 && (<div className="px-6 py-3 bg-white dark:bg-dark-card border-t dark:border-dark-border flex items-center justify-between"><span className="text-sm text-primary/70 dark:text-dark-text-secondary">{t('pagination_page_info', { currentPage: feedbackCurrentPage, totalPages })}</span><div className="flex space-x-2"><Button onClick={handlePrevPage} disabled={feedbackCurrentPage === 1} size="sm" variant="outline">{t('pagination_previous')}</Button><Button onClick={handleNextPage} disabled={feedbackCurrentPage === totalPages} size="sm" variant="outline">{t('pagination_next')}</Button></div></div>)}
          </>
        )}
      </div>
    </>
  )};

  return (
    <PageContainer title={t('admin_title')} className="max-w-7xl mx-auto">
        <div className="mb-8">
            {isStatsLoading ? <LoadingSpinner text={t('admin_stats_loading')} /> : statsError ? <p className="text-center text-danger bg-red-50 dark:bg-red-500/10 dark:text-red-300 p-4 rounded-md">{statsError}</p> : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <StatCard icon={<UsersGroupIcon className="text-blue-500"/>} label={t('admin_stats_total_users')} value={stats.totalUsers} colorClass="border-blue-500" />
                    <StatCard icon={<ShieldCheckIcon className="text-green-500"/>} label={t('admin_stats_admins')} value={stats.adminCount} colorClass="border-green-500" />
                    <StatCard icon={<BriefcaseIcon className="text-orange-500"/>} label={t('admin_stats_hr_admins')} value={stats.hrAdminCount} colorClass="border-orange-500" />
                    <StatCard icon={<SparklesIcon className="text-yellow-500"/>} label={t('admin_stats_premium_users')} value={stats.premiumCount} colorClass="border-yellow-500" />
                    <StatCard icon={<StethoscopeIcon className="text-purple-500"/>} label={t('admin_stats_doctors')} value={stats.doctorCount} colorClass="border-purple-500" />
                    <StatCard icon={<UserIcon className="text-gray-500"/>} label={t('admin_stats_normal_users')} value={stats.normalUserCount ?? 0} colorClass="border-gray-500" />
                    <StatCard icon={<DocumentTextIcon className="text-indigo-500"/>} label={t('admin_stats_total_evaluations')} value={stats.totalEvaluations} colorClass="border-indigo-500" />
                </div>
            ) : null}
        </div>
        <div className="mb-6 border-b border-gray-200 dark:border-dark-border">
            <nav className="flex space-x-4 -mb-px" aria-label="Tabs"><button onClick={() => setActiveTab('users')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'users' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>{t('admin_tab_users')}</button><button onClick={() => setActiveTab('feedback')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'feedback' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>{t('admin_tab_feedback')}</button></nav>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
            {activeTab === 'users' ? renderUsersTab() : renderFeedbackTab()}
        </div>
    </PageContainer>
  );
};