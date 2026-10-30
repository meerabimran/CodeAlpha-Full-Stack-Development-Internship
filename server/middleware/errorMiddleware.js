export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'The requested endpoint was not found.' })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(({ message }) => message)
    return res.status(400).json({ success: false, message: messages[0] || 'Invalid request data.' })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'The request contains an invalid identifier or value.' })
  }

  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
  }

  if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError' ||
      error.name === 'MongooseServerSelectionError' || error.name === 'MongoNotConnectedError') {
    return res.status(503).json({ success: false, message: 'The database is temporarily unavailable.' })
  }

  if (error.status === 413) {
    return res.status(413).json({ success: false, message: 'The request body is too large.' })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'The request body contains invalid JSON.' })
  }

  console.error('Unhandled request error:', error.name || 'Error')
  return res.status(500).json({ success: false, message: 'An unexpected server error occurred.' })
}
