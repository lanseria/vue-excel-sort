<template>
  <div class="home">
    <h1>欢迎使用Excel排序工具</h1>
    <div id="body">
      <div id="left">
        <div id="logo">
          <img
            :src="`${baseUrl}img/img/logo.png`"
            class="logo"
            alt="VueExcelSort Logo"
            width="128px"
            height="128px"
          />
        </div>
        <div id="drop" v-loading="loading">把Xls文件拖入此处</div>
        <input type="file" id="file" value />
        <label for="file">... 或点这选择一个文件</label>
        <h3>选择一个工作表:</h3>
        <div id="buttons"></div>
      </div>
      <div id="right">
        <div id="header">
          <h2>浏览器中在线查看Xls文件</h2>
          <el-select
            style="margin-right:10px;"
            v-model="sortValue"
            :disabled="disableExportBtn"
            placeholder="请选择需要排序的字段"
          >
            <el-option
              v-for="item in sortOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <el-button icon="el-icon-sort" :disabled="disableExportBtn" @click="sortData();">排序</el-button>
          <el-button
            type="primary"
            icon="el-icon-download"
            :disabled="disableExportBtn"
            @click="exportit();"
          >导出文件</el-button>
        </div>
        <div style="margin-top:10px" id="grid"></div>
        <div class="example">
          <h2>演示动画</h2>
          <img :src="`${baseUrl}img/img/example.png`" alt="project example" />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import canvasDatagrid from "canvas-datagrid";
import * as _ from "lodash";
import XLSX from "xlsx";
import {
  defineComponent,
  onMounted,
  ref,
  Ref,
  computed,
} from "@vue/composition-api";
import { DropSheet } from "@/utils/dropsheet";
export default defineComponent({
  setup(props, { root }) {
    const __data: Ref<any[]> = ref([]);
    let cdg: HTMLElement | null = null;
    const sortValue = ref("0");
    const filename = computed(() => root.$store.state.filename);
    const loading = ref(false);
    const disableExportBtn = ref(true);
    console.log();

    const exportit = () => {
      const ws = XLSX.utils.json_to_sheet(__data.value, { skipHeader: true });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Results");
      return XLSX.writeFile(wb, filename.value as any);
    };

    const renderGrid = (json: any[]) => {
      /* load data */
      if (cdg) {
        (cdg as any).data = json;
      }
      __data.value = json;
    };

    const sortData = () => {
      const processData = __data.value;
      const cols = _.remove(processData, (n, i) => {
        return i === 0;
      });
      const unused = _.remove(processData, (n: any) => {
        if (n[0]) {
          if (_.isString(n[0])) {
            // 如果是字符串而且空 则为无效数据 true
            return _.isEmpty((n[0] as string).trim());
          } else {
            return false;
          }
        } else {
          return true;
        }
      });
      const sorted = _.sortBy(processData, [
        data => {
          return data[Number(sortValue.value)];
        },
      ]);
      const newData = [...cols, ...sorted, ...unused];
      renderGrid(newData);
    };

    onMounted(() => {
      const _target = document.getElementById("drop");
      const _file = document.getElementById("file");
      const _grid = document.getElementById("grid");

      const _workstart = function() {
        loading.value = true;
      };
      const _workend = function() {
        loading.value = false;
      };

      /** Alerts **/
      const _badfile = function() {
        root.$notify({
          title: "警告",
          message:
            'This file does not appear to be a valid Excel file.  If we made a mistake, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can take a look.',
          type: "warning",
        });
      };

      const _pending = function() {
        root.$notify({
          title: "警告",
          message: "Please wait until the current file is processed.",
          type: "warning",
        });
      };

      const _large = function(len: number, cb: any) {
        root.$notify({
          title: "警告",
          message:
            "This file is " +
            len +
            " bytes and may take a few moments.  Your browser may lock up during this process.  Shall we play?",
          type: "warning",
        });
        cb();
      };

      const _failed = function() {
        root.$notify({
          title: "警告",
          message:
            'We unfortunately dropped the ball here.  Please test the file using the <a href="/js-xlsx/">raw parser</a>.  If there are issues with the file processor, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can make things right.',
          type: "warning",
        });
      };

      cdg = canvasDatagrid({
        parentNode: _grid,
      });

      if (cdg) {
        cdg.style.height = "100%";
        cdg.style.width = "100%";
      }

      function _resize() {
        if (_grid) {
          _grid.style.height = window.innerHeight - 200 + "px";
          _grid.style.width = window.innerWidth - 200 + "px";
        }
      }
      window.addEventListener("resize", _resize);

      const _onsheet = function(json: any[]) {
        /* show grid */
        if (_grid) {
          _grid.style.display = "block";
        }
        _resize();
        renderGrid(json);
        disableExportBtn.value = false;
      };

      // eslint-disable-next-line no-undef
      DropSheet({
        file: _file,
        drop: _target,
        on: {
          workstart: _workstart,
          workend: _workend,
          sheet: _onsheet,
          foo: "bar",
        },
        errors: {
          badfile: _badfile,
          pending: _pending,
          failed: _failed,
          large: _large,
          foo: "bar",
        },
      });
    });
    return {
      loading,
      disableExportBtn,
      baseUrl: process.env.BASE_URL,
      // todo
      __data,
      filename,
      sortValue,
      sortOption: [
        { label: "A", value: "0" },
        { label: "B", value: "1" },
      ],

      exportit,
      sortData,
    };
  },
});
</script>
<style lang="scss" scoped>
#body {
  display: flex;
  width: 100v;
  margin: 0 auto;
  #left {
    width: 188px;
    flex: 0 0 188px;
  }
  #right {
    flex: 1;
    text-align: left;
  }
}
.example {
  margin-top: 10px;
  border: 1px solid #eee;
  text-align: center;
  padding: 20px 0;
}
</style>
