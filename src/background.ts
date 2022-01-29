'use strict'

import { app, protocol, BrowserWindow, ipcMain, net } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import nodeRequest from 'request'
import fs from 'fs';

const request = (url) => {
  return new Promise((resolve, reject) => {
    const req = net.request(url);
    req.setHeader("referer", "https://www.bilibili.com")
    req.on('response', (response) => {
      // console.log(`STATUS: ${response.statusCode}`)
      // console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
      let result = "";
      response.on('data', (chunk) => {
        result += chunk
      })
      response.on('end', () => {
        resolve(result);        
      })
    })
    req.end()
  })
}
const resolveUrlWidthQuery = (url: string, query: any) => {
  const hadQuery = /\?/.test(url);
  let append = Object.keys(query).reduce((prev: string, next: string) => {
    return `${prev}&${next}=${query[next]}`;
  }, "")
  if (!hadQuery) {
    append = `?${append.slice(1)}`
  }
  return url + append;
}
const isDevelopment = process.env.NODE_ENV !== 'production'
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  ipcMain.on('play-audio', (event, args) => {
    // http://api.bilibili.com/x/player/playurl?avid=379743801&cid=457942787
    const { aid, title } = JSON.parse(args);
    const url = resolveUrlWidthQuery(
      "http://api.bilibili.com/x/web-interface/view",
      { aid }
    )
    request(url)
      .then(res => {
        return {
          bvid: JSON.parse(res).data.bvid,
          cid: JSON.parse(res).data.cid,
        }
      })
      .then(data =>{
        console.log(data);
        return request(resolveUrlWidthQuery("http://api.bilibili.com/x/player/playurl", data))
      })
      .then(res => {
        const { durl: [ { url }] } = JSON.parse(res).data;
        return url
      })
      .then(url => {
        const req = net.request(url);
        req.setHeader("referer", "https://www.bilibili.com")
        req.setHeader(
          'user-agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
        )

        req.on('response', (response) => {
          let result = [];
          response.on('data', (chunk) => {
            result.push(chunk)
          })
          response.on('end', () => {
            fs.writeFileSync(`./${title}.flv`, Buffer.concat(result));
          })
        })
        req.end()
      })
  })
  ipcMain.on('fetch-vedio-list', (event, args) => {
    const { pageSize: ps, page: pn } = JSON.parse(args);
    const url = resolveUrlWidthQuery(
      "https://api.bilibili.com/x/space/arc/search", 
      {
        mid: "97077404",
        ps,
        pn,
        tid: "0",
        keyword: "",
        order: "pubdate",
        jsonp: "jsonp"
      }
    )
    const request = net.request(url);
    request.on('response', (response) => {
      // console.log(`STATUS: ${response.statusCode}`)
      // console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
      let result = "";
      response.on('data', (chunk) => {
        result += chunk
      })
      response.on('end', () => {
        console.log('No more data in response.')
        win.webContents.send('receiveMessage', result);
      })
    })
    request.end()
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }


}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // try {
    //   await installExtension(VUEJS3_DEVTOOLS)
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}