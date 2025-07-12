import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HealthData } from '../../types';
import { Button } from '../common/Button';
import { TranslationKeys } from '../../localization/en';
import { InputField } from '../common/InputField';

interface HealthQuestionnaireProps {
  onSubmit: (data: HealthData) => void;
}

const initialFormData: HealthData = {
  firstName: '',
  lastName: '',
  birthDate: { day: '', month: '', year: '' },
  primaryReason: [],
  wearsLenses: '',
  lensesSatisfaction: '',
  lensesLastUpdate: '',
  hadSurgeryOrInjury: '',
  surgeryOrInjuryDetails: '',
  illnesses: [],
  familyHistory: [],
  symptoms: [],
  screenTime: '',
  occupationalHazards: [],
};

const months: (keyof TranslationKeys)[] = [
  'month_january', 'month_february', 'month_march', 'month_april', 'month_may', 'month_june',
  'month_july', 'month_august', 'month_september', 'month_october', 'month_november', 'month_december'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Option lists
const reasonOptions: { key: string, label: keyof TranslationKeys }[] = [
    { key: 'blurry_vision', label: 'q1_reason_blurry_vision' },
    { key: 'tired_eyes', label: 'q1_reason_tired_eyes' },
    { key: 'redness_irritation', label: 'q1_reason_redness_irritation' },
    { key: 'periodic_checkup', label: 'q1_reason_periodic_checkup' },
    { key: 'other', label: 'q1_reason_other' },
];

const illnessOptions: { key: string, label: keyof TranslationKeys }[] = [
    { key: 'diabetes', label: 'q4_illness_diabetes' },
    { key: 'highBloodPressure', label: 'q4_illness_highBloodPressure' },
    { key: 'highCholesterol', label: 'q4_illness_highCholesterol' },
    { key: 'thyroid', label: 'q4_illness_thyroid' },
    { key: 'arthritis', label: 'q4_illness_arthritis' },
];

const familyHistoryOptions: { key: string, label: keyof TranslationKeys }[] = [
    { key: 'glaucoma', label: 'q5_condition_glaucoma' },
    { key: 'macularDegeneration', label: 'q5_condition_macularDegeneration' },
    { key: 'strabismus', label: 'q5_condition_strabismus' },
    { key: 'highMyopia', label: 'q5_condition_highMyopia' },
];

const symptomOptions: { key: string, label: keyof TranslationKeys }[] = [
    { key: 'pain', label: 'q6_symptom_pain' },
    { key: 'itching', label: 'q6_symptom_itching' },
    { key: 'burning', label: 'q6_symptom_burning' },
    { key: 'tearing', label: 'q6_symptom_tearing' },
    { key: 'gritty', label: 'q6_symptom_gritty' },
    { key: 'lightSensitivity', label: 'q6_symptom_lightSensitivity' },
    { key: 'doubleVision', label: 'q6_symptom_doubleVision' },
];

const screenTimeOptions: { key: string, label: keyof TranslationKeys }[] = [
    { key: 'Less than 2 hours', label: 'screen_time_less_than_2'},
    { key: '2-4 hours', label: 'screen_time_2_4'},
    { key: '4-8 hours', label: 'screen_time_4_8'},
    { key: 'More than 8 hours', label: 'screen_time_more_than_8'},
];

const hazardOptions: { key: string, label: keyof TranslationKeys }[] = [
    { key: 'oil_gas', label: 'hazards_oil_gas' },
    { key: 'mining', label: 'hazards_mining' },
    { key: 'agro', label: 'hazards_agro' },
    { key: 'chemicals', label: 'hazards_chemicals' },
    { key: 'outdoor_elements', label: 'hazards_outdoor_elements' },
];

export const HealthQuestionnaire: React.FC<HealthQuestionnaireProps> = ({ onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<HealthData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof HealthData | 'birthDate', string>>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'day' || name === 'month' || name === 'year') {
      setFormData(prev => ({ ...prev, birthDate: { ...prev.birthDate, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleRadioChange = (name: keyof HealthData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (group: keyof Pick<HealthData, 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms' | 'occupationalHazards'>, value: string) => {
    setFormData(prev => {
        const currentSelection = prev[group] as string[];
        let newSelection: string[];

        if (value === 'none') {
            newSelection = currentSelection.includes('none') ? [] : ['none'];
        } else {
            const updatedSelection = currentSelection.includes(value)
                ? currentSelection.filter(item => item !== value)
                : [...currentSelection, value];
            
            newSelection = updatedSelection.filter(item => item !== 'none');
        }
        
        return { ...prev, [group]: newSelection };
    });
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      newErrors.firstName = t('validation_name_required');
    }
    if (!formData.birthDate.day || !formData.birthDate.month || !formData.birthDate.year) {
      newErrors.birthDate = t('validation_dob_required');
    }
     if (formData.primaryReason.length === 0) {
      newErrors.primaryReason = t('validation_reason_required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const renderRadio = (group: keyof HealthData, value: string, labelKey: keyof TranslationKeys) => (
      <label key={value} className="flex items-center space-x-2 text-sm text-primary-dark">
        <input
          type="radio"
          name={group}
          value={value}
          checked={formData[group as 'wearsLenses' | 'hadSurgeryOrInjury' | 'screenTime'] === value}
          onChange={() => handleRadioChange(group, value)}
          className="accent-primary focus:ring-accent"
        />
        <span>{t(labelKey)}</span>
      </label>
  );

  const renderCheckbox = (group: keyof Pick<HealthData, 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms' | 'occupationalHazards'>, value: string, labelKey: keyof TranslationKeys) => (
      <label key={value} className="flex items-center space-x-2 text-sm text-primary-dark">
        <input
          type="checkbox"
          value={value}
          checked={(formData[group] as string[]).includes(value)}
          onChange={() => handleCheckboxChange(group, value)}
          className="rounded border-gray-300 accent-primary focus:ring-accent"
        />
        <span>{t(labelKey)}</span>
      </label>
  );
  
  return (
    <div className="space-y-8">
      <p className="text-primary-dark/80 text-sm">{t('questionnaire_intro')}</p>
      
      {/* Personal Info */}
      <div className="flex flex-col sm:flex-row sm:space-x-4">
        <InputField label={t('q_firstNameLabel')} id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} required placeholder={t('q_firstNamePlaceholder')} className="w-full" error={errors.firstName ? ' ' : ''} />
        <InputField label={t('q_lastNameLabel')} id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} required placeholder={t('q_lastNamePlaceholder')} className="w-full" error={errors.firstName ? ' ' : ''} />
      </div>
      {errors.firstName && <p className="mt-1 text-sm text-danger -translate-y-3">{errors.firstName}</p>}

      <div>
        <label className="block text-sm font-medium text-primary-dark mb-2">{t('q_dob_label')}</label>
        <div className="grid grid-cols-3 gap-2">
            <select name="day" value={formData.birthDate.day} onChange={handleInputChange} required className={`mt-1 block w-full px-3 py-2 border ${errors.birthDate ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
              <option value="" disabled>{t('q_dob_day_placeholder')}</option>
              {days.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <select name="month" value={formData.birthDate.month} onChange={handleInputChange} required className={`mt-1 block w-full px-3 py-2 border ${errors.birthDate ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
              <option value="" disabled>{t('q_dob_month_placeholder')}</option>
              {months.map((monthKey, index) => <option key={monthKey} value={String(index + 1)}>{t(monthKey)}</option>)}
            </select>
            <select name="year" value={formData.birthDate.year} onChange={handleInputChange} required className={`mt-1 block w-full px-3 py-2 border ${errors.birthDate ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
              <option value="" disabled>{t('q_dob_year_placeholder')}</option>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
        {errors.birthDate && <p className="mt-1 text-sm text-danger">{errors.birthDate}</p>}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q1_label_new')}</label>
          <div className="space-y-2">
            {reasonOptions.map(opt => renderCheckbox('primaryReason', opt.key, opt.label))}
          </div>
          {errors.primaryReason && <p className="mt-1 text-sm text-danger">{errors.primaryReason}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q2_label')}</label>
          <div className="flex items-center space-x-4">
            {renderRadio('wearsLenses', 'yes', 'q2_yes')} 
            {renderRadio('wearsLenses', 'no', 'q2_no')}
            {renderRadio('wearsLenses', 'other', 'q_option_other_not_sure')}
          </div>
          {formData.wearsLenses === 'yes' && <div className="mt-4 space-y-4 pl-2 border-l-2 border-accent/50"><div><label htmlFor="lensesSatisfaction" className="block text-xs font-medium text-primary-dark/80 mb-1">{t('q2_satisfactionLabel')}</label><input id="lensesSatisfaction" type="text" name="lensesSatisfaction" value={formData.lensesSatisfaction} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q2_satisfactionPlaceholder')} /></div><div><label htmlFor="lensesLastUpdate" className="block text-xs font-medium text-primary-dark/80 mb-1">{t('q2_lastUpdateLabel')}</label><input id="lensesLastUpdate" type="text" name="lensesLastUpdate" value={formData.lensesLastUpdate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q2_lastUpdatePlaceholder')} /></div></div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q3_label')}</label>
          <div className="flex items-center space-x-4">
            {renderRadio('hadSurgeryOrInjury', 'yes', 'q2_yes')}
            {renderRadio('hadSurgeryOrInjury', 'no', 'q2_no')}
            {renderRadio('hadSurgeryOrInjury', 'other', 'q_option_other_not_sure')}
          </div>
          {formData.hadSurgeryOrInjury === 'yes' && <div className="mt-4 pl-2 border-l-2 border-accent/50"><label htmlFor="surgeryOrInjuryDetails" className="block text-xs font-medium text-primary-dark/80 mb-1">{t('q3_detailsLabel')}</label><input id="surgeryOrInjuryDetails" type="text" name="surgeryOrInjuryDetails" value={formData.surgeryOrInjuryDetails} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q3_detailsPlaceholder')} /></div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q4_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {illnessOptions.map(opt => renderCheckbox('illnesses', opt.key, opt.label))}
            {renderCheckbox('illnesses', 'none', 'q_option_none_of_the_above')}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q5_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {familyHistoryOptions.map(opt => renderCheckbox('familyHistory', opt.key, opt.label))}
            {renderCheckbox('familyHistory', 'none', 'q_option_none_of_the_above')}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q6_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {symptomOptions.map(opt => renderCheckbox('symptoms', opt.key, opt.label))}
            {renderCheckbox('symptoms', 'none', 'q_option_none_of_the_above')}
          </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-primary-dark mb-2">{t('questionnaire_screenTime')}</label>
            <div className="space-y-2">
                {screenTimeOptions.map(opt => renderRadio('screenTime', opt.key, opt.label))}
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-primary-dark mb-2">{t('questionnaire_occupationalHazards')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hazardOptions.map(opt => renderCheckbox('occupationalHazards', opt.key, opt.label))}
                {renderCheckbox('occupationalHazards', 'none', 'hazards_none')}
            </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button onClick={handleNext} size="lg" className="w-full">
          {t('questionnaire_submitButton')}
        </Button>
      </div>
    </div>
  );
};