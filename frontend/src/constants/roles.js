// Keep this list in sync with PUBLIC_ROLES in backend/app/schemas/user.py.
// "administrator" is intentionally excluded — admins are promoted
// separately, not self-registered.
export const REGISTERABLE_ROLES = [
  { value: "wildlife_researcher", label: "Wildlife Researcher" },
  { value: "conservation_officer", label: "Conservation Officer" },
  { value: "forest_officer", label: "Forest Department Officer" },
];