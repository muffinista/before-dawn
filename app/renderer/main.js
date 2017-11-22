import Vue from 'vue';
import VueElectron from 'vue-electron';
import BootstrapVue from 'bootstrap-vue'

import Prefs from './Prefs';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.config.productionTip = false;

Vue.use(VueElectron);
Vue.use(BootstrapVue);

// eslint-disable no-new 
new Vue({
  components: { Prefs },
  template: '<Prefs/>'
}).$mount('#prefs');

