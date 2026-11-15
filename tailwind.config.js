/** @type {import('tailwindcss').Config} */
const blush = (n) => `rgb(var(--blush-${n}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-heading)', 'Georgia', 'serif'],
        script: ['"Dancing Script"', 'cursive'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        blush: {
          50: blush(50),
          100: blush(100),
          200: blush(200),
          300: blush(300),
          400: blush(400),
          500: blush(500),
          600: blush(600),
          700: '#b86b8a',
          800: '#8e4d6a',
          900: '#6b3a52',
        },
        cream: { 50: '#fffaf5', 100: '#fbf1e6', 200: '#f3e3d0', 300: '#e8d5be' },
        lilac: { 100: '#efe7fb', 200: '#ddcdf5', 300: '#c3a9ec' },
        night: { 800: '#1d1826', 900: '#14101c', 950: '#0e0b14' },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgb(var(--blush-600) / 0.25)',
        dreamy: '0 20px 60px -20px rgba(150, 110, 200, 0.35)',
        float: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        glow: '0 0 30px rgb(var(--blush-400) / 0.3), 0 0 60px rgb(var(--blush-300) / 0.15)',
      },
      keyframes: {
        floaty: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-110vh) rotate(25deg)', opacity: '0' },
        },
        shimmer: { '0%,100%': { opacity: '0.4' }, '50%': { opacity: '1' } },
        petalfall: {
          '0%': { transform: 'translate3d(0,-8vh,0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.85' },
          '50%': { transform: 'translate3d(7vw,55vh,0) rotate(180deg)' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translate3d(-3vw,112vh,0) rotate(360deg)', opacity: '0' },
        },
        flutter: {
          '0%': { transform: 'translate3d(0,0,0) rotate(-6deg)', opacity: '0' },
          '10%': { opacity: '0.9' },
          '25%': { transform: 'translate3d(6vw,-28vh,0) rotate(8deg)' },
          '50%': { transform: 'translate3d(-5vw,-55vh,0) rotate(-8deg)' },
          '75%': { transform: 'translate3d(6vw,-82vh,0) rotate(6deg)' },
          '90%': { opacity: '0.9' },
          '100%': { transform: 'translate3d(0,-112vh,0) rotate(0deg)', opacity: '0' },
        },
        wing: { '0%,100%': { transform: 'scaleX(1)' }, '50%': { transform: 'scaleX(0.35)' } },
        pixelrise: {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '10%': { opacity: '0.9' },
          '90%': { opacity: '0.9' },
          '100%': { transform: 'translateY(-112vh)', opacity: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        marqueeReverse: {
          from: { transform: 'translateX(-50%)' },
          to: { transform: 'translateX(0)' },
        },
        digitFlip: {
          '0%': { transform: 'perspective(400px) rotateX(90deg)', opacity: '0' },
          '100%': { transform: 'perspective(400px) rotateX(0deg)', opacity: '1' },
        },
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(1)' },
        },
      },
      animation: {
        floaty: 'floaty linear infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
        petalfall: 'petalfall linear infinite',
        flutter: 'flutter ease-in-out infinite',
        wing: 'wing 0.45s ease-in-out infinite',
        pixelrise: 'pixelrise steps(40) infinite',
        marquee: 'marquee 30s linear infinite',
        marqueeReverse: 'marqueeReverse 25s linear infinite',
        digitFlip: 'digitFlip 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        floatSoft: 'floatSoft 4s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        heartbeat: 'heartbeat 2.5s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
