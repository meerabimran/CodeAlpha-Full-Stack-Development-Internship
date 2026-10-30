import { validationResult } from 'express-validator'

export function validateRequest(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array({ onlyFirstError: true })[0].msg,
      errors: errors.array({ onlyFirstError: true }).map(({ path, msg }) => ({ field: path, message: msg })),
    })
  }
  next()
}

export function parsePage(value, fallback = 1, max = 100000) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

export function parseLimit(value, fallback = 20, max = 100) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

export function pagination(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) }
}
