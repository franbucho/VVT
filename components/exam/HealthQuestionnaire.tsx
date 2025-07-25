import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HealthData } from '../../types';
import { Button } from '../common/Button';
import { TranslationKeys } from '../../localization/en';
import { InputField } from '../common/InputField';
import { usStates, usCities } from '../../data/locations';
import firebase from 'firebase/compat/app';

interface HealthQuestionnaireProps {
  onSubmit: (data: HealthData) => void;
  currentUser: firebase.User | null;
}

const initialFormData: HealthData = {
  firstName: '',
  lastName: '',
  city: '',
  state: '',
  birthDate: { day: '', month: '', year: '' },
  primaryReason: { blurry: false, tired: false, redness: false, checkup: false, other: false, none: false },
  screenTimeHours: '',
  wearsLenses: '',
  lensesSatisfaction: '',
  lensesLastUpdate: '',
  hadSurgeryOrInjury: '',
  surgeryOrInjuryDetails: '',
  illnesses: { diabetes: false, highBloodPressure: false, highCholesterol: false, thyroid: false, arthritis: false, otherOrNotSure: false, none: false },
  familyHistory: { glaucoma: false, macularDegeneration: false, strabismus: false, highMyopia: false, otherOrNotSure: false, none: false },
  symptoms: { pain: false, itching: false, burning: false, tearing: false, gritty: false, lightSensitivity: false, doubleVision: false, none: false, otherOrNotSure: false },
};

const months: (keyof TranslationKeys)[] = [
  'month_january', 'month_february', 'month_march', 'month_april', 'month_may', 'month_june',
  'month_july', 'month_august', 'month_september', 'month_october', 'month_november', 'month_december'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

const QuestionWrapper: React.FC<{ label: string; children: React.ReactNode; error?: string }> = ({ label, children, error }) => (
    <div className="animate-fade-in space-y-4">
        <label className="block text-2xl sm:text-3xl font-semibold text-primary-dark dark:text-dark-text-primary mb-6 text-center">{label}</label>
        {children}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
);

export const HealthQuestionnaire: React.FC<HealthQuestionnaireProps> = ({ onSubmit, currentUser }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<HealthData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser?.displayName) {
        const nameParts = currentUser.displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        setFormData(prev => ({ ...prev, firstName, lastName }));
    }
  }, [currentUser]);
  
  useEffect(() => {
      if (formData.state) {
          setCities(usCities[formData.state] || []);
      }
  }, [formData.state]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    setFormData(prev => ({ ...prev, state: stateCode, city: '' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'day' || name === 'month' || name === 'year') {
      setFormData(prev => ({ ...prev, birthDate: { ...prev.birthDate, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (group: keyof Pick<HealthData, 'primaryReason' | 'illnesses' | 'familyHistory' | 'symptoms'>, key: string) => {
    setFormData(prev => {
      const newGroupState = { ...prev[group] } as Record<string, boolean>;
      if (key === 'none') {
        const isCheckingNone = !newGroupState.none;
        Object.keys(newGroupState).forEach(k => { newGroupState[k] = false; });
        newGroupState.none = isCheckingNone;
      } else {
        newGroupState[key] = !newGroupState[key];
        if (newGroupState[key]) newGroupState.none = false;
      }
      return { ...prev, [group]: newGroupState as any };
    });
  };

  const renderRadioGroup = (name: keyof HealthData, options: {value: string, label: keyof TranslationKeys}[]) => (
      <div className="space-y-3">
          {options.map(opt => (
              <label key={opt.value} className="flex items-center space-x-4 text-lg text-primary-dark dark:text-dark-text-secondary cursor-pointer p-4 rounded-lg border-2 border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-background/50 has-[:checked]:bg-accent/10 has-[:checked]:border-accent dark:has-[:checked]:bg-dark-accent/10 dark:has-[:checked]:border-dark-accent">
                  <input type="radio" name={name} value={opt.value} checked={(formData[name] as string) === opt.value} onChange={handleInputChange} className="accent-primary dark:accent-dark-accent focus:ring-accent dark:focus:ring-dark-accent w-5 h-5" />
                  <span>{t(opt.label)}</span>
              </label>
          ))}
      </div>
  );

  const renderCheckboxGroup = (groupName: keyof HealthData, options: {key: string, label: keyof TranslationKeys}[]) => (
      <div className="space-y-3">
          {options.map(opt => (
              <label key={opt.key} className="flex items-center space-x-4 text-lg text-primary-dark dark:text-dark-text-secondary cursor-pointer p-4 rounded-lg border-2 border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-background/50 has-[:checked]:bg-accent/10 has-[:checked]:border-accent dark:has-[:checked]:bg-dark-accent/10 dark:has-[:checked]:border-dark-accent">
                  <input type="checkbox" checked={formData[groupName as 'illnesses'][opt.key as keyof typeof formData['illnesses']]} onChange={() => handleCheckboxChange(groupName as any, opt.key)} className="rounded border-gray-300 dark:border-dark-border dark:bg-dark-card accent-primary dark:accent-dark-accent focus:ring-accent dark:focus:ring-dark-accent w-5 h-5" />
                  <span>{t(opt.label)}</span>
              </label>
          ))}
      </div>
  );
  
  const questions = [
    { key: 'name', validate: () => !formData.firstName.trim() || !formData.lastName.trim() ? t('error_validation_name') : null, render: () => (
        <QuestionWrapper label={`${t('q_firstNameLabel')} & ${t('q_lastNameLabel')}`} error={errors.name}>
            <InputField label={t('q_firstNameLabel')} id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} required placeholder={t('q_firstNamePlaceholder')} className="sm:text-lg p-3" />
            <InputField label={t('q_lastNameLabel')} id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} required placeholder={t('q_lastNamePlaceholder')} className="sm:text-lg p-3" />
        </QuestionWrapper>
    )},
    { key: 'location', validate: () => !formData.state ? t('error_validation_state') : null, render: () => (
        <QuestionWrapper label={`${t('q_stateLabel')} & ${t('q_cityLabel')}`} error={errors.location}>
            <select id="state" name="state" value={formData.state} onChange={handleStateChange} required className="block w-full px-3 py-3 border-2 border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-lg bg-white dark:bg-dark-card dark:text-dark-text-primary">
                <option value="" disabled>{t('q_statePlaceholder')}</option>
                {usStates.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <select id="city" name="city" value={formData.city} onChange={handleInputChange} required disabled={!formData.state} className="block w-full px-3 py-3 border-2 border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-lg bg-white dark:bg-dark-card dark:text-dark-text-primary disabled:bg-gray-100 dark:disabled:bg-dark-background/50">
                <option value="" disabled>{t('q_cityPlaceholder')}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </QuestionWrapper>
    )},
    { key: 'dob', validate: () => !formData.birthDate.day || !formData.birthDate.month || !formData.birthDate.year ? t('error_validation_dob_full') : null, render: () => (
        <QuestionWrapper label={t('q_dob_label')} error={errors.dob}>
             <div className="grid grid-cols-3 gap-4">
                <select name="day" value={formData.birthDate.day} onChange={handleInputChange} required className="block w-full px-3 py-3 border-2 border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-lg bg-white dark:bg-dark-card dark:text-dark-text-primary"><option value="" disabled>{t('q_dob_day_placeholder')}</option>{days.map(day => <option key={day} value={day}>{day}</option>)}</select>
                <select name="month" value={formData.birthDate.month} onChange={handleInputChange} required className="block w-full px-3 py-3 border-2 border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-lg bg-white dark:bg-dark-card dark:text-dark-text-primary"><option value="" disabled>{t('q_dob_month_placeholder')}</option>{months.map((monthKey, index) => <option key={monthKey} value={String(index + 1)}>{t(monthKey)}</option>)}</select>
                <select name="year" value={formData.birthDate.year} onChange={handleInputChange} required className="block w-full px-3 py-3 border-2 border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-lg bg-white dark:bg-dark-card dark:text-dark-text-primary"><option value="" disabled>{t('q_dob_year_placeholder')}</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select>
            </div>
        </QuestionWrapper>
    )},
    { key: 'reason', validate: () => null, render: () => (
        <QuestionWrapper label={t('q1_label_new')}>
             {renderCheckboxGroup('primaryReason', [{key: 'blurry', label: 'q1_option_blurry'},{key: 'tired', label: 'q1_option_tired'},{key: 'redness', label: 'q1_option_redness'},{key: 'checkup', label: 'q1_option_checkup'},{key: 'other', label: 'q_option_other_not_sure'}, {key: 'none', label: 'q6_symptom_none'}])}
        </QuestionWrapper>
    )},
    { key: 'lenses', validate: () => null, render: () => (
        <QuestionWrapper label={t('q2_label')}>
            {renderRadioGroup('wearsLenses', [{value: 'yes', label: 'q2_yes'}, {value: 'no', label: 'q2_no'}, {value: 'other', label: 'q_option_other_not_sure'}])}
            {formData.wearsLenses === 'yes' && <div className="mt-4 space-y-4 pl-4 border-l-4 border-accent/50 dark:border-dark-accent/50 animate-fade-in"><InputField label={t('q2_satisfactionLabel')} id="lensesSatisfaction" name="lensesSatisfaction" value={formData.lensesSatisfaction} onChange={handleInputChange} placeholder={t('q2_satisfactionPlaceholder')} className="sm:text-lg p-3" /><InputField label={t('q2_lastUpdateLabel')} id="lensesLastUpdate" name="lensesLastUpdate" value={formData.lensesLastUpdate} onChange={handleInputChange} placeholder={t('q2_lastUpdatePlaceholder')} className="sm:text-lg p-3" /></div>}
        </QuestionWrapper>
    )},
    { key: 'surgery', validate: () => null, render: () => (
        <QuestionWrapper label={t('q3_label')}>
            {renderRadioGroup('hadSurgeryOrInjury', [{value: 'yes', label: 'q2_yes'}, {value: 'no', label: 'q2_no'}, {value: 'other', label: 'q_option_other_not_sure'}])}
            {formData.hadSurgeryOrInjury === 'yes' && <div className="mt-4 pl-4 border-l-4 border-accent/50 dark:border-dark-accent/50 animate-fade-in"><InputField label={t('q3_detailsLabel')} id="surgeryOrInjuryDetails" name="surgeryOrInjuryDetails" value={formData.surgeryOrInjuryDetails} onChange={handleInputChange} placeholder={t('q3_detailsPlaceholder')} className="sm:text-lg p-3" /></div>}
        </QuestionWrapper>
    )},
    { key: 'illnesses', validate: () => null, render: () => (
        <QuestionWrapper label={t('q4_label')}>{renderCheckboxGroup('illnesses', [{key: 'diabetes', label: 'q4_illness_diabetes'},{key: 'highBloodPressure', label: 'q4_illness_highBloodPressure'},{key: 'highCholesterol', label: 'q4_illness_highCholesterol'},{key: 'thyroid', label: 'q4_illness_thyroid'},{key: 'arthritis', label: 'q4_illness_arthritis'},{key: 'otherOrNotSure', label: 'q_option_other_not_sure'}, {key: 'none', label: 'q6_symptom_none'}])}</QuestionWrapper>
    )},
    { key: 'familyHistory', validate: () => null, render: () => (
        <QuestionWrapper label={t('q5_label')}>{renderCheckboxGroup('familyHistory', [{key: 'glaucoma', label: 'q5_condition_glaucoma'},{key: 'macularDegeneration', label: 'q5_condition_macularDegeneration'},{key: 'strabismus', label: 'q5_condition_strabismus'},{key: 'highMyopia', label: 'q5_condition_highMyopia'},{key: 'otherOrNotSure', label: 'q_option_other_not_sure'}, {key: 'none', label: 'q6_symptom_none'}])}</QuestionWrapper>
    )},
    { key: 'symptoms', validate: () => null, render: () => (
        <QuestionWrapper label={t('q6_label')}>{renderCheckboxGroup('symptoms', [{key: 'pain', label: 'q6_symptom_pain'},{key: 'itching', label: 'q6_symptom_itching'},{key: 'burning', label: 'q6_symptom_burning'},{key: 'tearing', label: 'q6_symptom_tearing'},{key: 'gritty', label: 'q6_symptom_gritty'},{key: 'lightSensitivity', label: 'q6_symptom_lightSensitivity'},{key: 'doubleVision', label: 'q6_symptom_doubleVision'},{key: 'none', label: 'q6_symptom_none'},{key: 'otherOrNotSure', label: 'q_option_other_not_sure'}])}</QuestionWrapper>
    )},
    { key: 'screenTime', validate: () => null, render: () => (
        <QuestionWrapper label={t('q_screenTime_label')}>
            {renderRadioGroup('screenTimeHours', [{value: '0_2', label: 'q_screenTime_option_0_2'},{value: '2_4', label: 'q_screenTime_option_2_4'},{value: '4_8', label: 'q_screenTime_option_4_8'},{value: '8_plus', label: 'q_screenTime_option_8_plus'}])}
        </QuestionWrapper>
    )}
  ];
  
  const totalSteps = questions.length;

  const handleNext = () => {
    const error = questions[currentStep].validate();
    if (error) {
      setErrors({ [questions[currentStep].key]: error });
      return;
    }
    setErrors({});
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary-dark/70 dark:text-dark-text-secondary text-center">
          {t('questionnaire_progress_step', { current: currentStep + 1, total: totalSteps })}
        </p>
        <div className="w-full bg-gray-200 dark:bg-dark-border/50 rounded-full h-2.5">
          <div 
            className="bg-accent dark:bg-dark-accent h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[400px] flex flex-col justify-center">
        {questions[currentStep].render()}
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-dark-border flex justify-between items-center">
        <Button onClick={handlePrevious} variant="outline" disabled={currentStep === 0}>
          {t('questionnaire_previous_button')}
        </Button>
        <Button onClick={handleNext} size="lg">
          {currentStep === totalSteps - 1 ? t('questionnaire_submitButton') : t('questionnaire_next_button')}
        </Button>
      </div>
    </div>
  );
};
