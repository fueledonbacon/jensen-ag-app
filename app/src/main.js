import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import VueApexCharts from 'vue-apexcharts'
import { createProvider } from './vue-apollo'
import router from './router'

Vue.config.productionTip = false

Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)


new Vue({
  vuetify,
  apolloProvider: createProvider(),
  router,
  render: h => h(App)
}).$mount('#app')
