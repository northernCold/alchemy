<template>
  <n-data-table
    remote
    :columns="columns"
    :data="data"
    :row-key="rowKey"
    :pagination="pagination"
    @update:page="handlePageChange"
    @update:page-size="handlePageSizeChange"
  />
</template>

<script lang="ts" setup>
import { h, reactive, ref } from 'vue'
import { NDataTable, NButton } from 'naive-ui'
import { ipcRenderer } from 'electron'
import moment from 'moment'

const pagination = reactive({
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 30, 50],
  page: 1
})

const playAudio = (rowData) => {
  ipcRenderer.send("play-audio", JSON.stringify(rowData))
}
const columns = ref([
  {
    title: '#',
    align: "center",
    width: 60,
    render: (rowData: any, rowIndex: number) => {
      return rowIndex + 1;
    }
  },
  {
    type: "expand",
    renderExpand: (rowData) => {
      return rowData.description;
    }
  },
  {
    title: "标题",
    key: "title",
  },
  {
    title: "时长",
    key: "length"
  },
  {
    title: "播放量",
    key: "play",
    render: (rowData: any) => {
      return rowData.play.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  },
  {
    title: "评论量",
    key: "comment",
    render: (rowData: any) => {
      return rowData.comment.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  },
  {
    title: "上传时间",
    key: "created"
  },
  {
    title: 'Action',
    key: 'actions',
    render (row) {
      return h(
        NButton,
        {
          size: 'small',
          onClick: () => playAudio(row)
        },
        { default: () => '播放音频' }
      )
    }
  }
])
let data = ref([]);
const fetchData = () => {
  ipcRenderer.send("fetch-vedio-list", JSON.stringify(pagination))
  ipcRenderer.on("receiveMessage", (event, args) => {
    const { list, page } = JSON.parse(args).data;
    data.value = list.vlist.map(v => {
      v.created = moment.unix(v.created).format('YYYY/MM/DD HH:mm:ss')
      return v;      
    });

    console.log(data.value)
    pagination.pageSize = page.ps;
    pagination.page = page.pn;
    pagination.itemCount = page.count;
  })
}
fetchData();
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
}

const rowKey = rowData => rowData.bvid;
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
}

</script>