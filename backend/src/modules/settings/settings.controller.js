const config = require('../../config/env');
const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const settingsService = require('./settings.service');

const getTransferProvider = asyncHandler(async (_req, res) => {
  const provider = await settingsService.getTransferProvider();

  sendSuccess(res, {
    message: 'Transfer provider fetched successfully',
    data: { provider },
  });
});

const getAdminSettings = asyncHandler(async (_req, res) => {
  const data = await settingsService.getAllSettings();

  sendSuccess(res, {
    message: 'Settings fetched successfully',
    data,
  });
});

const updateAdminSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.validated.body);

  // Sync in-memory config so running server picks up changes
  await config.syncFromDb();

  sendSuccess(res, {
    message: 'Settings updated successfully',
    data,
  });
});

module.exports = {
  getAdminSettings,
  getTransferProvider,
  updateAdminSettings,
};
