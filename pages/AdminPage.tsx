import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { Feedback, AdminChartDataPoint, Team } from '../types';
import { StarIcon, UsersGroupIcon, ShieldCheckIcon, SparklesIcon, StethoscopeIcon, UserIcon, DocumentTextIcon, BriefcaseIcon } from '../constants';
import { auth } from '../firebase';
import { InputField } from '../components/common/InputField';
import { StatCard } from '../components/common/StatCard';
import { DailyActivityChart } from '../components/admin/DailyActivityChart';


interface AppUser {
  uid: string;
  email: string;
  displayName: string;
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
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'feedback'>('stats');

  const [users, setUsers] = useState<AppUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [chartData, setChartData] = useState<AdminChartDataPoint[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [currentPage, setCurrentPageNum] = useState(1);
  const usersPerPage = 5;

  const callApi = useCallback(async (endpoint: string, method: 'GET' | 'POST' | 'PUT', body?: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required.");
    const token = await user.getIdToken();
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
      throw new Error(err.error || `Failed to ${method} ${endpoint}`);
    }
    return response.json();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      if (activeTab === 'users') {
        const [usersResult, teamsResult] = await Promise.all([
          callApi('listAllUsers', 'POST'),
          callApi('manageTeams', 'GET')
        ]);
        setUsers(usersResult.users);
        setTeams(teamsResult);
      } else if (activeTab === 'feedback') {
        const result = await callApi('getFeedback', 'GET');
        setFeedbackList(result.feedbackList);
      } else if (activeTab === 'stats') {
        const [statsResult, chartResult] = await Promise.all([
          callApi('getAdminDashboardStats', 'GET'),
          callApi('getAdminDashboardChartData', 'GET')
        ]);
        setStats(statsResult);
        setChartData(chartResult.chartData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, callApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleRole = async (uid: string, role: 'admin' | 'premium' | 'doctor' | 'hr_admin', status: boolean) => {
    setMessage('');
    setError('');

    if (currentUser?.uid === uid && role === 'admin' && !status) {
      setError(t('admin_error_self_remove'));
      return;
    }
    setUpdatingUid(uid + role);
    try {
      await callApi('toggleUserRole', 'POST', { uid, role, status });
      
      // If unchecking HR Admin, also unassign from team.
      if (role === 'hr_admin' && !status) {
         await callApi('assignTeamToUser', 'POST', { userId: uid, teamId: null });
      }

      setUsers(currentUsers =>
        currentUsers.map(u => {
            if (u.uid === uid) {
                const updatedUser = {...u};
                switch(role) {
                    case 'admin': updatedUser.isAdmin = status; break;
                    case 'premium': updatedUser.isPremium = status; break;
                    case 'doctor': updatedUser.isDoctor = status; break;
                    case 'hr_admin': 
                        updatedUser.isHrAdmin = status;
                        if (!status) {
                            updatedUser.teamId = null; // Also clear teamId in local state
                        }
                        break;
                }
                return updatedUser;
            }
            return u;
        })
      );

      setMessage(t('admin_success_role_update'));
    } catch (err: any) {
      setError(err.message || t('admin_error_role_update'));
    } finally {
      setUpdatingUid(null);
    }
  };
  
  const handleAssignTeam = async (uid: string, teamId: string) => {
    setMessage('');
    setError('');
    setUpdatingUid(`${uid}team`);
    try {
      await callApi('assignTeamToUser', 'POST', { userId: uid, teamId: teamId || null });
      setUsers(currentUsers =>
        currentUsers.map(u => (u.uid === uid ? { ...u, teamId: teamId || null } : u))
      );
      setMessage('Team assigned successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to assign team.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPageNum(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPageNum(currentPage - 1); };

  const filteredFeedback = feedbackList.filter(fb =>
    ratingFilter === 0 || fb.rating === ratingFilter
  );

  const renderStatsTab = () => (
    <div className="space-y-8">
      {isLoading && <LoadingSpinner text={t('admin_stats_loading')} />}
      {error && <p className="text-danger text-center">{t('admin_stats_error')}</p>}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon={<UsersGroupIcon className="text-blue-500" />} label={t('admin_stats_total_users')} value={stats.totalUsers} colorClass="border-blue-500" />
          <StatCard icon={<ShieldCheckIcon className="text-green-500" />} label={t('admin_stats_admins')} value={stats.adminCount} colorClass="border-green-500" />
          <StatCard icon={<SparklesIcon className="text-purple-500" />} label={t('admin_stats_premium_users')} value={stats.premiumCount} colorClass="border-purple-500" />
          <StatCard icon={<StethoscopeIcon className="text-red-500" />} label={t('admin_stats_doctors')} value={stats.doctorCount} colorClass="border-red-500" />
          <StatCard icon={<BriefcaseIcon className="text-indigo-500" />} label={t('admin_stats_hr_admins')} value={stats.hrAdminCount} colorClass="border-indigo-500" />
          <StatCard icon={<UserIcon className="text-gray-500" />} label={t('admin_stats_normal_users')} value={stats.normalUserCount} colorClass="border-gray-500" />
          <StatCard icon={<DocumentTextIcon className="text-yellow-500" />} label={t('admin_stats_total_evaluations')} value={stats.totalEvaluations} colorClass="border-yellow-500" />
        </div>
      )}
      {!isLoading && chartData.length > 0 && (
          <DailyActivityChart data={chartData} />
      )}
    </div>
  );

  const renderUsersTab = () => (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('admin_manageUsers')}</h2>
        <InputField id="user-search" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('admin_search_placeholder')} wrapperClassName="!mb-0 w-full sm:w-64" label="" />
      </div>
      {message && <p className="text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-300 p-3 rounded-md text-sm">{message}</p>}
      {error && <p className="text-danger bg-red-50 dark:bg-red-500/10 dark:text-red-300 p-3 rounded-md text-sm">{error}</p>}
      <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
        {isLoading ? <LoadingSpinner text={t('admin_error_load_users')} className="py-20" /> : (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-primary-dark/5 dark:bg-dark-background/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_role')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary-dark dark:text-dark-text-primary">{user.displayName || t('admin_no_name')}</div>
                      <div className="text-sm text-primary-dark/70 dark:text-dark-text-secondary">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={user.isAdmin} onChange={(e) => handleToggleRole(user.uid, 'admin', e.target.checked)} disabled={updatingUid === `${user.uid}admin` || currentUser?.uid === user.uid} className="accent-primary dark:accent-dark-accent rounded"/><span>{t('admin_role_admin')}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={user.isPremium} onChange={(e) => handleToggleRole(user.uid, 'premium', e.target.checked)} disabled={updatingUid === `${user.uid}premium`} className="accent-primary dark:accent-dark-accent rounded"/><span>{t('admin_role_premium')}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={user.isDoctor} onChange={(e) => handleToggleRole(user.uid, 'doctor', e.target.checked)} disabled={updatingUid === `${user.uid}doctor`} className="accent-primary dark:accent-dark-accent rounded"/><span>{t('admin_role_doctor')}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={user.isHrAdmin} onChange={(e) => handleToggleRole(user.uid, 'hr_admin', e.target.checked)} disabled={updatingUid === `${user.uid}hr_admin`} className="accent-primary dark:accent-dark-accent rounded"/><span>{t('admin_role_hr_admin')}</span></label>
                            {user.isHrAdmin && (
                                <div className="pl-6 pt-1">
                                    <select 
                                        value={user.teamId || ''} 
                                        onChange={(e) => handleAssignTeam(user.uid, e.target.value)} 
                                        disabled={updatingUid === `${user.uid}team`}
                                        className="w-full text-xs p-1 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card dark:text-dark-text-primary"
                                    >
                                        <option value="">{t('hr_admin_team_unassigned')}</option>
                                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-sm text-primary-dark/70 dark:text-dark-text-secondary">
                      {searchQuery ? t('admin_no_users_match') : t('admin_no_users_found')}
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
          </>
        )}
      </div>
    </>
  );

  const renderFeedbackTab = () => (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('admin_feedback_title')}</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="rating-filter" className="text-sm font-medium text-primary-dark dark:text-dark-text-secondary">{t('admin_feedback_filter_by_rating')}:</label>
          <select 
            id="rating-filter" 
            value={ratingFilter} 
            onChange={e => setRatingFilter(Number(e.target.value))}
            className="p-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card dark:text-dark-text-primary text-sm focus:ring-accent focus:border-accent"
          >
            <option value="0">{t('admin_feedback_filter_all')}</option>
            <option value="5">{t('admin_feedback_filter_n_stars', {count: 5})}</option>
            <option value="4">{t('admin_feedback_filter_n_stars', {count: 4})}</option>
            <option value="3">{t('admin_feedback_filter_n_stars', {count: 3})}</option>
            <option value="2">{t('admin_feedback_filter_n_stars', {count: 2})}</option>
            <option value="1">{t('admin_feedback_filter_n_stars', {count: 1})}</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
        {isLoading ? <LoadingSpinner text="Loading feedback..." className="py-20" /> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-primary-dark/5 dark:bg-dark-background/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_table_header_user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_feedback_table_header_rating')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_feedback_table_header_comment')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('admin_feedback_table_header_date')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
              {filteredFeedback.length > 0 ? filteredFeedback.map(fb => (
                <tr key={fb.id}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-primary-dark/70 dark:text-dark-text-secondary">{fb.userEmail}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><RatingStars rating={fb.rating} /></td>
                  <td className="px-6 py-4"><p className="text-sm text-primary-dark dark:text-dark-text-primary max-w-sm whitespace-pre-wrap break-words">{fb.comment || 'N/A'}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/70 dark:text-dark-text-secondary">{new Date(fb.createdAt).toLocaleDateString(t('date_locale' as any))}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-primary-dark/70 dark:text-dark-text-secondary">
                    {ratingFilter ? t('admin_no_feedback_match') : t('admin_no_feedback_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  return (
    <PageContainer title={t('admin_title')} className="max-w-6xl mx-auto">
        <div className="mb-6 border-b border-gray-200 dark:border-dark-border">
            <nav className="flex flex-wrap space-x-2 -mb-px" aria-label="Tabs">
                <button onClick={() => setActiveTab('stats')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'stats' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>
                    {t('admin_tab_stats' as any)}
                </button>
                <button onClick={() => setActiveTab('users')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'users' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>
                    {t('admin_tab_users')}
                </button>
                <button onClick={() => setActiveTab('feedback')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'feedback' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>
                    {t('admin_tab_feedback')}
                </button>
            </nav>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
            {activeTab === 'stats' && renderStatsTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'feedback' && renderFeedbackTab()}
        </div>
    </PageContainer>
  );
};
