module.exports = {
  webpack: {
    configure: {
      // Ensure assets are copied correctly
    },
  },
  plugins: [
    {
      plugin: require('craco-plugin-copy'),
      options: {
        copy: [
          {
            from: 'public/assets',
            to: 'build/assets',
          },
        ],
      },
    },
  ],
};