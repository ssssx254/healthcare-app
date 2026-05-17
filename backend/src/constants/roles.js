const ROLES = Object.freeze({
  CUSTOMER: "customer",
  PROVIDER: "provider",
  SYSTEM_ADMIN: "system_admin",
});

const ALL_ROLES = Object.freeze([ROLES.CUSTOMER, ROLES.PROVIDER, ROLES.SYSTEM_ADMIN]);

function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

module.exports = {
  ROLES,
  ALL_ROLES,
  isValidRole,
};

