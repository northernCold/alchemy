import { request, download } from '@/utils';

// 获取视频详细信息(web端)
export function getVedioDetils(aid: string) {
  return request({
    url: "http://api.bilibili.com/x/web-interface/view",
    query: {
      aid
    }
  })
};

interface PlayUrlQuery {
  avid?: string,
  bvid?: string,
  cid: string
}
// 获取视频流URL
export function getVedioPlayUrl(data: PlayUrlQuery) {
  return request({
    url: "http://api.bilibili.com/x/player/playurl",
    query: {
      ...data
    }
  })
}

export function downloadVedio(url: string) {
  return download({
    url
  })
}

interface VedioPagination {
  mid: string,
  ps: number,
  pn: number,
  keyword: string,
  order: string
}

export function getVedioList(data: VedioPagination) {
  return request({
    url: "https://api.bilibili.com/x/space/arc/search",
    query: {
      ...data,
      tid: "0",
      jsonp: "jsonp"
    }
  })
}