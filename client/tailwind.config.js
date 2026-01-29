/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1',    // Indigo 500
                    dark: '#4338ca',       // Indigo 700
                    light: '#818cf8',      // Indigo 400
                },
                secondary: {
                    DEFAULT: '#0ea5e9',    // Sky 500
                    dark: '#0284c7',       // Sky 600
                    light: '#38bdf8',      // Sky 400
                },
                accent: {
                    DEFAULT: '#fb7185',    // Rose 400
                    dark: '#e11d48',       // Rose 600
                },
                light: {
                    bg: '#f8fafc',         // Slate 50
                    card: '#ffffff',       // White
                    text: '#0f172a',       // Slate 900 (Darker)
                    subtext: '#334155',    // Slate 700 (Darker)
                    input: '#f1f5f9',      // Slate 100
                    border: '#e2e8f0',     // Slate 200
                },
                // Keep 'dark' for compatibility but map to light values or specific dark accents if needed
                dark: {
                    bg: '#f8fafc',
                    card: '#ffffff',
                    input: '#f1f5f9',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Poppins', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 15px rgba(99, 102, 241, 0.3)',
            },
            backgroundImage: {
                'gradient-main': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                'gradient-card': 'linear-gradient(to bottom right, #ffffff, #fcfcfc)',
                'mesh': 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)' // keeping abstract
            }
        },
    },
    plugins: [],
}
