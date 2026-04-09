/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores HSFA - Hospital São Francisco de Assis (do sistema PHP original)
        hsfa: {
          primary: '#01717B',        // Verde-azulado institucional
          'primary-dark': '#015A61',  // Versão escura
          'primary-light': '#0199A5', // Versão clara
          'primary-hover': '#015c64', // Hover
          secondary: '#2E3A55',       // Azul-escuro
          'secondary-dark': '#1E293B', // Versão escura
          'secondary-light': '#475569', // Versão clara
          'secondary-hover': '#252f42', // Hover
          text: '#060606',            // Texto principal
          'text-light': '#FFFFFF',    // Texto claro
          'text-soft': '#374151',     // Texto suave
          'text-muted': '#6B7280',    // Texto muted
          soft: '#CBE9E7',            // Realce suave
          'soft-hover': '#b8e0dd',    // Hover do realce
          muted: '#828282',           // Cinza médio
          bg: '#FFFFFF',              // Fundo branco
          'bg-secondary': '#F9FAFB',  // Fundo secundário
          'bg-soft': '#F3F4F6',       // Fundo suave
          success: '#059669',         // Sucesso
          'success-light': '#D1FAE5', // Fundo sucesso
          warning: '#D97706',         // Aviso
          'warning-light': '#FEF3C7', // Fundo aviso
          error: '#DC2626',           // Erro
          'error-light': '#FEE2E2',   // Fundo erro
          info: '#0891B2',            // Info
          'info-light': '#CFFAFE',    // Fundo info
        },
        // Mantendo primary para compatibilidade (usando cores HSFA)
        primary: {
          50: '#CFFAFE',
          100: '#CBE9E7',
          200: '#A5D4D1',
          300: '#7FB9B5',
          400: '#599E99',
          500: '#01717B',
          600: '#015A61',
          700: '#004348',
          800: '#002C2F',
          900: '#001516',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'hsfa': '0 2px 8px rgba(0, 102, 204, 0.1)',
        'hsfa-lg': '0 4px 16px rgba(0, 102, 204, 0.15)',
      },
    },
  },
  plugins: [],
}

