import XLSX, { ParsingOptions } from "xlsx";
import store from '@/store/index';

const DropSheet = (opts: any) => {
  if (!opts) opts = {};
  const nullfunc = function () { };
  if (!opts.errors) opts.errors = {};
  if (!opts.errors.badfile) opts.errors.badfile = nullfunc;
  if (!opts.errors.pending) opts.errors.pending = nullfunc;
  if (!opts.errors.failed) opts.errors.failed = nullfunc;
  if (!opts.errors.large) opts.errors.large = nullfunc;
  if (!opts.on) opts.on = {};
  if (!opts.on.workstart) opts.on.workstart = nullfunc;
  if (!opts.on.workend) opts.on.workend = nullfunc;
  if (!opts.on.sheet) opts.on.sheet = nullfunc;
  if (!opts.on.wb) opts.on.wb = nullfunc;

  const rABS = typeof FileReader !== 'undefined' && FileReader.prototype && FileReader.prototype.readAsBinaryString;
  const useworker = typeof Worker !== 'undefined';
  let pending = false;
  function fixdata(data: any) {
    let o = "", l = 0;
    const w = 10240;
    for (; l < data.byteLength / w; ++l)
      o += String.fromCharCode.apply(null, Array.from(new Uint8Array(data.slice(l * w, l * w + w))));
    o += String.fromCharCode.apply(null, Array.from(new Uint8Array(data.slice(o.length))));
    return o;
  }

  function sheetjsw(data: any, cb: any, readtype: any) {
    pending = true;
    opts.on.workstart();
    const scripts = document.getElementsByTagName('script');
    let dropsheetPath;
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf('dropsheet') != -1) {
        dropsheetPath = scripts[i].src.split('dropsheet.js')[0];
      }
    }
    const worker = new Worker(dropsheetPath + 'sheetjsw.js');
    worker.onmessage = function (e) {
      switch (e.data.t) {
        case 'ready': break;
        case 'e': pending = false; console.error(e.data.d); break;
        case 'xlsx':
          pending = false;
          opts.on.workend();
          cb(JSON.parse(e.data.d)); break;
      }
    };
    worker.postMessage({ d: data, b: readtype, t: 'xlsx' });
  }

  let last_wb: any;

  function to_json(workbook: any): Record<any, any> {
    if (useworker && workbook.SSF) XLSX.SSF.load_table(workbook.SSF);
    const result: Record<any, any> = {};
    workbook.SheetNames.forEach(function (sheetName: any) {
      const roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, header: 1 });
      if (roa.length > 0) result[sheetName] = roa;
    });
    return result;
  }

  function process_wb(wb: any, sheetidx?: any) {
    last_wb = wb;
    opts.on.wb(wb, sheetidx);
    const sheet = wb.SheetNames[sheetidx || 0];
    /* eslint-disable */
    const json = to_json(wb)[sheet];
    opts.on.sheet(json, wb.SheetNames, (sheetidx: any) => { process_wb(last_wb, sheetidx); });
  }


  function doSomeThing(files: any) {
    store.commit('setFilename', files[0].name)
    let i, f;
    for (i = 0, f = files[i]; i != files.length; ++i) {
      const reader = new FileReader();
      reader.onload = function (e: any) {
        let data = e.target.result;
        let wb, arr;
        const readtype: ParsingOptions = { type: rABS ? 'binary' : 'base64' };
        if (!rABS) {
          arr = fixdata(data);
          data = btoa(arr);
        }
        function doit() {
          try {
            if (useworker) { sheetjsw(data, process_wb, readtype); return; }
            wb = XLSX.read(data, readtype);
            process_wb(wb);
          } catch (e) { console.log(e); opts.errors.failed(e); }
        }

        if (e.target.result.length > 1e6) opts.errors.large(e.target.result.length, function (e: any) { if (e) doit(); });
        else { doit(); }
      };
      if (rABS) reader.readAsBinaryString(f);
      else reader.readAsArrayBuffer(f);
    }
  }


  function handleDrop(e: any) {
    e.stopPropagation();
    e.preventDefault();
    if (pending) return opts.errors.pending();
    const files = e.dataTransfer.files;
    doSomeThing(files)
  }

  function handleDragover(e: any) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  if (opts.drop.addEventListener) {
    opts.drop.addEventListener('dragenter', handleDragover, false);
    opts.drop.addEventListener('dragover', handleDragover, false);
    opts.drop.addEventListener('drop', handleDrop, false);
  }

  function handleFile(e: any) {
    if (pending) return opts.errors.pending();
    const files = e.target.files;
    doSomeThing(files)
  }

  if (opts.file && opts.file.addEventListener) opts.file.addEventListener('change', handleFile, false);
};


export { DropSheet };
