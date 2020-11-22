import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import VueApexCharts from 'vue-apexcharts'
import { createProvider } from './vue-apollo'
import router from './router'
import { Auth0Plugin } from "./plugins/auth";
import { domain, clientId } from "../auth_config.json";

Vue.config.productionTip = false

Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

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

function initializeApplication(){
  new Vue({
    vuetify,
    apolloProvider: createProvider(),
    router,
    render: h => h(App)
  }).$mount('#app')
}
