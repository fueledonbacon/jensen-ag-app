<template>
  <div>
    <h1>Update field</h1>
    <v-select
      v-model="field"
      :items="fields"
      @change="updateFormFields(field)"
    />
    <v-date-picker v-model="update.start_date" label="Start of SMB measurements"/>
    <v-select :items="plantings" v-model.number="update.kc_type" label="Planting Type"/>
    <v-text-field v-model.number="update.avg_gpm" label="Average Gallons per minute"/>
    <v-text-field v-model.number="update.du" label="Distribution uniformity"/>
    <v-text-field v-model.number="update.wetted_area_percent" label="Wetted area %"/>
    <v-text-field v-model.number="update.pre_infiltration_losses" label="Pre infiltration losses"/>
    <v-text-field v-model.number="update.canopy_cover_percent" label="Canopy cover %"/>
    <v-text-field v-model.number="update.soil_holding_capacity" label="Soil holding capacity"/>
    <v-text-field v-model.number="update.rooting_depth" label="Rooting depth"/>
    <v-text-field v-model.number="update.mad_percent" label="MAD %"/>
    <v-btn @click="updateField">Update Field</v-btn>
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
    plantings: [
      {
        text: 'Almonds',
        value: 'almonds'
      },
      {
        text: 'Walnuts',
        value: 'walnuts'
      }
    ],
    field: null,
    update: {
      start_date: null,
      avg_gpm: null,
      du: null,
      wetted_area_percent: null,
      pre_infiltration_losses: null,
      canopy_cover_percent: null,
      soil_holding_capacity: null,
      rooting_depth: null,
      mad_percent: null,
      kc_type: "",
    }
  }),
  methods: {
    updateFormFields(field){
      for(const key in this.update){
        this.update[key] = field[key]
      }
    },
    async updateField(){
      let update = {}
      for(const key in this.update){
        if(this.update[key] !== null){
          if(key == "start_date"){
            update[key] = new Date(this.update[key])
            continue
          }
          update[key] = this.update[key]
        }
      }
      const response = await this.$apollo.mutate({
        mutation: require('../graphql/UpdateField.gql'),
        variables: {
          id: this.field.agrian_id,
          update
        }
      })
      this.updateFormFields(response.updateField)
    }
  }
}
</script>