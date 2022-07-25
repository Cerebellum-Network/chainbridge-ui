const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
// const InterpolateHtmlPlugin = require("interpolate-html-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  babel: {
    plugins: ["macros"],
  },
  webpack: {
    configure: (webpackConfig) => ({
      ...webpackConfig,
      optimization: {
        ...webpackConfig.optimization,
        minimizer: [
          (compiler) => {
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: false,
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
                // parallel: 2,
                // cache: true,
                sourceMap: true,
                // extractComments: false,
              },
            }).apply(compiler);
          },
        ],
      },
      module: {
        rules: [
          ...webpackConfig.module.rules,
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: "javascript/auto",
          },
          {
            test: /\.m?js/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      },
      resolve: {
        extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
        fallback: {
          crypto: require.resolve("crypto-browserify"),
          stream: require.resolve("stream-browserify"),
          assert: require.resolve("assert"),
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          os: require.resolve("os-browserify"),
          url: require.resolve("url"),
          path: require.resolve("path-browserify"),
          buffer: require.resolve("buffer"),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
        new MiniCssExtractPlugin(),
        // new InterpolateHtmlPlugin({ PUBLIC_URL: "static" }),
      ],
      // target: "node",
      devtool: "source-map",
      // ignoreWarnings: [/Failed to parse source map/],
      ignoreWarnings: [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes("node_modules") &&
            warning.details &&
            warning.details.includes("source-map-loader")
          );
        },
      ],
    }),
  },
};
