const applicationService = require('../services/applicationService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createApplication(req, res, next) {
  try {
    const { user_id: userId } = req.body || {};

    if (!userId) {
      throw createHttpError(400, 'user_id is required.');
    }

    const application = await applicationService.createApplication(userId);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
}

async function startApplication(req, res, next) {
  try {
    const application = await applicationService.startApplication();
    res.status(201).json({
      application_id: application.id,
      status: application.status
    });
  } catch (error) {
    next(error);
  }
}

async function getApplication(req, res, next) {
  try {
    const { id } = req.params;
    const application = await applicationService.getApplicationById(id);

    if (!application) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json({
      id: application.id,
      status: application.status,
      application_data: application.application_data || {}
    });
  } catch (error) {
    next(error);
  }
}

async function updateApplication(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const newData = body.new_data && typeof body.new_data === 'object'
      ? body.new_data
      : body;

    if (!newData || typeof newData !== 'object' || Array.isArray(newData)) {
      throw createHttpError(400, 'Request body must be a JSON object.');
    }

    if (Object.keys(newData).length === 0) {
      throw createHttpError(400, 'Update payload cannot be empty.');
    }

    const updatedApplication = await applicationService.mergeApplicationData(id, newData);

    if (!updatedApplication) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json(updatedApplication);
  } catch (error) {
    next(error);
  }
}

async function saveApplicationStep(req, res, next) {
  try {
    const { id } = req.params;
    const { step_key: stepKey, data } = req.body || {};

    if (!stepKey || typeof stepKey !== 'string') {
      throw createHttpError(400, 'step_key is required.');
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw createHttpError(400, 'data must be a JSON object.');
    }

    const result = await applicationService.saveApplicationStep(id, stepKey, data);

    if (!result || !result.application) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json({
      id: result.application.id,
      status: result.application.status,
      application_data: result.application.application_data || {},
      email_sent: result.email_sent || false
    });
  } catch (error) {
    next(error);
  }
}

async function attachUserToApplication(req, res, next) {
  try {
    const { id } = req.params;
    const { user_id: userId } = req.body || {};

    if (!userId || typeof userId !== 'string') {
      throw createHttpError(400, 'user_id is required.');
    }

    const updatedApplication = await applicationService.attachUserToApplication(id, userId);

    if (!updatedApplication) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json({
      id: updatedApplication.id,
      user_id: updatedApplication.user_id,
      status: updatedApplication.status
    });
  } catch (error) {
    next(error);
  }
}

async function createAccountForApplication(req, res, next) {
  try {
    const { id } = req.params;
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string') {
      throw createHttpError(400, 'email is required.');
    }

    if (!password || typeof password !== 'string') {
      throw createHttpError(400, 'password is required.');
    }

    const result = await applicationService.createAccountForApplication(id, email, password);

    if (!result) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json({
      id: result.application.id,
      user_id: result.user_id,
      email: result.email,
      status: result.application.status
    });
  } catch (error) {
    next(error);
  }
}

async function getApplicationResume(req, res, next) {
  try {
    const { id } = req.params;
    const resume = await applicationService.getApplicationResume(id);

    if (!resume) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json(resume);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createApplication,
  startApplication,
  getApplication,
  updateApplication,
  saveApplicationStep,
  attachUserToApplication,
  createAccountForApplication,
  getApplicationResume
};
