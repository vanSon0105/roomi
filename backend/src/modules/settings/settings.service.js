const settingsRepository = require('./settings.repository');

const TRANSFER_PROVIDER_KEY = 'transfer_provider';
const DEFAULT_TRANSFER_PROVIDER = 'SEPAY';

const SETTING_KEYS = [
  TRANSFER_PROVIDER_KEY,
  'payos_client_id',
  'payos_api_key',
  'payos_checksum_key',
  'sepay_account_no',
  'sepay_account_name',
  'sepay_qr_bank_name',
  'shipping_fee_enabled',
];

const getTransferProvider = async () => {
  const setting = await settingsRepository.findByKey(TRANSFER_PROVIDER_KEY);
  return setting?.value || DEFAULT_TRANSFER_PROVIDER;
};

const getSetting = async (key, defaultValue = '') => {
  const setting = await settingsRepository.findByKey(key);
  return setting?.value || defaultValue;
};

const getAllSettings = async () => {
  const settings = await settingsRepository.findAll();
  const map = {};

  for (const setting of settings) {
    map[setting.key] = setting.value;
  }

  return {
    transfer_provider: map.transfer_provider || DEFAULT_TRANSFER_PROVIDER,
    payos_client_id: map.payos_client_id || '',
    payos_api_key: map.payos_api_key || '',
    payos_checksum_key: map.payos_checksum_key || '',
    sepay_account_no: map.sepay_account_no || '',
    sepay_account_name: map.sepay_account_name || '',
    sepay_qr_bank_name: map.sepay_qr_bank_name || 'VietinBank',
    shipping_fee_enabled: map.shipping_fee_enabled !== 'false',
  };
};

const updateSettings = async (payload) => {
  const updates = [];

  for (const key of SETTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined) {
      const value = typeof payload[key] === 'string' ? payload[key].trim() : payload[key];
      updates.push(settingsRepository.upsert(key, value));
    }
  }

  await Promise.all(updates);

  return getAllSettings();
};

module.exports = {
  getAllSettings,
  getSetting,
  getTransferProvider,
  updateSettings,
};
