const path = require("path");

module.exports = {
  entry: "./src/js/app.js",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "widget.js"
  },
  module: {
    rules: [
      {
        test: /(\.js|\.ts)$/,
        loader: "babel-loader",
        exclude: [
          {
            and: [path.resolve(__dirname, "node_modules")],
            not: [path.resolve(__dirname, "node_modules/@userowl/svg.draw.js")]
          }
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: {
      "@svgdotjs/svg.js": path.resolve("./node_modules/@svgdotjs/svg.js")
    }
  }
};
