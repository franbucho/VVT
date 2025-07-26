import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useLanguage } from '../../contexts/LanguageContext';
import { Reminder } from '../../types';
import firebase from 'firebase/compat/app';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Reminder, 'id' | 'userId' | 'lastTriggeredAt'>) => Promise<void>;
    reminderToEdit?: Reminder;
}

const getLocalDateTimeForInput = (date = new Date()) => {
    const tenMinutesLater = new Date(date.getTime() + 10 * 60000);
    tenMinutesLater.setSeconds(0, 0);
    const tzoffset = tenMinutesLater.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(tenMinutesLater.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
};

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSubmit, reminderToEdit }) => {
    const { t } = useLanguage();
    
    const initialState = {
        type: 'medication' as 'medication' | 'consultation',
        name: '',
        details: '',
        interval: 8,
        frequency: 'hours' as 'hours' | 'days' | 'weeks' | 'months',
        startsAt: getLocalDateTimeForInput(),
        isActive: true,
    };

    const [formData, setFormData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (reminderToEdit) {
            // Logic to populate form for editing can be added here
        } else {
            setFormData(initialState);
        }
    }, [reminderToEdit, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (parseInt(value, 10) || 1) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.details || !formData.startsAt) {
            setError('Please fill out all fields.');
            return;
        }

        setIsLoading(true);
        try {
            const reminderData = {
                ...formData,
                interval: Number(formData.interval),
                startsAt: firebase.firestore.Timestamp.fromDate(new Date(formData.startsAt)),
            };
            await onSubmit(reminderData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save reminder.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 sm:p-8 max-w-lg w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-primary-dark dark:text-dark-text-primary mb-6">
                    {t(reminderToEdit ? 'reminder_modal_title_edit' : 'reminder_modal_title_add')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primary-dark dark:text-dark-text-secondary mb-2">{t('reminder_type')}</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2"><input type="radio" name="type" value="medication" checked={formData.type === 'medication'} onChange={handleChange} className="accent-primary dark:accent-dark-accent"/>{t('reminder_type_medication')}</label>
                            <label className="flex items-center gap-2"><input type="radio" name="type" value="consultation" checked={formData.type === 'consultation'} onChange={handleChange} className="accent-primary dark:accent-dark-accent"/>{t('reminder_type_consultation')}</label>
                        </div>
                    </div>

                    <InputField label={t('reminder_name_label')} name="name" value={formData.name} onChange={handleChange} required placeholder={t(formData.type === 'medication' ? 'reminder_name_placeholder_medication' : 'reminder_name_placeholder_consultation')}/>
                    <InputField label={t('reminder_details_label')} name="details" value={formData.details} onChange={handleChange} required placeholder={t(formData.type === 'medication' ? 'reminder_details_placeholder_medication' : 'reminder_details_placeholder_consultation')}/>

                    <div>
                        <label className="block text-sm font-medium text-primary-dark dark:text-dark-text-secondary mb-1">{t('reminder_frequency_label')}</label>
                        <div className="flex items-center gap-2">
                           <span className="text-sm text-primary-dark/80 dark:text-dark-text-secondary">{t('reminder_frequency_helper')}</span>
                            <input type="number" name="interval" value={formData.interval} onChange={handleChange} min="1" className="w-20 px-2 py-1 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card dark:text-dark-text-primary" />
                            <select name="frequency" value={formData.frequency} onChange={handleChange} className="px-2 py-1 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card dark:text-dark-text-primary">
                                <option value="hours">{t('reminder_frequency_hours')}</option>
                                <option value="days">{t('reminder_frequency_days')}</option>
                                <option value="weeks">{t('reminder_frequency_weeks')}</option>
                                <option value="months">{t('reminder_frequency_months')}</option>
                            </select>
                        </div>
                    </div>
                    
                    <InputField label={t('reminder_starts_at_label')} name="startsAt" type="datetime-local" value={formData.startsAt} onChange={handleChange} required />

                    {error && <p className="text-danger text-sm text-center">{error}</p>}

                    <div className="mt-6 flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={onClose}>{t('hr_button_cancel')}</Button>
                        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                            {t('reminder_save_button')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
