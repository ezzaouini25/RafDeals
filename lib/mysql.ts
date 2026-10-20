import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

/**
 * Retrieves the database configuration from secure environment variables.
 */
export function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'web_project_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

/**
 * Checks if the necessary database credentials are configured.
 */
export function isDbConfigured(): boolean {
  const config = getDbConfig();
  
  // Check if we have the minimum required config
  if (!config.host || !config.user || !config.database) {
    console.log('❌ Missing required DB config:', { 
      host: config.host ? '✅' : '❌', 
      user: config.user ? '✅' : '❌', 
      database: config.database ? '✅' : '❌' 
    });
    return false;
  }

  // Prevent connecting to mock placeholder values
  const isPlaceholder =
    config.host === 'your-database-host-or-ip' ||
    config.user === 'your_database_user' ||
    config.database === 'your_database_name' ||
    config.host.trim() === '' ||
    config.user.trim() === '' ||
    config.database.trim() === '';

  return !isPlaceholder;
}

/**
 * Lazily initializes and retrieves the MySQL connection pool.
 */
export function getMysqlPool(): mysql.Pool {
  if (!isDbConfigured()) {
    throw new Error(
      'MySQL Database is not configured. Please define DB_HOST, DB_USER, and DB_NAME in your environment.'
    );
  }

  if (!pool) {
    const config = getDbConfig();
    
    // Debug log to see what's being used (remove in production)
    console.log('🔌 Connecting to MySQL with:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      password: config.password ? '✅ SET' : '❌ EMPTY',
    });

    try {
      pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      
      console.log('✅ MySQL connection pool initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize MySQL connection pool:', error);
      throw error;
    }
  }

  return pool;
}