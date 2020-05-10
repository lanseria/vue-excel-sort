import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    filename: '',
  },
  mutations: {
    setFilename(state, filename) {
      state.filename = filename;
    },
  },
  actions: {},
  modules: {},
});
