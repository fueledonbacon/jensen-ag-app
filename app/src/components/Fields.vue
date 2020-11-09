<template>
  <div>
    <h1>Update field</h1>
    <v-select v-model="field" :items="fields" @change="updateFormFields(field)" label="Field" />
    <v-menu
      ref="menu"
      v-model="date_menu"
      :close-on-content-click="true"
      transition="scale-transition"
      offset-y
      min-width="290px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          :value="update.start_date"
          label="Start of measurements"
          prepend-icon="mdi-calendar"
          readonly
          v-bind="attrs"
          v-on="on"
        ></v-text-field>
      </template>
      <v-date-picker v-model="update.start_date" no-title scrollable/>
    </v-menu>
    <v-select :items="plantings" v-model.number="update.kc_type" label="Planting Type" />
    <v-text-field v-model.number="update.avg_gpm" label="Average Gallons per minute" />
    <v-text-field v-model.number="update.irrigated_blocks" label="Number of irrigated blocks" />
    <v-text-field v-model.number="update.soil_holding_capacity" label="Soil holding capacity (in)" />
    <v-text-field v-model.number="update.depletion_limit" label="Soil depletion limit (in)" />
    <v-select
      v-model="update.subscription_status"
      label="Subscription Status"
      :items="['Active', 'Inactive']"
    />
    <v-slider v-model="du" label="Distribution uniformity">
      <template v-slot:append>
        <v-text-field v-model.number="update.du" />
      </template>
    </v-slider>
    <v-slider label="Wetted area %" v-model="wetted_area">
      <template v-slot:append>
        <v-text-field v-model.number="update.wetted_area_percent" />
      </template>
    </v-slider>
    <v-slider label="Pre infiltration losses" v-model="pre_infiltration_losses">
      <template v-slot:append>
        <v-text-field v-model.number="update.pre_infiltration_losses" />
      </template>
    </v-slider>
    <v-slider label="Canopy Cover %" v-model="canopy_cover" :min="0" :max="100">
      <template v-slot:append>
        <v-text-field v-model.number="update.canopy_cover_percent" />
      </template>
    </v-slider>
    <v-slider label="MAD %" v-model="mad_percent" :min="0" :max="100">
      <template v-slot:append>
        <v-text-field v-model.number="update.mad_percent" />
      </template>
    </v-slider>
    <v-btn @click="updateField">Update Field</v-btn>

    <h3>Water Events</h3>
    <v-data-table :items="field.water_events" :headers="headers">
       <template v-slot:item.actions="{ item }">
      <v-icon
        small
        @click="deleteItem(item)"
      >
        mdi-delete
      </v-icon>
    </template>
    </v-data-table>
  </div>
</template>
<script>
export default {
  apollo: {
    listFields: {
      query: require("../graphql/ListFields.gql"),
      update: (data) => data.listFields,
    },
  },
  computed: {
    fields() {
      if (!this.listFields) return [];
      return this.listFields.map((field) => ({
        text: field.name,
        value: field,
      }));
    },
    pre_infiltration_losses: {
      get() {
        return this.update.pre_infiltration_losses * 100;
      },
      set(v) {
        this.update.pre_infiltration_losses = v / 100;
      },
    },
    du: {
      get() {
        return this.update.du * 100;
      },
      set(v) {
        this.update.du = v / 100;
      },
    },
    wetted_area: {
      get() {
        return this.update.wetted_area_percent * 100;
      },
      set(v) {
        this.update.wetted_area_percent = v / 100;
      },
    },
    canopy_cover: {
      get() {
        return this.update.canopy_cover_percent * 100;
      },
      set(v) {
        this.update.canopy_cover_percent = v / 100;
      },
    },
    mad_percent: {
      get() {
        return this.update.mad_percent * 100;
      },
      set(v) {
        this.update.mad_percent = v / 100;
      },
    },
  },
  data: () => ({
    date_menu: null,
    headers: [
      {
        text: "Date",
        value: "date"
      },
      {
        text: "Type",
        value: "type"
      },
      {
        text: "Duration (hrs)",
        value: "duration_hours"
      },
    ],
    plantings: [
      {
        text: "Almonds",
        value: "almonds",
      },
      {
        text: "Walnuts",
        value: "walnuts",
      },
    ],
    field: {
      water_events: []
    },
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
      subscription_status: "",
      irrigated_blocks: null,
      depletion_limit: null,
    },
  }),
  methods: {
    deleteItem(item){
      console.log(item)
    },
    percentSlider(key, value) {
      this.update[key] = Number(value) / 100;
    },
    updateFormFields(field) {
      if(!(typeof field == "object")){
        console.log('updateFormFields: no object passed')
        return
      }
        
      for (const key in this.update) {
        this.update[key] = field[key];
      }
    },
    async updateField() {
      let update = {};
      for (const key in this.update) {
        if (this.update[key] !== null) {
          if (key == "start_date") {
            update[key] = new Date(this.update[key]);
            continue;
          }
          update[key] = this.update[key];
        }
      }
      const response = await this.$apollo.mutate({
        mutation: require("../graphql/UpdateField.gql"),
        variables: {
          id: this.field.agrian_id,
          update,
        },
      });
      this.updateFormFields(response.updateField);
    },
  },
};
</script>
<style>
.v-input__slot .v-label{
  width: 12rem;
}
</style>