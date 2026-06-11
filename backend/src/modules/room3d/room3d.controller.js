const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const room3dService = require('./room3d.service');

const getAccessStatus = asyncHandler(async (req, res) => {
  const data = await room3dService.getAccessStatus(req.user.id);

  sendSuccess(res, {
    message: '3D access status fetched successfully',
    data,
  });
});

const createAccessOrder = asyncHandler(async (req, res) => {
  const data = await room3dService.createAccessOrder(req.user.id, req.body?.forceNew === true);

  sendSuccess(res, {
    statusCode: 201,
    message: '3D access order created successfully',
    data,
  });
});

const getAdminRoom3D = asyncHandler(async (_req, res) => {
  const data = await room3dService.getAdminRoom3D();

  sendSuccess(res, {
    message: '3D settings fetched successfully',
    data,
  });
});

const updateAdminRoom3D = asyncHandler(async (req, res) => {
  const data = await room3dService.updateAdminRoom3D(req.validated.body);

  sendSuccess(res, {
    message: '3D settings updated successfully',
    data,
  });
});

const cancelAccessOrder = asyncHandler(async (req, res) => {
  await room3dService.cancelAccessOrder(req.user.id);

  sendSuccess(res, {
    message: '3D access order cancelled',
    data: { cancelled: true },
  });
});

module.exports = {
  cancelAccessOrder,
  createAccessOrder,
  getAccessStatus,
  getAdminRoom3D,
  updateAdminRoom3D,
};
