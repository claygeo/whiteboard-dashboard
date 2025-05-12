module.exports = {
  webpack: {
    configure: {},
  },
  style: {
    postcss: {
      plugins: [require('autoprefixer')],
    },
  },
};