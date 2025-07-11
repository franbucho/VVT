
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
  primaryReason: '',
  wearsLenses: '',
  lensesSatisfaction: '',
  lensesLastUpdate: '',
  hadSurgeryOrInjury: '',
  surgeryOrInjuryDetails: '',
  illnesses: {
    diabetes: false, highBloodPressure: false, highCholesterol: false,
    thyroid: false, arthritis: false, otherOrNotSure: false,
  },
  familyHistory: {
    glaucoma: false, macularDegeneration: false, strabismus: false,
    highMyopia: false, otherOrNotSure: false,
  },
  symptoms: {
    pain: false, itching: false, burning: false, tearing: false,
    gritty: false, lightSensitivity: false, doubleVision: false,
    none: false, otherOrNotSure: false,
  },
};

const months: (keyof TranslationKeys)[] = [
  'month_january', 'month_february', 'month_march', 'month_april', 'month_may', 'month_june',
  'month_july', 'month_august', 'month_september', 'month_october', 'month_november', 'month_december'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

export const HealthQuestionnaire: React.FC<HealthQuestionnaireProps> = ({ onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<HealthData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof HealthData | 'birthDate.day' | 'birthDate.month' | 'birthDate.year', boolean>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleCheckboxGroupChange = (group: 'illnesses' | 'familyHistory' | 'symptoms', name: string) => {
    setFormData(prev => {
      const newGroupState = { ...prev[group] };
      const isChecking = !(newGroupState as any)[name];
      const isExclusive = name === 'none' || name === 'otherOrNotSure';

      if (isExclusive && isChecking) {
        Object.keys(newGroupState).forEach(key => { (newGroupState as any)[key] = false; });
        (newGroupState as any)[name] = true;
      } else if (isChecking) {
        (newGroupState as any)[name] = true;
        (newGroupState as any).none = false;
        (newGroupState as any).otherOrNotSure = false;
      } else {
        (newGroupState as any)[name] = false;
      }
      
      return { ...prev, [group]: newGroupState };
    });
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim()) newErrors.firstName = true;
    if (!formData.lastName.trim()) newErrors.lastName = true;
    if (!formData.birthDate.day) newErrors['birthDate.day'] = true;
    if (!formData.birthDate.month) newErrors['birthDate.month'] = true;
    if (!formData.birthDate.year) newErrors['birthDate.year'] = true;
    
    if (Object.keys(newErrors).length > 0) {
      if(newErrors.firstName || newErrors.lastName) {
        setErrorMessage(t('error_validation_name'));
      } else if (newErrors['birthDate.day'] || newErrors['birthDate.month'] || newErrors['birthDate.year']) {
        setErrorMessage(t('error_validation_dob_full'));
      }
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    setErrorMessage(null);
    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const renderRadio = (group: 'primaryReason' | 'wearsLenses' | 'hadSurgeryOrInjury', value: string, labelKey: any) => (
      <label key={value} className="flex items-center space-x-2 text-sm text-primary">
        <input
          type="radio"
          name={group}
          value={value}
          checked={formData[group] === value}
          onChange={() => handleRadioChange(group, value)}
          className="accent-primary focus:ring-accent"
          required={group === 'primaryReason'}
        />
        <span>{t(labelKey)}</span>
      </label>
  );

  const renderCheckbox = (group: 'illnesses' | 'familyHistory' | 'symptoms', name: string, labelKey: any) => (
      <label key={name} className="flex items-center space-x-2 text-sm text-primary">
        <input
          type="checkbox"
          name={name}
          checked={(formData[group] as any)[name]}
          onChange={() => handleCheckboxGroupChange(group, name)}
          className="rounded border-gray-300 accent-primary focus:ring-accent"
        />
        <span>{t(labelKey)}</span>
      </label>
  );

  return (
    <div className="space-y-8">
      <p className="text-primary/80 text-sm">{t('questionnaire_intro')}</p>
      
      <div className="flex flex-col sm:flex-row sm:space-x-4">
        <InputField
            label={t('q_firstNameLabel')}
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            placeholder={t('q_firstNamePlaceholder')}
            className="w-full"
            error={errors.firstName ? ' ' : ''}
        />
        <InputField
            label={t('q_lastNameLabel')}
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            placeholder={t('q_lastNamePlaceholder')}
            className="w-full"
            error={errors.lastName ? ' ' : ''}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">{t('q_dob_label')}</label>
        <div className="grid grid-cols-3 gap-2">
            <select name="day" value={formData.birthDate.day} onChange={handleInputChange} required className={`mt-1 block w-full px-3 py-2 border ${errors['birthDate.day'] ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
              <option value="" disabled>{t('q_dob_day_placeholder')}</option>
              {days.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <select name="month" value={formData.birthDate.month} onChange={handleInputChange} required className={`mt-1 block w-full px-3 py-2 border ${errors['birthDate.month'] ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
              <option value="" disabled>{t('q_dob_month_placeholder')}</option>
              {months.map((monthKey, index) => <option key={monthKey} value={index + 1}>{t(monthKey)}</option>)}
            </select>
            <select name="year" value={formData.birthDate.year} onChange={handleInputChange} required className={`mt-1 block w-full px-3 py-2 border ${errors['birthDate.year'] ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
              <option value="" disabled>{t('q_dob_year_placeholder')}</option>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('q1_label_new')}</label>
          <div className="space-y-2">{renderRadio('primaryReason', 'Blurry or altered vision', 'q1_option_blurry')} {renderRadio('primaryReason', 'Tired or fatigued eyes', 'q1_option_tired')} {renderRadio('primaryReason', 'Redness or irritation', 'q1_option_redness')} {renderRadio('primaryReason', 'Periodic check-up', 'q1_option_checkup')} {renderRadio('primaryReason', 'Other / Not sure', 'q_option_other_not_sure')}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('q2_label')}</label>
          <div className="flex items-center space-x-4">{renderRadio('wearsLenses', 'yes', 'q2_yes')} {renderRadio('wearsLenses', 'no', 'q2_no')} {renderRadio('wearsLenses', 'other', 'q_option_other_not_sure')}</div>
          {formData.wearsLenses === 'yes' && <div className="mt-4 space-y-4 pl-2 border-l-2 border-accent/50"><div><label htmlFor="lensesSatisfaction" className="block text-xs font-medium text-primary/80 mb-1">{t('q2_satisfactionLabel')}</label><input id="lensesSatisfaction" type="text" name="lensesSatisfaction" value={formData.lensesSatisfaction} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q2_satisfactionPlaceholder')} /></div><div><label htmlFor="lensesLastUpdate" className="block text-xs font-medium text-primary/80 mb-1">{t('q2_lastUpdateLabel')}</label><input id="lensesLastUpdate" type="text" name="lensesLastUpdate" value={formData.lensesLastUpdate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q2_lastUpdatePlaceholder')} /></div></div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('q3_label')}</label>
          <div className="flex items-center space-x-4">{renderRadio('hadSurgeryOrInjury', 'yes', 'q2_yes')} {renderRadio('hadSurgeryOrInjury', 'no', 'q2_no')} {renderRadio('hadSurgeryOrInjury', 'other', 'q_option_other_not_sure')}</div>
          {formData.hadSurgeryOrInjury === 'yes' && <div className="mt-4 pl-2 border-l-2 border-accent/50"><label htmlFor="surgeryOrInjuryDetails" className="block text-xs font-medium text-primary/80 mb-1">{t('q3_detailsLabel')}</label><input id="surgeryOrInjuryDetails" type="text" name="surgeryOrInjuryDetails" value={formData.surgeryOrInjuryDetails} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q3_detailsPlaceholder')} /></div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('q4_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{renderCheckbox('illnesses', 'diabetes', 'q4_illness_diabetes')} {renderCheckbox('illnesses', 'highBloodPressure', 'q4_illness_highBloodPressure')} {renderCheckbox('illnesses', 'highCholesterol', 'q4_illness_highCholesterol')} {renderCheckbox('illnesses', 'thyroid', 'q4_illness_thyroid')} {renderCheckbox('illnesses', 'arthritis', 'q4_illness_arthritis')} {renderCheckbox('illnesses', 'otherOrNotSure', 'q_option_other_not_sure')}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('q5_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{renderCheckbox('familyHistory', 'glaucoma', 'q5_condition_glaucoma')} {renderCheckbox('familyHistory', 'macularDegeneration', 'q5_condition_macularDegeneration')} {renderCheckbox('familyHistory', 'strabismus', 'q5_condition_strabismus')} {renderCheckbox('familyHistory', 'highMyopia', 'q5_condition_highMyopia')} {renderCheckbox('familyHistory', 'otherOrNotSure', 'q_option_other_not_sure')}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('q6_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{renderCheckbox('symptoms', 'pain', 'q6_symptom_pain')} {renderCheckbox('symptoms', 'itching', 'q6_symptom_itching')} {renderCheckbox('symptoms', 'burning', 'q6_symptom_burning')} {renderCheckbox('symptoms', 'tearing', 'q6_symptom_tearing')} {renderCheckbox('symptoms', 'gritty', 'q6_symptom_gritty')} {renderCheckbox('symptoms', 'lightSensitivity', 'q6_symptom_lightSensitivity')} {renderCheckbox('symptoms', 'doubleVision', 'q6_symptom_doubleVision')} {renderCheckbox('symptoms', 'none', 'q6_symptom_none')} {renderCheckbox('symptoms', 'otherOrNotSure', 'q_option_other_not_sure')}</div>
        </div>
      </div>

      {errorMessage && (
        <div className="my-4 p-3 bg-red-50 border border-danger text-danger text-sm rounded-md text-center">
          {errorMessage}
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <Button onClick={handleNext} size="lg" className="w-full">
          {t('questionnaire_submitButton')}
        </Button>
      </div>
    </div>
  );
};
