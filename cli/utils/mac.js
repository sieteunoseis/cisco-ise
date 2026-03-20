function normalizeMac(mac) {
  const stripped = mac.replace(/[:\-\.]/g, "").toUpperCase();
  if (stripped.length !== 12 || !/^[0-9A-F]{12}$/.test(stripped)) {
    throw new Error(`Invalid MAC address: ${mac}`);
  }
  return stripped.match(/.{2}/g).join(":");
}

function isValidMac(mac) {
  try {
    normalizeMac(mac);
    return true;
  } catch {
    return false;
  }
}

module.exports = { normalizeMac, isValidMac };
