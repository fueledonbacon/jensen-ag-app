<template>
  <div>
    <h1>Create Water Event</h1>
    <v-select
      v-model="field"
      :items="fields"
      label="Field"
      @change="updateFormFields(field)"
    />
    <v-select :items="['Precipitation', 'Irrigation']" v-model="update.type" label="Event type"/>
    <v-date-picker v-model="update.date" label="Event date"/>
    <v-text-field v-model.number="update.duration_hours" label="Duration (hrs)"/>
    <v-btn @click="createEvent">Create Event</v-btn>
  </div>
</template>
<script>
export default {
  apollo: {
    listFields: {
      query: require('../graphql/ListFields.gql'),
      update: data => data.listFields
    }
  },
  computed: {
    fields(){
      if(!this.listFields)
        return []
      return this.listFields.map(field => ({
        text: field.name,
        value: field
      }))
    }
  },
  data: ()=>({
    field: null,
    update: {
      date: null,
      duration_hours: null,
      type: null,
    }
  }),
  methods: {
    updateFormFields(field){
      for(const key in this.update){
        this.update[key] = field[key]
      }
    },
    async createEvent(){
      let inputs = {
        agrian_field_id: this.field.agrian_id
      }
      for(const key in this.update){
        inputs[key] = this.update[key]
      }
      const response = await this.$apollo.mutate({
        mutation: require('../graphql/CreateWaterEvent.gql'),
        variables: {
          inputs
        }
      })
      this.updateFormFields(response.createWaterEvent)
    }
  }
}
</script>