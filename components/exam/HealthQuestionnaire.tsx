import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HealthData } from '../../types';
import { Button } from '../common/Button';
import { TranslationKeys } from '../../localization/en';
import { InputField } from '../common/InputField';
import { usStates, usCities } from '../../data/locations';


interface HealthQuestionnaireProps {
  onSubmit: (data: HealthData) => void;
}

const initialFormData: HealthData = {
  firstName: '',
  lastName: '',
  city: '',
  state: '',
  birthDate: { day: '', month: '', year: '' },
  primaryReason: {
    blurry: false,
    tired: false,
    redness: false,
    checkup: false,
    other: false,
  },
  screenTimeHours: '',
  wearsLenses: '',
  lensesSatisfaction: '',
  lensesLastUpdate: '',
  hadSurgeryOrInjury: '',
  surgeryOrInjuryDetails: '',
  illnesses: {
    diabetes: false,
    highBloodPressure: false,
    highCholesterol: false,
    thyroid: false,
    arthritis: false,
    otherOrNotSure: false,
  },
  familyHistory: {
    glaucoma: false,
    macularDegeneration: false,
    strabismus: false,
    highMyopia: false,
    otherOrNotSure: false,
  },
  symptoms: {
    pain: false,
    itching: false,
    burning: false,
    tearing: false,
    gritty: false,
    lightSensitivity: false,
    doubleVision: false,
    none: false,
    otherOrNotSure: false,
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
  const [errors, setErrors] = useState<Partial<Record<keyof HealthData | 'state', string>>>({});
  const [cities, setCities] = useState<string[]>([]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    setFormData(prev => ({
        ...prev,
        state: stateCode,
        city: '', // Reset city when state changes
    }));
    setCities(usCities[stateCode] || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'day' || name === 'month' || name === 'year') {
      setFormData(prev => ({ ...prev, birthDate: { ...prev.birthDate, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (
    group: keyof Pick<HealthData, 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms'>,
    key: string
  ) => {
    setFormData(prev => {
      const newGroupState = { ...prev[group] } as Record<string, boolean>;

      // 'none' is a special exclusive option only in the 'symptoms' group
      if (key === 'none' && group === 'symptoms') {
        const currentlyTrue = newGroupState.none;
        // Uncheck all, then toggle 'none'
        Object.keys(newGroupState).forEach(k => {
          newGroupState[k] = false;
        });
        newGroupState.none = !currentlyTrue;
      } else {
        // Toggle the clicked checkbox
        newGroupState[key] = !newGroupState[key];
        // If a regular option was just checked, make sure 'none' is unchecked
        if (group === 'symptoms' && newGroupState[key] && 'none' in newGroupState) {
          newGroupState.none = false;
        }
      }
      
      return { ...prev, [group]: newGroupState as any };
    });
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      newErrors.firstName = t('error_validation_name');
    }
    if (!formData.birthDate.day || !formData.birthDate.month || !formData.birthDate.year) {
      newErrors.birthDate = t('error_validation_dob_full');
    }
    if (!formData.state) { // Check if state is selected
      newErrors.state = t('error_validation_state');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const renderRadioGroup = (name: keyof HealthData, options: {value: string, label: keyof TranslationKeys}[]) => (
      <div className="space-y-2">
          {options.map(opt => (
              <label key={opt.value} className="flex items-center space-x-2 text-sm text-primary-dark">
                  <input
                      type="radio"
                      name={name}
                      value={opt.value}
                      checked={(formData[name] as string) === opt.value}
                      onChange={handleInputChange}
                      className="accent-primary focus:ring-accent"
                  />
                  <span>{t(opt.label)}</span>
              </label>
          ))}
      </div>
  );

  const renderCheckboxGroup = (groupName: keyof HealthData, options: {key: string, label: keyof TranslationKeys}[]) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map(opt => (
              <label key={opt.key} className="flex items-center space-x-2 text-sm text-primary-dark">
                  <input
                      type="checkbox"
                      checked={formData[groupName as 'illnesses' | 'familyHistory' | 'symptoms' | 'primaryReason'][opt.key as keyof typeof formData[typeof groupName]]}
                      onChange={() => handleCheckboxChange(groupName as 'illnesses' | 'familyHistory' | 'symptoms' | 'primaryReason', opt.key)}
                      className="rounded border-gray-300 accent-primary focus:ring-accent"
                  />
                  <span>{t(opt.label)}</span>
              </label>
          ))}
      </div>
  );

  return (
    <div className="space-y-8">
      <p className="text-primary-dark/80 text-sm">{t('questionnaire_intro')}</p>
      
      <div className="flex flex-col sm:flex-row sm:space-x-4">
        <InputField label={t('q_firstNameLabel')} id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} required placeholder={t('q_firstNamePlaceholder')} className="w-full" error={errors.firstName ? ' ' : ''} />
        <InputField label={t('q_lastNameLabel')} id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} required placeholder={t('q_lastNamePlaceholder')} className="w-full" error={errors.firstName ? ' ' : ''} />
      </div>
      {errors.firstName && <p className="mt-1 text-sm text-danger -translate-y-3">{errors.firstName}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-primary-dark mb-1">{t('q_stateLabel')}</label>
          <select id="state" name="state" value={formData.state} onChange={handleStateChange} required className={`mt-1 block w-full px-3 py-2 border ${errors.state ? 'border-danger' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white`}>
            <option value="" disabled>{t('q_statePlaceholder')}</option>
            {usStates.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>
        <div>
            <label htmlFor="city" className="block text-sm font-medium text-primary-dark mb-1">{t('q_cityLabel')}</label>
            <select id="city" name="city" value={formData.city} onChange={handleInputChange} required disabled={!formData.state} className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white disabled:bg-gray-50`}>
                <option value="" disabled>{t('q_cityPlaceholder')}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>
      {errors.state && <p className="mt-1 text-sm text-danger">{errors.state}</p>}


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

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q1_label_new')}</label>
          {renderCheckboxGroup('primaryReason', [
              {key: 'blurry', label: 'q1_option_blurry'},
              {key: 'tired', label: 'q1_option_tired'},
              {key: 'redness', label: 'q1_option_redness'},
              {key: 'checkup', label: 'q1_option_checkup'},
              {key: 'other', label: 'q_option_other_not_sure'}
          ])}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q2_label')}</label>
          {renderRadioGroup('wearsLenses', [
              {value: 'yes', label: 'q2_yes'},
              {value: 'no', label: 'q2_no'},
              {value: 'other', label: 'q_option_other_not_sure'}
          ])}
          {formData.wearsLenses === 'yes' && <div className="mt-4 space-y-4 pl-2 border-l-2 border-accent/50"><div><label htmlFor="lensesSatisfaction" className="block text-xs font-medium text-primary-dark/80 mb-1">{t('q2_satisfactionLabel')}</label><input id="lensesSatisfaction" type="text" name="lensesSatisfaction" value={formData.lensesSatisfaction} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q2_satisfactionPlaceholder')} /></div><div><label htmlFor="lensesLastUpdate" className="block text-xs font-medium text-primary-dark/80 mb-1">{t('q2_lastUpdateLabel')}</label><input id="lensesLastUpdate" type="text" name="lensesLastUpdate" value={formData.lensesLastUpdate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q2_lastUpdatePlaceholder')} /></div></div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q3_label')}</label>
          {renderRadioGroup('hadSurgeryOrInjury', [
              {value: 'yes', label: 'q2_yes'},
              {value: 'no', label: 'q2_no'},
              {value: 'other', label: 'q_option_other_not_sure'}
          ])}
          {formData.hadSurgeryOrInjury === 'yes' && <div className="mt-4 pl-2 border-l-2 border-accent/50"><label htmlFor="surgeryOrInjuryDetails" className="block text-xs font-medium text-primary-dark/80 mb-1">{t('q3_detailsLabel')}</label><input id="surgeryOrInjuryDetails" type="text" name="surgeryOrInjuryDetails" value={formData.surgeryOrInjuryDetails} onChange={handleInputChange} className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white" placeholder={t('q3_detailsPlaceholder')} /></div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q4_label')}</label>
          {renderCheckboxGroup('illnesses', [
              {key: 'diabetes', label: 'q4_illness_diabetes'},
              {key: 'highBloodPressure', label: 'q4_illness_highBloodPressure'},
              {key: 'highCholesterol', label: 'q4_illness_highCholesterol'},
              {key: 'thyroid', label: 'q4_illness_thyroid'},
              {key: 'arthritis', label: 'q4_illness_arthritis'},
              {key: 'otherOrNotSure', label: 'q_option_other_not_sure'}
          ])}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q5_label')}</label>
          {renderCheckboxGroup('familyHistory', [
              {key: 'glaucoma', label: 'q5_condition_glaucoma'},
              {key: 'macularDegeneration', label: 'q5_condition_macularDegeneration'},
              {key: 'strabismus', label: 'q5_condition_strabismus'},
              {key: 'highMyopia', label: 'q5_condition_highMyopia'},
              {key: 'otherOrNotSure', label: 'q_option_other_not_sure'}
          ])}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-2">{t('q6_label')}</label>
          {renderCheckboxGroup('symptoms', [
              {key: 'pain', label: 'q6_symptom_pain'},
              {key: 'itching', label: 'q6_symptom_itching'},
              {key: 'burning', label: 'q6_symptom_burning'},
              {key: 'tearing', label: 'q6_symptom_tearing'},
              {key: 'gritty', label: 'q6_symptom_gritty'},
              {key: 'lightSensitivity', label: 'q6_symptom_lightSensitivity'},
              {key: 'doubleVision', label: 'q6_symptom_doubleVision'},
              {key: 'none', label: 'q6_symptom_none'},
              {key: 'otherOrNotSure', label: 'q_option_other_not_sure'},
          ])}
        </div>
        <div>
            <label className="block text-sm font-medium text-primary-dark mb-2">{t('q_screenTime_label')}</label>
            {renderRadioGroup('screenTimeHours', [
                {value: '0_2', label: 'q_screenTime_option_0_2'},
                {value: '2_4', label: 'q_screenTime_option_2_4'},
                {value: '4_8', label: 'q_screenTime_option_4_8'},
                {value: '8_plus', label: 'q_screenTime_option_8_plus'}
            ])}
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