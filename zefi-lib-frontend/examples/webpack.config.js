const path = require('path');

module.exports = {
  mode: "development",
  entry: "./src/index.js", 
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "bundle.js",
  },
  target: "web",
  devServer: {
    contentBase: path.join(__dirname, 'public')
  }
};
