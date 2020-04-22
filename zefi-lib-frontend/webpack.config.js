const path = require('path');

module.exports = {
  mode: "production",
  entry: "./index.js", 
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  node: {
    Buffer: true
  },
  target: "web",
  devServer: {
    contentBase: path.join(__dirname, 'public')
  }
};
