const { z } = require('zod');

const updateRoom3DSettingsSchema = z.object({
  body: z.object({
    price: z.coerce.number().min(0).max(999999999),
  }),
});

module.exports = {
  updateRoom3DSettingsSchema,
};
