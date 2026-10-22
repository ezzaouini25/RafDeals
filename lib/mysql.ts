import fs from 'fs';
import path from 'path';
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
      database: config.database ? '✅' : '❌',
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
 * Builds the SSL options for the MySQL pool.
 *
 * Aiven requires TLS with a verified CA certificate. Download the CA cert
 * from the Aiven console (Service → Overview → CA Certificate) and save it
 * to ./certs/aiven-ca.pem in your project root.
 *
 * If the file is missing, we fall back to the legacy behaviour
 * (rejectUnauthorized: false) so dev environments without the cert still
 * work — but Aiven will reject that connection at runtime.
 */
function buildSslOptions():
  | { rejectUnauthorized: boolean; ca?: Buffer }
  | undefined {
  if (process.env.DB_SSL !== 'true') return undefined;

  const caPath = path.join(process.cwd(), 'certs', 'aiven-ca.pem');

  try {
    const ca = fs.readFileSync(caPath);
    console.log('🔐 Loaded Aiven CA certificate from', caPath);
    return { ca, rejectUnauthorized: true };
  } catch {
    console.warn(
      '⚠️  certs/aiven-ca.pem not found — falling back to rejectUnauthorized: false. ' +
        'Aiven will likely refuse this connection. Download the CA cert from the Aiven console.'
    );
    return { rejectUnauthorized: false };
  }
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
    const ssl = buildSslOptions();

    // Debug log to see what's being used (remove in production)
    console.log('🔌 Connecting to MySQL with:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      password: config.password ? '✅ SET' : '❌ EMPTY',
      ssl: ssl ? (ssl.ca ? '✅ VERIFY_CA' : '⚠️ NO CA') : '❌ OFF',
    });

    try {
      pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 10000,
      });

      console.log('✅ MySQL connection pool initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize MySQL connection pool:', error);
      throw error;
    }
  }

  return pool;
}