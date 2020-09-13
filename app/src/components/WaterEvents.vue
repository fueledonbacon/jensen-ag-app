<template>
  <div>
    <h1>Create Water Event</h1>
    <v-select v-model="field" :items="fields" label="Field"/>
    <div v-if="field">
      <v-btn @click="addRow">Add an event</v-btn>
      <v-row v-for="(update, index) in updates" :key="`event-${index}`">
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
            v-model="dateMenu[index]"
            :close-on-content-click="true"
            transition="scale-transition"
            offset-y
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                :value="update.date"
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
        <v-col>
          <v-btn @click="deleteRow(index)"><v-icon>mdi-delete</v-icon></v-btn>
        </v-col>
      </v-row>
    </div>
    <v-btn :disabled="updates.length == 0" @click="createEvent">Create Events</v-btn>
    <div v-if="field">
      <h3>Water Events</h3>
      <v-data-table
        :items="field.water_events"
        :headers="headers"
        :options="{sortBy: ['date']}"
        >
        <template v-slot:item.actions="{ item }">
          <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
        </template>
      </v-data-table>
    </div>
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
    dateMenu: [],
    field: null,
    nullUpdate: {
      date: null,
      duration_hours: null,
      type: "Irrigation",
    },
    updates: [],
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
      {
        text: "",
        value: "actions"
      }
    ],
  }),
  methods: {
    deleteRow(index){
      this.updates.splice(index, 1)
    },
    async deleteItem(item){
      await this.$apollo.mutate({
        mutation: require("../graphql/DeleteWaterEvent.gql"),
        variables: {
          id: Number(item.id),
        },
      });
      await this.refreshField()
    },
    async refreshField(){
      const res = await this.$apollo.query({
        query: require('../graphql/GetField.gql'),
        variables: {
          agrian_id: this.field.agrian_id
        }
      })
      this.field = res.data.getField
    },
    addRow() {
      let newRow = Object.assign({}, this.nullUpdate, {
        agrian_field_id: this.field.agrian_id,
      });
      this.updates.push(newRow);
    },
    async createEvent() {
      await this.$apollo.mutate({
        mutation: require("../graphql/CreateWaterEvents.gql"),
        variables: {
          inputs: this.updates,
        },
      });
      await this.refreshField()
    },
  },
};
</script>