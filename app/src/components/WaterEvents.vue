<template>
  <div>
    <h1>Create Water Event</h1>
    <v-select v-model="field" :items="fields" label="Field" @change="updateFormFields(field)" />
    <v-btn @click="addRow">Add an event</v-btn>
    <v-row v-for="(update, index) in updates"  :key="`event-${index}`">
      <v-col>
        <v-select
          :items="['Precipitation', 'Irrigation']"
          v-model="update.type"
          label="Event type"
        />
      </v-col>
      <v-col>
        <v-menu
          ref="menu"
          v-model="dateMenu"
          :close-on-content-click="true"
          transition="scale-transition"
          offset-y
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              :value="update.start_date"
              label="Event date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker v-model="update.date" no-title scrollable />
        </v-menu>
      </v-col>
      <v-col>
        <v-text-field v-model.number="update.duration_hours" label="Duration (hrs)" />
      </v-col>
    </v-row>
    <v-btn @click="createEvent">Create Events</v-btn>
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
  },
  data: () => ({
    dateMenu: null,
    field: null,
    nullUpdate: {
      date: null,
      duration_hours: null,
      type: null,
    },
    updates: [
      {
        date: null,
        duration_hours: null,
        type: null,
      },
    ],
  }),
  methods: {
    addRow() {
      let newRow = Object.assign({}, this.nullUpdate);
      this.updates.push(newRow);
    },
    updateFormFields(field) {
      for (const key in this.update) {
        this.update[key] = field[key];
      }
    },
    async createEvent() {
      let inputs = {
        agrian_field_id: this.field.agrian_id,
      };
      for (const key in this.update) {
        inputs[key] = this.update[key];
      }
      const response = await this.$apollo.mutate({
        mutation: require("../graphql/CreateWaterEvent.gql"),
        variables: {
          inputs,
        },
      });
      this.updateFormFields(response.createWaterEvent);
    },
  },
};
</script>