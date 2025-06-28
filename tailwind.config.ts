import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'indian': ['Rajdhani', 'sans-serif'],
				'aggressive': ['Orbitron', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Aggressive Indian-inspired color palette
				'warrior': {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
					950: '#052e16',
				},
				'emerald-aggressive': {
					50: '#ecfdf5',
					100: '#d1fae5',
					200: '#a7f3d0',
					300: '#6ee7b7',
					400: '#34d399',
					500: '#10b981',
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
					950: '#022c22',
				},
				'chakra': {
					50: '#f0fdf9',
					100: '#ccfbef',
					200: '#99f6e0',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
					950: '#042f2e',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(5, 150, 105, 0.5), 0 0 10px rgba(5, 150, 105, 0.3)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(5, 150, 105, 0.8), 0 0 30px rgba(5, 150, 105, 0.6)'
					}
				},
				'warrior-flash': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'mandala-spin': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'warrior-flash': 'warrior-flash 0.5s ease-in-out',
				'mandala-spin': 'mandala-spin 20s linear infinite'
			},
			backgroundImage: {
				'gradient-warrior': 'linear-gradient(135deg, #059669, #10b981, #34d399)',
				'gradient-chakra': 'linear-gradient(135deg, #0d9488, #14b8a6, #2dd4bf)',
				'gradient-peacock': 'linear-gradient(135deg, #059669 0%, #0d9488 25%, #10b981 50%, #14b8a6 75%, #34d399 100%)',
				'pattern-mandala': 'radial-gradient(circle at 50% 50%, rgba(5, 150, 105, 0.1) 0%, transparent 25%)',
			},
			boxShadow: {
				'glow-sm': '0 0 5px rgba(5, 150, 105, 0.5)',
				'glow': '0 0 10px rgba(5, 150, 105, 0.5), 0 0 20px rgba(5, 150, 105, 0.3)',
				'glow-lg': '0 0 15px rgba(5, 150, 105, 0.6), 0 0 30px rgba(5, 150, 105, 0.4)',
				'warrior': '0 5px 15px rgba(5, 150, 105, 0.4), 0 10px 30px rgba(5, 150, 105, 0.2)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
