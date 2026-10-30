import mongoose from 'mongoose'

export async function connectDB(uri) {
  if (!uri) {
    console.warn('MONGODB_URI is not configured; database-backed APIs will be unavailable.')
    return false
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    console.info('MongoDB connected.')
    return true
  } catch {
    console.error('MongoDB connection failed. Check MONGODB_URI and database availability.')
    return false
  }
}
