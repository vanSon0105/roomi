const { z } = require('zod');

const updateSettingsSchema = z.object({
  body: z.object({
    transfer_provider: z.enum(['SEPAY', 'PAYOS', 'BANK_TRANSFER']).optional(),
    payos_client_id: z.string().optional(),
    payos_api_key: z.string().optional(),
    payos_checksum_key: z.string().optional(),
    sepay_account_no: z.string().optional(),
    sepay_account_name: z.string().optional(),
    sepay_qr_bank_name: z.string().optional(),
  }),
});

module.exports = {
  updateSettingsSchema,
};
