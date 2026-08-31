import React from "react";

const base = (size, children) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const HomeIcon = ({ size = 18 }) =>
  base(size, <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></>);

export const ClipboardIcon = ({ size = 18 }) =>
  base(size, <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M9 10h6M9 14h6M9 18h3" /></>);

export const PinIcon = ({ size = 18 }) =>
  base(size, <><path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" /></>);

export const CameraIcon = ({ size = 18 }) =>
  base(size, <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>);

export const MicIcon = ({ size = 18 }) =>
  base(size, <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3M8.5 21h7" /></>);

export const ButterflyIcon = ({ size = 18 }) =>
  base(size, <><path d="M12 5v14" /><path d="M12 8c-1-3-4-4.5-7-3.5-1 2 0 5 3 6.5-3 1.5-4 4.5-3 6.5 3 1 6-.5 7-3.5" /><path d="M12 8c1-3 4-4.5 7-3.5 1 2 0 5-3 6.5 3 1.5 4 4.5 3 6.5-3 1-6-.5-7-3.5" /></>);

export const DnaIcon = ({ size = 18 }) =>
  base(size, <><path d="M7 3c0 4 10 4 10 8s-10 4-10 8" /><path d="M17 3c0 4-10 4-10 8s10 4 10 8" /><path d="M8.5 7h7M8.5 17h7" /></>);

export const ImageIcon = ({ size = 18 }) =>
  base(size, <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16.5 16 11l-9 9" /></>);

export const HeadphonesIcon = ({ size = 18 }) =>
  base(size, <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="6" rx="1.3" /><rect x="17" y="14" width="4" height="6" rx="1.3" /></>);

export const ChartBarIcon = ({ size = 18 }) =>
  base(size, <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>);

export const TrendUpIcon = ({ size = 18 }) =>
  base(size, <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>);

export const SearchIcon = ({ size = 18 }) =>
  base(size, <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);

export const PopulationIcon = ({ size = 18 }) =>
  base(size, <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" /><path d="M14.5 20c0-2.5 1.7-4.5 4-4.9" /></>);

export const TreeIcon = ({ size = 18 }) =>
  base(size, <path d="M12 2 7 9h3l-4 6h4v6h4v-6h4l-4-6h3z" />);

export const GlobeIcon = ({ size = 18 }) =>
  base(size, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>);

export const ShieldIcon = ({ size = 18 }) =>
  base(size, <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />);

export const CalculatorIcon = ({ size = 18 }) =>
  base(size, <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>);

export const BrainIcon = ({ size = 18 }) =>
  base(size, <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.6A3.5 3.5 0 0 0 8 18h1V4Z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.6A3.5 3.5 0 0 1 16 18h-1V4Z" /></>);

export const BellIcon = ({ size = 18 }) =>
  base(size, <><path d="M6 10a6 6 0 1 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 14.5 6 10Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>);

export const FileTextIcon = ({ size = 18 }) =>
  base(size, <><path d="M6 2h9l3 3v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" /><path d="M9 12h6M9 16h6M9 8h3" /></>);

export const UserIcon = ({ size = 18 }) =>
  base(size, <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" /></>);

export const UsersIcon = ({ size = 18 }) =>
  base(size, <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 2.9-6.3 6.5-6.3s6.5 2.8 6.5 6.3" /><circle cx="17.5" cy="8.5" r="2.8" /><path d="M15.5 13.7c2.7.5 4.5 2.9 4.5 6.3" /></>);

export const ChevronDownIcon = ({ size = 18 }) =>
  base(size, <path d="m6 9 6 6 6-6" />);