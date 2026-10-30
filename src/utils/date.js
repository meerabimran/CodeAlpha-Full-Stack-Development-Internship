export function getCurrentDate() {
  return new Date()
}

export function getTodayKey() {
  const date = getCurrentDate()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
