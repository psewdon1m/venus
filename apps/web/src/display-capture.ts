/** API availability is a permission preflight, never a device/audio support claim. */
export function displayCaptureAvailability(input:{secure:boolean;hasApi:boolean}):'available'|'insecure'|'unsupported' {
  return !input.secure?'insecure':input.hasApi?'available':'unsupported';
}
export function displayCaptureFailure(error:unknown):'denied'|'unsupported'|'capture_blocked'|'error' {
  const name=error&&typeof error==='object'&&'name' in error?error.name:'';
  return name==='NotAllowedError'?'denied':name==='NotSupportedError'?'unsupported':name==='NotReadableError'||name==='NotFoundError'?'capture_blocked':'error';
}
