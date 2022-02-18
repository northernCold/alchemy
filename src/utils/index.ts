import { net } from 'electron';

type RequestQuery = Record<string, string | number | boolean>

const resolveUrlWidthQuery = (url: string, query: RequestQuery = {}) => {
  const hadQuery = /\?/.test(url);
  let append = Object.keys(query).reduce((prev: string, next: string) => {
    return `${prev}&${next}=${query[next]}`;
  }, "")
  if (!hadQuery) {
    append = `?${append.slice(1)}`
  }
  return url + append;
}

interface RequestOptions {
  url: string,
  query?: RequestQuery,
  method?: 'GET',
}

export const download = function (options: RequestOptions) {
  return new Promise((resolve, rejct) => {
    const url = resolveUrlWidthQuery(options.url, options.query);
    const req = net.request(url);
    req.setHeader("referer", "https://www.bilibili.com")
    req.setHeader('user-agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36");
    req.on('response', (response) => {
      const result: Array<Buffer> = [];
      response.on('data', (chunk) => {
        result.push(chunk)
      })
      response.on('end', () => {
        resolve(Buffer.concat(result));
      })
    })
    req.end()
  })
}

export const request = function (options: RequestOptions) {
  return new Promise((resolve, rejct) => {
    const url = resolveUrlWidthQuery(options.url, options.query);
    const req = net.request(url);
    req.setHeader("referer", "https://www.bilibili.com")
    req.setHeader('user-agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36");
    req.on('response', (response) => {
      let result: string = "";
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