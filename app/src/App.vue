<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-if="$auth.isAuthenticated"
      v-model="drawer"
      app
    >
      <v-list dense>
        <v-list-item link to="/">
          <v-list-item-action>
            <v-icon>mdi-home</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/soil-moisture-balance">
          <v-list-item-action>
            <v-icon>mdi-scale-balance</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Soil Moisture Balance</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="self.isAdmin" link to="/fields">
          <v-list-item-action>
            <v-icon>mdi-map</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Fields</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="self.isAdmin" link to="/water-events">
          <v-list-item-action>
            <v-icon>mdi-waves</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Water Events</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="$auth.isAuthenticated" @click="$auth.logout()">
          <v-list-item-action>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="indigo"
      dark
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Jensen Ag Data Viewer</v-toolbar-title>
      <v-spacer/>

      <v-btn v-if="!$auth.isAuthenticated" @click="$auth.loginWithRedirect">Login</v-btn>
      <v-chip v-else>{{$auth.user.email}}</v-chip>
      <v-chip v-if="self.isAdmin" color="info">Admin</v-chip>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view v-if="$auth.isAuthenticated"/>
        <login v-else/>
      </v-container>
    </v-main>
    <v-footer
      color="indigo"
      app
    >
    </v-footer>
  </v-app>
</template>

<script>

import gql from 'graphql-tag'
import Login from '@/components/Login.vue'

export default {
  name: 'App',
  components: { Login },
  apollo: {
    self: {
      query: gql`query { self }`,
      skip(){
        return !this.$auth.idToken
      },
      update: state => state.self
    }
  },
  data: () => ({
    self: {},
    drawer: null
  }),
};
</script>
