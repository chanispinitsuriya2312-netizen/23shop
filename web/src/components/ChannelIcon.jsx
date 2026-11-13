export default function ChannelIcon({ name, size = 19 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'line':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.9 3 3 6.4 3 10.7c0 3.4 2.3 6.2 5.6 7.5-.1.6-.4 1.9-.5 2.2-.1.4.2.4.4.3.3-.1 3.5-2.3 4.4-2.9.4.1.7.1 1.1.1 5.1 0 9-3.4 9-7.2S17.1 3 12 3z" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4.5 7 7.5 5.5L19.5 7" />
        </svg>
      )
    case 'facebook':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 21v-7h2.4l.36-2.8H13.5V9.4c0-.8.22-1.35 1.37-1.35h1.46V5.55c-.25-.03-1.12-.1-2.13-.1-2.1 0-3.55 1.28-3.55 3.63v2.12H8.2V14h2.45v7z" />
        </svg>
      )
    case 'messenger':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.9 3 3 6.5 3 10.9c0 2.5 1.3 4.7 3.4 6.1v3.2l3.1-1.7c.8.2 1.6.3 2.5.3 5.1 0 9-3.5 9-7.9S17.1 3 12 3zm.9 10.6-2.3-2.4-4.4 2.4 4.8-5.1 2.3 2.4 4.3-2.4-4.7 5.1z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.7" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 3c.4 2.3 1.9 3.9 4.2 4.1v2.9c-1.6 0-3-.5-4.2-1.4v6.6c0 3.6-2.6 6-6 6-3.1 0-5.6-2.3-5.6-5.5 0-3.4 2.9-5.8 6.4-5.4v3c-.3-.1-.6-.1-.9-.1-1.5 0-2.7 1.1-2.7 2.6 0 1.6 1.2 2.6 2.7 2.6 1.7 0 2.8-1.2 2.8-3.2V3z" />
        </svg>
      )
    case 'bag':
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8z" />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5z" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="m21 3-9.5 18-2.3-7.2L3 11.5 21 3z" />
          <path d="M21 3 9.2 13.8" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zm0 16.2c-1.4 0-2.7-.4-3.8-1l-.3-.2-2.7.7.7-2.6-.2-.3a7.2 7.2 0 1 1 6.3 3.4zm4-5.4c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.1-.3.2-.5.1a5.9 5.9 0 0 1-2.9-2.5c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3.2-.5v-.3l-.7-1.6c-.1-.2-.2-.2-.4-.2h-.5c-.2 0-.5.1-.7.3-.2.3-.8.8-.8 2 0 1.2.9 2.4 1 2.5.1.2 1.7 2.6 4.1 3.6.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
        </svg>
      )
    case 'copy':
      return (
        <svg {...common}>
          <rect x="9" y="9" width="11" height="11" rx="2.5" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M12 21s-6.5-6.1-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21z" />
          <circle cx="12" cy="10.4" r="2.4" />
        </svg>
      )
  }
}
