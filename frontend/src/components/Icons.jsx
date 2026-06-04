const S = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);

export const IcHome = (p) => (<S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></S>);
export const IcBag = (p) => (<S {...p}><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></S>);
export const IcCart = (p) => (<S {...p}><path d="M3 4h2l2.2 11.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 7H6" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></S>);
export const IcReceipt = (p) => (<S {...p}><path d="M5 3v18l2-1.2L9 21l2-1.2L13 21l2-1.2L17 21l2-1.2V3l-2 1.2L15 3l-2 1.2L11 3 9 4.2 7 3 5 4.2z" /><path d="M8 8h8M8 12h8M8 16h5" /></S>);
export const IcStore = (p) => (<S {...p}><path d="M4 9h16l-1-5H5L4 9z" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></S>);
export const IcLogout = (p) => (<S {...p}><path d="M15 4h4v16h-4" /><path d="M10 12h9M14 8l-4 4 4 4" /></S>);
export const IcPlus = (p) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const IcTrash = (p) => (<S {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></S>);
export const IcEdit = (p) => (<S {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></S>);
export const IcAlert = (p) => (<S {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></S>);
export const IcDownload = (p) => (<S {...p}><path d="M12 3v12M8 11l4 4 4-4" /><path d="M5 21h14" /></S>);
export const IcChevron = (p) => (<S {...p}><path d="M15 6l-6 6 6 6" /></S>);
export const IcSun = (p) => (<S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></S>);
export const IcMoon = (p) => (<S {...p}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" /></S>);
export const IcSearch = (p) => (<S {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></S>);
export const IcUsers = (p) => (<S {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 5.2A3 3 0 0 1 16 11M21 20c0-2.6-1.5-4.2-3.8-4.8" /></S>);
export const IcCheck = (p) => (<S {...p}><path d="M5 12l4.5 4.5L19 7" /></S>);
export const IcTruck = (p) => (<S {...p}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></S>);
export const IcCalendar = (p) => (<S {...p}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></S>);
