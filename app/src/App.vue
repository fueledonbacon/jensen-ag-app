<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        Jensen Ag Viewer
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main>
      <ApolloExample/>
    </v-main>
  </v-app>
</template>

<script>
import ApolloExample from './components/ApolloExample';

export default {
  name: 'App',

  components: {
    ApolloExample,
  },

  data: () => ({
    //
  }),
};
</script>
