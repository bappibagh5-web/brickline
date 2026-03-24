import { funnelConfig } from './config.js';

export const routeToStepId = Object.entries(funnelConfig).reduce((acc, [stepId, step]) => {
  acc[step.route] = stepId;
  return acc;
}, {});

export function getStepByRoute(pathname) {
  const stepId = routeToStepId[pathname];
  if (!stepId) return null;
  return { stepId, step: funnelConfig[stepId] };
}

export function getNextStepId(stepId, selectedValue, answers = {}, context = {}) {
  const step = funnelConfig[stepId];
  if (!step) return null;

  const { next } = step;
  if (!next) return null;

  if (typeof next === 'function') {
    return next({
      value: selectedValue,
      answers,
      ...context
    }) || null;
  }

  if (typeof next === 'string') return next;
  if (typeof next === 'object') return next[selectedValue] || null;
  return null;
}

export function getNextRoute(stepId, selectedValue, answers = {}, context = {}) {
  const nextStepId = getNextStepId(stepId, selectedValue, answers, context);
  if (!nextStepId) return null;
  return funnelConfig[nextStepId]?.route || null;
}

const stepKeyToStepId = Object.entries(funnelConfig).reduce((acc, [stepId, step]) => {
  if (step.key && !acc[step.key]) {
    acc[step.key] = stepId;
  }
  return acc;
}, {});

export function getResumeTargetRoute(lastStep, data, context = {}) {
  if (!lastStep) {
    return funnelConfig.loanProgram.route;
  }

  const stepId = funnelConfig[lastStep]
    ? lastStep
    : stepKeyToStepId[lastStep];

  if (!stepId || !funnelConfig[stepId]) {
    return funnelConfig.loanProgram.route;
  }

  const currentStep = funnelConfig[stepId];
  const selectedValue = currentStep.key ? data?.[currentStep.key] : null;
  const nextRoute = getNextRoute(stepId, selectedValue, data, context);

  return nextRoute || currentStep.route;
}
