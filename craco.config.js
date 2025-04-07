// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.output.module = false;
      webpackConfig.output.chunkFormat = 'commonjs';
      return webpackConfig;
    },
  },
};