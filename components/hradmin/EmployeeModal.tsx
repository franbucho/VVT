import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useLanguage } from '../../contexts/LanguageContext';
import { Employee, Team } from '../../types';

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Employee>) => Promise<void>;
    teams: Team[];
    employeeToEdit?: Employee;
    hrAdminTeamId?: string | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSubmit, teams, employeeToEdit, hrAdminTeamId }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        teamId: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (employeeToEdit) {
            setFormData({
                id: employeeToEdit.id,
                firstName: employeeToEdit.firstName,
                lastName: employeeToEdit.lastName,
                email: employeeToEdit.email,
                teamId: employeeToEdit.teamId || '',
            });
        } else {
             setFormData({ 
                id: '', 
                firstName: '', 
                lastName: '', 
                email: '', 
                teamId: hrAdminTeamId || '' 
            });
        }
    }, [employeeToEdit, hrAdminTeamId, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('All fields except team are required.');
            return;
        }
        setIsLoading(true);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to save employee.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const isTeamSelectDisabled = !!hrAdminTeamId && !employeeToEdit;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 sm:p-8 max-w-lg w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
                    {employeeToEdit ? t('hr_modal_employee_title_edit') : t('hr_modal_employee_title_add')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label={t('hr_field_firstName')} name="firstName" value={formData.firstName} onChange={handleChange} required />
                    <InputField label={t('hr_field_lastName')} name="lastName" value={formData.lastName} onChange={handleChange} required />
                    <InputField label={t('hr_field_email')} name="email" type="email" value={formData.email} onChange={handleChange} required />
                    <div>
                        <label htmlFor="teamId" className="block text-sm font-medium text-primary-dark dark:text-dark-text-secondary mb-1">{t('hr_field_team')}</label>
                        <select
                            id="teamId"
                            name="teamId"
                            value={formData.teamId}
                            onChange={handleChange}
                            disabled={isTeamSelectDisabled}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white dark:bg-dark-card dark:text-dark-text-primary disabled:bg-gray-100 disabled:dark:bg-dark-background"
                        >
                            <option value="">{t('hr_field_no_team')}</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-danger text-sm text-center">{error}</p>}

                    <div className="mt-6 flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={onClose}>{t('hr_button_cancel')}</Button>
                        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                            {isLoading ? t('hr_button_saving') : t('hr_button_save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};