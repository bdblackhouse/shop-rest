export const CouponIcon = ({ ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-6 h-6"
      // {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 7.5h15m-15 0v9a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-9m-15 0a1.5 1.5 0 01-1.5-1.5v-.75A1.5 1.5 0 014.5 4.5h15a1.5 1.5 0 011.5 1.5v.75a1.5 1.5 0 01-1.5 1.5m-15 0h15"
      />
      <circle cx="7.5" cy="12" r="1.5" />
      <circle cx="16.5" cy="12" r="1.5" />
    </svg>
  );
};
