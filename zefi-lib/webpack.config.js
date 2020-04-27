const path = require('path');

const serverConfig = {
  target: "node",
  mode: "production",
  entry: "./src/index.js", 
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "node.bundle.js",
    library: 'zefiLib',
    libraryTarget: 'commonjs2'
  }
};

const clientConfig = {
  target: "web",
  mode: "production",
  entry: "./src/index.js", 
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "web.bundle.js",
    library: 'zefiLib',
    libraryTarget: 'umd'
  },
  node: {
    Buffer: true
  },
};

module.exports = [serverConfig, clientConfig];
