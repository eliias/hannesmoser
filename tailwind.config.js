/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './_includes/**/*.html',
    './_layouts/**/*.html',
    './_posts/*.md',
    './_journey/*.md',
    './*.md',
    './*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: [
          "Open Sans"
        ],
        sans: [
          "Open Sans",
        ],
        serif: [
          "Linux Libertine"
        ]
      }
    },
    container: {
      center: true,
      padding: '2rem',

      screens: {
        sm: '600px',
        md: '728px',
        lg: '728px',
        xl: '728px',
        '2xl': '728px',
      },
    }
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
};
