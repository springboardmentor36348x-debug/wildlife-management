// Mirrors backend/permissions.py — Part 2 RBAC.
// This is UI convenience only (hides buttons the user can't use).
// The backend is the real enforcement point — see backend/permissions.py.

const SITE_INFRA_ROLES = ["Wildlife Researcher", "Forest Department Officer", "Administrator"];
const OBSERVATION_ROLES = ["Wildlife Researcher", "Conservation Officer", "Forest Department Officer", "Administrator"];

export function canManageSiteInfra(role) {
  return SITE_INFRA_ROLES.includes(role);
}

export function canManageObservations(role) {
  return OBSERVATION_ROLES.includes(role);
}

export function canDelete(role) {
  return role === "Administrator";
}
