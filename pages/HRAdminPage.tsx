import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import { Team, Employee, HRDashboardData } from '../types';
import { auth } from '../firebase';
import { EmployeeModal } from '../components/hradmin/EmployeeModal';
import { TeamModal } from '../components/hradmin/TeamModal';
import { StatCard } from '../components/common/StatCard';
import { UsersGroupIcon, XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../constants';


type HRAdminTab = 'dashboard' | 'employees' | 'teams';
type ModalState = { type: 'employee' | 'team'; item?: Employee | Team } | null;

interface HRAdminPageProps {
    isAdmin: boolean;
    teamId: string | null;
}

const StatusBadge: React.FC<{ status: Employee['status'] }> = ({ status }) => {
    const { t } = useLanguage();
    
    const statusMap = {
        ok: { textKey: 'hr_dashboard_status_ok', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
        due_soon: { textKey: 'hr_dashboard_status_due_soon', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
        overdue: { textKey: 'hr_dashboard_status_overdue', color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
        pending: { textKey: 'hr_dashboard_status_pending', color: 'bg-gray-100 text-gray-800 dark:bg-dark-border/50 dark:text-dark-text-secondary' },
    };

    const currentStatus = status ? statusMap[status] : statusMap.pending;

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${currentStatus.color}`}>
            {t(currentStatus.textKey as any)}
        </span>
    );
};

export const HRAdminPage: React.FC<HRAdminPageProps> = ({ isAdmin, teamId }) => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<HRAdminTab>('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [dashboardData, setDashboardData] = useState<HRDashboardData | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    
    const [modalState, setModalState] = useState<ModalState>(null);

    const callHrFunction = useCallback(async (endpoint: string, method: string, body?: any) => {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("Authentication required.");
        }
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
        try {
            if (activeTab === 'dashboard') {
                const data = await callHrFunction('getHrDashboardData', 'GET');
                setDashboardData(data);
            } else {
                const promises = [callHrFunction('manageEmployees', 'GET')];
                if (isAdmin) {
                    promises.push(callHrFunction('manageTeams', 'GET'));
                }
                const [employeesData, teamsData] = await Promise.all(promises);
                
                setEmployees(employeesData);
                if (teamsData) setTeams(teamsData);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [callHrFunction, isAdmin, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleModalSubmit = async (itemType: 'employee' | 'team', data: any) => {
        const isEditing = !!data.id;
        const endpoint = itemType === 'employee' ? 'manageEmployees' : 'manageTeams';
        
        try {
            await callHrFunction(endpoint, isEditing ? 'PUT' : 'POST', data);
            setModalState(null);
            await fetchData(); // Refresh data
        } catch (err: any) {
            console.error(`Failed to save ${itemType}`, err);
            throw err; // Re-throw to be caught and displayed in the modal
        }
    };
    
    const getTeamName = (employeeTeamId: string | null) => {
        if (!employeeTeamId) return t('hr_admin_team_unassigned');
        return teams.find(t => t.id === employeeTeamId)?.name || 'Unknown Team';
    };

    const renderDashboard = () => (
        <div>
            {isLoading && <LoadingSpinner text={t('hr_dashboard_loading_data')} />}
            {!isLoading && dashboardData && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<UsersGroupIcon className="text-blue-500"/>} label={t('hr_dashboard_total_members')} value={dashboardData.stats.totalMembers} colorClass="border-blue-500" />
                        <StatCard icon={<XCircleIcon className="text-gray-500"/>} label={t('hr_dashboard_evaluations_pending')} value={dashboardData.stats.pendingCount} colorClass="border-gray-500" />
                        <StatCard icon={<ExclamationTriangleIcon className="text-yellow-500"/>} label={t('hr_dashboard_evaluations_due_soon')} value={dashboardData.stats.dueSoonCount} colorClass="border-yellow-500" />
                        <StatCard icon={<CheckCircleIcon className="text-red-500"/>} label={t('hr_dashboard_evaluations_overdue')} value={dashboardData.stats.overdueCount} colorClass="border-red-500" />
                    </div>
                     <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                             <thead className="bg-primary/5 dark:bg-dark-card/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_dashboard_table_header_member')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_dashboard_table_header_last_eval')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_dashboard_table_header_next_eval')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_dashboard_table_header_status')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                                {dashboardData.teamMembers.map(member => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-dark dark:text-dark-text-primary">{member.firstName} {member.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/80 dark:text-dark-text-secondary">
                                            {member.lastEvaluationAt ? new Date(member.lastEvaluationAt.seconds * 1000).toLocaleDateString(language) : t('hr_dashboard_no_eval_history')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/80 dark:text-dark-text-secondary">
                                            {member.nextEvaluationAt ? new Date(member.nextEvaluationAt.seconds * 1000).toLocaleDateString(language) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={member.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderEmployees = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('hr_admin_employees_title')}</h2>
                <Button onClick={() => setModalState({ type: 'employee' })}>{t('hr_admin_add_employee')}</Button>
            </div>
             <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                    <thead className="bg-primary/5 dark:bg-dark-card/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_table_header_name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_table_header_email')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_table_header_team')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_table_header_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                        {employees.length > 0 ? employees.map(emp => (
                            <tr key={emp.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-dark dark:text-dark-text-primary">{emp.firstName} {emp.lastName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/80 dark:text-dark-text-secondary">{emp.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-dark/80 dark:text-dark-text-secondary">{isAdmin ? getTeamName(emp.teamId) : ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button size="sm" variant="outline" onClick={() => setModalState({ type: 'employee', item: emp })}>{t('hr_button_edit')}</Button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center py-10 text-primary-dark/70 dark:text-dark-text-secondary">{t('hr_admin_no_employees')}</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
    
    const renderTeams = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary">{t('hr_admin_teams_title')}</h2>
                <Button onClick={() => setModalState({ type: 'team' })}>{t('hr_admin_add_team')}</Button>
            </div>
            <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                    <thead className="bg-primary/5 dark:bg-dark-card/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_field_team_name')}</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-primary/80 dark:text-dark-text-secondary uppercase tracking-wider">{t('hr_table_header_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                        {teams.length > 0 ? teams.map(team => (
                            <tr key={team.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-dark dark:text-dark-text-primary">{team.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button size="sm" variant="outline" onClick={() => setModalState({ type: 'team', item: team })}>{t('hr_button_edit')}</Button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={2} className="text-center py-10 text-primary-dark/70 dark:text-dark-text-secondary">{t('hr_admin_no_teams')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    return (
        <>
            <PageContainer title={t('hr_admin_title')} className="max-w-6xl mx-auto">
                 <div className="mb-6 border-b border-gray-200 dark:border-dark-border">
                    <nav className="flex space-x-4 -mb-px" aria-label="Tabs">
                        <button onClick={() => setActiveTab('dashboard')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'dashboard' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>
                            {t('hr_admin_tab_dashboard')}
                        </button>
                        <button onClick={() => setActiveTab('employees')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'employees' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>
                            {t('hr_admin_tab_employees')}
                        </button>
                        {isAdmin && (
                            <button onClick={() => setActiveTab('teams')} className={`py-3 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'teams' ? 'border-accent text-accent dark:border-dark-accent dark:text-dark-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:border-dark-border'}`}>
                                {t('hr_admin_tab_teams')}
                            </button>
                        )}
                    </nav>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
                    {error ? <p className="text-danger text-center">{error}</p> : (
                        <>
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'employees' && (isLoading ? <LoadingSpinner/> : renderEmployees())}
                            {activeTab === 'teams' && isAdmin && (isLoading ? <LoadingSpinner/> : renderTeams())}
                        </>
                    )}
                </div>
            </PageContainer>
            
            {modalState?.type === 'employee' && (
                <EmployeeModal 
                    isOpen={true} 
                    onClose={() => setModalState(null)} 
                    onSubmit={(data) => handleModalSubmit('employee', data)}
                    teams={teams}
                    employeeToEdit={modalState.item as Employee | undefined}
                    hrAdminTeamId={!isAdmin ? teamId : null} // Pass teamId if user is only HR Admin
                />
            )}

            {modalState?.type === 'team' && isAdmin && (
                <TeamModal
                    isOpen={true}
                    onClose={() => setModalState(null)}
                    onSubmit={(data) => handleModalSubmit('team', data)}
                    teamToEdit={modalState.item as Team | undefined}
                />
            )}
        </>
    );
};
