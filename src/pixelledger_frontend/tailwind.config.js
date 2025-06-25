/** @type {import('tailwindcss').Config} */
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
    			orbitron: [
    				'Orbitron',
    				'monospace'
    			],
    			inter: [
    				'Inter',
    				'sans-serif'
    			]
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
    			cyber: {
    				black: '#0a0a0a',
    				dark: '#111111',
    				gray: '#1a1a1a',
    				teal: '#4CD4B0',
    				pink: '#FF6E7F',
    				purple: '#8B5CF6',
    				blue: '#0EA5E9'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		backgroundImage: {
    			'cyber-gradient': 'linear-gradient(135deg, #4CD4B0 0%, #FF6E7F 100%)',
    			'cyber-gradient-vertical': 'linear-gradient(180deg, #4CD4B0 0%, #FF6E7F 100%)',
    			'neural-grid': 'radial-gradient(circle at 25px 25px, rgba(76, 212, 176, 0.2) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 110, 127, 0.2) 2px, transparent 0)'
    		},
    		boxShadow: {
    			neuro: '8px 8px 16px #050505, -8px -8px 16px #1a1a1a',
    			'neuro-inset': 'inset 8px 8px 16px #050505, inset -8px -8px 16px #1a1a1a',
    			'cyber-glow': '0 0 20px rgba(76, 212, 176, 0.5)',
    			'cyber-glow-pink': '0 0 20px rgba(255, 110, 127, 0.5)'
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
    			float: {
    				'0%, 100%': {
    					transform: 'translateY(0px)'
    				},
    				'50%': {
    					transform: 'translateY(-20px)'
    				}
    			},
    			'pulse-glow': {
    				'0%, 100%': {
    					boxShadow: '0 0 20px rgba(76, 212, 176, 0.5)'
    				},
    				'50%': {
    					boxShadow: '0 0 40px rgba(76, 212, 176, 0.8), 0 0 60px rgba(76, 212, 176, 0.3)'
    				}
    			},
    			'gradient-shift': {
    				'0%': {
    					backgroundPosition: '0% 50%'
    				},
    				'50%': {
    					backgroundPosition: '100% 50%'
    				},
    				'100%': {
    					backgroundPosition: '0% 50%'
    				}
    			},
    			'rotate-3d': {
    				'0%': {
    					transform: 'rotateY(0deg) rotateX(0deg)'
    				},
    				'100%': {
    					transform: 'rotateY(360deg) rotateX(360deg)'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			float: 'float 6s ease-in-out infinite',
    			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
    			'gradient-shift': 'gradient-shift 3s ease infinite',
    			'rotate-3d': 'rotate-3d 20s linear infinite'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
}
