const sendSuccess = (res, data = null, message = 'success', statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode = 500, message = 'Internal server error', extra = {}) => {
  return res.status(statusCode).json({ success: false, message, ...extra });
};

const sendPaginated = (res, data, total, page, limit) => {
  return res.json({
    success: true,
    data,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
