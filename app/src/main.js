import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import VueApexCharts from 'vue-apexcharts'
import { createProvider } from './plugins/apollo'
import router from './router'
import { Auth0Plugin } from "./plugins/auth";
import { domain, clientId } from "../auth_config.json";
import store from './store'

Vue.config.productionTip = false

Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

const initializeApplication = () => {
  new Vue({
    vuetify,
    apolloProvider: createProvider(),
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

Vue.use(Auth0Plugin, {
  domain,
  clientId,
  store,
  initializeApplication,
  onRedirectCallback: appState => {
    router.push(
      appState && appState.targetUrl
        ? appState.targetUrl
        : window.location.pathname
    );
  }
});

