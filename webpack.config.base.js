const path = require("path");

module.exports = {
  entry: "./src/js/app.js",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "app.bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      "@svgdotjs/svg.js": path.resolve("./node_modules/@svgdotjs/svg.js")
    }
  }
};
