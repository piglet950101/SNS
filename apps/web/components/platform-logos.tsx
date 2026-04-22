// Inline logo marks — monochrome placeholders; swap with real SVGs later.
export const XLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path
      fill="currentColor"
      d="M17.5 3h3.1l-6.77 7.74L22 21h-5.93l-4.64-6.07L5.9 21H2.79l7.23-8.26L2 3h6.06l4.2 5.55L17.5 3Zm-1.09 16h1.71L7.69 4.9H5.86L16.41 19Z"
    />
  </svg>
)

export const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path
      fill="#4285F4"
      d="M22 12.2c0-.8-.1-1.6-.2-2.4H12v4.5h5.6c-.2 1.3-1 2.4-2.1 3.2v2.6h3.4c2-1.8 3.1-4.5 3.1-7.9Z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H2.8v2.6C4.6 19.8 8 22 12 22Z"
    />
    <path fill="#FBBC04" d="M6.3 13.7a6 6 0 0 1 0-3.8V7.3H2.8a10 10 0 0 0 0 9.3l3.5-2.9Z" />
    <path
      fill="#EA4335"
      d="M12 5.8c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 12 2C8 2 4.6 4.2 2.8 7.3l3.5 2.9C7.1 7.7 9.3 5.8 12 5.8Z"
    />
  </svg>
)

export const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <defs>
      <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F58529" />
        <stop offset=".5" stopColor="#DD2A7B" />
        <stop offset="1" stopColor="#8134AF" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igGrad)" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" />
  </svg>
)

export const WordPressLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#21759B" />
    <path
      fill="#FFF"
      d="M7.1 12a4.9 4.9 0 0 1 2.8-4.4l1.7 4.6-1.7 4.7A4.9 4.9 0 0 1 7.1 12Zm4.9 4.9 1.4-4 1.3 4a5 5 0 0 1-2.7 0Zm4-9.4a5 5 0 0 1 2.9 4.5 5 5 0 0 1-.7 2.5l-1.5-4.3c-.3-.8-.4-1.2-.4-1.6 0-.4.3-.7.7-.7h-1Z"
    />
  </svg>
)
