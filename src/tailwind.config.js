// Tokens de diseño exportados por Google Stitch (sin cambios).
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'surface-tint': '#306576', 'primary-container': '#0f4c5c', 'outline-variant': '#c0c8cb', 'on-tertiary': '#ffffff',
        'on-primary-fixed': '#001f28', 'on-secondary-container': '#006f66', 'surface-variant': '#dae2fd', background: '#faf8ff',
        'on-primary': '#ffffff', 'on-tertiary-fixed': '#2a1700', tertiary: '#452900', 'inverse-surface': '#283044',
        'on-error': '#ffffff', 'on-error-container': '#93000a', 'surface-container': '#eaedff', 'on-surface-variant': '#40484b',
        outline: '#70787c', 'error-container': '#ffdad6', 'on-primary-container': '#87bbce', 'surface-bright': '#faf8ff',
        'on-primary-fixed-variant': '#114d5d', 'on-secondary-fixed-variant': '#005049', 'inverse-on-surface': '#eef0ff',
        'tertiary-container': '#643d00', 'on-secondary': '#ffffff', 'secondary-container': '#86f2e4', surface: '#faf8ff',
        'tertiary-fixed-dim': '#ffb95f', 'on-background': '#131b2e', secondary: '#006a61', 'surface-container-low': '#f2f3ff',
        error: '#ba1a1a', 'surface-dim': '#d2d9f4', 'surface-container-lowest': '#ffffff', 'inverse-primary': '#9acee1',
        'on-tertiary-fixed-variant': '#653e00', 'primary-fixed-dim': '#9acee1', 'tertiary-fixed': '#ffddb8',
        'surface-container-highest': '#dae2fd', 'on-tertiary-container': '#f8a110', 'surface-container-high': '#e2e7ff',
        'secondary-fixed-dim': '#6bd8cb', primary: '#003441', 'on-secondary-fixed': '#00201d', 'on-surface': '#131b2e',
        'primary-fixed': '#b6ebfe', 'secondary-fixed': '#89f5e7',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      fontFamily: Object.fromEntries(
        ['headline-xl', 'headline-lg', 'headline-md', 'headline-sm', 'body-lg', 'body-md', 'body-sm', 'label-lg', 'label-md', 'label-sm', 'data-mono']
          .map((k) => [k, ['Inter', 'sans-serif']]),
      ),
      fontSize: {
        'headline-xl': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '600' }],
        'data-mono': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
    },
  },
};
