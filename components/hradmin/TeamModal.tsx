import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useLanguage } from '../../contexts/LanguageContext';
import { Team } from '../../types';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Team>) => Promise<void>;
    teamToEdit?: Team;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, onSubmit, teamToEdit }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        id: teamToEdit?.id || '',
        name: teamToEdit?.name || '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

     useEffect(() => {
        if (teamToEdit) {
            setFormData({
                id: teamToEdit.id,
                name: teamToEdit.name,
            });
        } else {
             setFormData({ id: '', name: '' });
        }
    }, [teamToEdit]);
    
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name) {
            setError('Team name is required.');
            return;
        }
        setIsLoading(true);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to save team.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent dark:from-dark-text-primary dark:to-dark-accent">
                    {teamToEdit ? t('hr_modal_team_title_edit') : t('hr_modal_team_title_add')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label={t('hr_field_team_name')} name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    
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