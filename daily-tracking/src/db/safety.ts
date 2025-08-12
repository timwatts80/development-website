// Database environment detection and safety checks
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// Get database URL with environment context
export const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  // Log environment for debugging (without exposing credentials)
  if (isDevelopment) {
    console.log('🔧 Development database connection')
  } else if (isProduction) {
    console.log('🚀 Production database connection')
  }
  
  return url
}

// Safety check for destructive operations
export const requireDevelopment = (operation: string) => {
  if (isProduction) {
    throw new Error(`Operation "${operation}" is not allowed in production`)
  }
}

// Database reset prevention
export const safeReset = () => {
  if (isProduction) {
    console.warn('🚨 Database reset blocked in production environment')
    return false
  }
  console.log('🔧 Database reset allowed in development')
  return true
}
