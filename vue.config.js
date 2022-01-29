module.exports = {
  configureWebpack: {
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
  },
  pluginOptions: {
    electronBuilder: {
        nodeIntegration: true
    }
  }
}