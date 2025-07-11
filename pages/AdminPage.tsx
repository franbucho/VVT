import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { User } from 'firebase/auth';
import { functions } from '../firebase';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
}

interface AdminPageProps {
  currentUser: User | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const listUsersCallable = httpsCallable(functions, 'listAllUsers');
      const result = await listUsersCallable();
      setUsers((result.data as any).users);
    } catch (err) {
      setError(t('admin_error_load_users'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (uid: string, makeAdmin: boolean) => {
    setMessage('');
    setError('');

    if (currentUser?.uid === uid && !makeAdmin) {
      setError(t('admin_error_self_remove'));
      return;
    }

    setUpdatingUid(uid);

    try {
      const toggleAdminRoleCallable = httpsCallable(functions, 'toggleAdminRole');
      await toggleAdminRoleCallable({ uid, makeAdmin });
      
      setUsers(currentUsers =>
        currentUsers.map(u => u.uid === uid ? { ...u, isAdmin: makeAdmin } : u)
      );
      setMessage(t('admin_success_role_update'));
    } catch (err: any) {
      setError(err.message || t('admin_error_role_update'));
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <PageContainer title={t('admin_title')} className="max-w-5xl mx-auto">
      <div className="bg-card-bg p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
        <h2 className="text-2xl font-bold text-primary">{t('admin_manageUsers')}</h2>
        {message && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm">{message}</p>}
        {error && <p className="text-danger bg-red-50 p-3 rounded-md text-sm">{error}</p>}

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {isLoading ? <LoadingSpinner text="Loading users..." className="py-20" /> : (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isAdmin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('admin_role_admin')}</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{t('admin_role_user')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.isAdmin ? (
                        <Button 
                          onClick={() => handleToggleAdmin(user.uid, false)} 
                          variant="danger" 
                          size="sm" 
                          isLoading={updatingUid === user.uid}
                          disabled={currentUser?.uid === user.uid}
                          title={currentUser?.uid === user.uid ? t('admin_error_self_remove') : ''}
                        >
                          {t('admin_action_remove')}
                        </Button>
                      ) : (
                        <Button onClick={() => handleToggleAdmin(user.uid, true)} variant="secondary" size="sm" isLoading={updatingUid === user.uid}>
                          {t('admin_action_make')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageContainer>
  );
};