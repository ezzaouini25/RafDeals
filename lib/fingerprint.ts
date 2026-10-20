// lib/fingerprint.ts

/**
 * Generates a device fingerprint based on browser and device information
 * This is used for spam detection and rate limiting
 */
export function generateDeviceFingerprint(): string {
  try {
    const components = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width || 0,
      screen.height || 0,
      screen.colorDepth || 0,
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
      navigator.platform || '',
      new Date().getTimezoneOffset() || 0
    ];

    const fingerprint = components.join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    // Fallback to random if fingerprint generation fails
    return Math.random().toString(36).substring(2, 15);
  }
}