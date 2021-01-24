<template>
<v-row wrap>
  <v-col cols="12">
    <h1>
      Your Fields
    </h1>
  </v-col>
  <v-col cols="3" v-for="(field, i) in fields" :key="`field-${i}`">
    <v-card @click="$router.push({path: `/soil-moisture-balance/${field.agrian_id}`})">
      <v-card-title> {{ field.name }}</v-card-title>
      <v-card-text>
        <v-chip
          v-if="self.isAdmin"
          :color="field.subscription_status == 'Active'? 'green': 'gray'"
        >
          {{field.subscription_status}}
        </v-chip>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
</template>
<script>
import gql from 'graphql-tag'
export default {
  apollo: {
    self: {
      query: gql`query { self }`,
      update: state => state.self
    },
    fields: {
      query: gql`query {
        listFields {
          id
          agrian_id
          name
          subscription_status
        }
      }`,
      skip(){
        return !this.$auth.isAuthenticated;
      },
      update: state => state.listFields
    },
  },
  data(){
    return {
      fields: []
    }
  }
}
</script>