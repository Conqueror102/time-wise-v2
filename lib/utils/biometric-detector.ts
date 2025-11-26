/**
 * Biometric Authenticator Detection Utility
 * Detects the type of biometric authentication available on the device
 */

export interface BiometricInfo {
  type: 'ios' | 'android' | 'windows' | 'mac' | 'generic'
  label: string
  shortLabel: string
  icon: 'face' | 'fingerprint' | 'shield' | 'scan'
  actionText: string
  registerText: string
}

export function detectBiometricType(): BiometricInfo {
  if (typeof window === 'undefined') {
    return getGenericBiometric()
  }

  const userAgent = navigator.userAgent
  const platform = navigator.platform

  // iOS devices (iPhone/iPad)
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return {
      type: 'ios',
      label: 'Face ID or Touch ID',
      shortLabel: 'Face ID / Touch ID',
      icon: 'scan',
      actionText: 'Use Face ID or Touch ID',
      registerText: 'Register Face ID or Touch ID',
    }
  }

  // Android devices
  if (/Android/.test(userAgent)) {
    return {
      type: 'android',
      label: 'Fingerprint or Face Unlock',
      shortLabel: 'Biometric',
      icon: 'fingerprint',
      actionText: 'Verify with Biometric',
      registerText: 'Register Biometric',
    }
  }

  // Windows devices
  if (/Windows/.test(userAgent) || /Win/.test(platform)) {
    return {
      type: 'windows',
      label: 'Windows Hello',
      shortLabel: 'Windows Hello',
      icon: 'shield',
      actionText: 'Use Windows Hello',
      registerText: 'Set Up Windows Hello',
    }
  }

  // Mac devices
  if (/Mac/.test(platform) || /Macintosh/.test(userAgent)) {
    return {
      type: 'mac',
      label: 'Touch ID',
      shortLabel: 'Touch ID',
      icon: 'fingerprint',
      actionText: 'Use Touch ID',
      registerText: 'Register Touch ID',
    }
  }

  // Generic fallback
  return getGenericBiometric()
}

function getGenericBiometric(): BiometricInfo {
  return {
    type: 'generic',
    label: 'Biometric Authentication',
    shortLabel: 'Biometric',
    icon: 'shield',
    actionText: 'Authenticate',
    registerText: 'Register Biometric',
  }
}

export function getBiometricIcon(type: BiometricInfo['icon']) {
  return type
}
