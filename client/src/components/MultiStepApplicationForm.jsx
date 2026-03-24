import { useEffect, useMemo, useState } from 'react';
import { getApplication, getFields, patchApplicationStep } from '../api/lendingApi.js';
import DynamicField from './DynamicField.jsx';
import { STEPS, createInitialFormData } from '../constants/steps.js';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
import { shouldRenderField } from '../lib/formUtils.js';

export default function MultiStepApplicationForm({
  applicationId,
  product = 'DSCR',
  apiBaseUrl = getApiBaseUrl()
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(createInitialFormData);
  const [fieldsByStep, setFieldsByStep] = useState({});
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const stepName = STEPS[currentStepIndex];
  const stepData = formData[stepName] || {};
  const currentFields = fieldsByStep[stepName] || [];

  useEffect(() => {
    if (!applicationId) return;

    let isActive = true;
    setIsLoadingApp(true);
    setError('');

    getApplication(apiBaseUrl, applicationId)
      .then((application) => {
        if (!isActive) return;
        const fromDb = application?.application_data || {};
        setFormData({
          ...createInitialFormData(),
          ...fromDb
        });
      })
      .catch((loadError) => {
        if (!isActive) return;
        setError(loadError.message);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingApp(false);
      });

    return () => {
      isActive = false;
    };
  }, [apiBaseUrl, applicationId]);

  useEffect(() => {
    if (!stepName || fieldsByStep[stepName]) return;

    let isActive = true;
    setError('');

    getFields(apiBaseUrl, product, stepName)
      .then((fields) => {
        if (!isActive) return;
        setFieldsByStep((prev) => ({
          ...prev,
          [stepName]: fields
        }));
      })
      .catch((fieldsError) => {
        if (!isActive) return;
        setError(fieldsError.message);
      });

    return () => {
      isActive = false;
    };
  }, [apiBaseUrl, fieldsByStep, product, stepName]);

  const visibleFields = useMemo(
    () => currentFields.filter((field) => shouldRenderField(field, formData)),
    [currentFields, formData]
  );

  const updateStepValue = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [stepName]: {
        ...prev[stepName],
        [key]: value
      }
    }));
  };

  const saveCurrentStep = async () => {
    if (!applicationId) {
      throw new Error('applicationId is required.');
    }

    setIsSaving(true);
    setError('');
    setStatusMessage('');

    try {
      const updatedApplication = await patchApplicationStep(
        apiBaseUrl,
        applicationId,
        stepName,
        formData[stepName] || {}
      );

      setFormData((prev) => ({
        ...prev,
        ...(updatedApplication?.application_data || {})
      }));
      setStatusMessage('Progress saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    try {
      await saveCurrentStep();
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const handleBack = async () => {
    try {
      await saveCurrentStep();
      setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  return (
    <div className="card">
      <h1>Lending Application</h1>
      <p className="meta">
        Product: <strong>{product}</strong> | Step {currentStepIndex + 1} of {STEPS.length}
      </p>
      <h2>{stepName}</h2>

      {isLoadingApp && <p>Loading application...</p>}
      {error && <p className="error">{error}</p>}
      {statusMessage && <p className="status">{statusMessage}</p>}

      {!isLoadingApp && (
        <div className="field-list">
          {visibleFields.map((field) => (
            <DynamicField
              key={field.key}
              field={field}
              stepName={stepName}
              stepData={stepData}
              onChange={updateStepValue}
            />
          ))}
          {visibleFields.length === 0 && <p>No fields for this step.</p>}
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSaving || currentStepIndex === 0}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isSaving || currentStepIndex === STEPS.length - 1}
        >
          {isSaving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  );
}
