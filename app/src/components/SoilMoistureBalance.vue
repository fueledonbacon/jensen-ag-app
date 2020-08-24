<template>
  <div class="apollo-example">
    <!-- Cute tiny form -->
    <div class="form">
      <v-select
        :items="fields"
        v-model="field"
        label="Field"
      />
      <v-row>
        <v-col>
          <v-date-picker v-model="range" label="Dates" range/>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn @click="updateQuery">Fetch</v-btn>
        </v-col>
      </v-row>
    </div>

    <v-row>
      <v-col>
        <!-- Loading -->
        <div v-if="$apollo.loading" class="loading apollo">Loading...</div>

        <!-- Error -->
        <div v-else-if="$apollo.error" class="error apollo">An error occured</div>

        <!-- Result -->
        <div v-else-if="$apollo.queries.chartData" class="result apollo">
          <apexchart width="800" type="line" :options="this.chartOptions" :series="this.series" />
        </div>

        <!-- No result -->
        <div v-else class="no-result apollo">No result :(</div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { justDate } from "../utilities.js";
export default {
  apollo: {
    listFields: {
      query: require("../graphql/ListFields.gql"),
      update: (data) => data.listFields,
    },
    chartData: {
      query: require("../graphql/GetSoilMoistureBalance.gql"),
      variables() {
        return {
          start_date: this.query.start_date,
          end_date: this.query.end_date,
          field_id: this.query.field_id,
        };
      },
      update: (data) => data.getField,
    },
  },
  computed: {
    fields() {
      if (!this.listFields) return [];
      return this.listFields.map((field) => ({
        text: field.name,
        value: {
          name: field.name,
          agrian_id: field.agrian_id,
          start_date: field.start_date,
        },
      }));
    },
    chartOptions() {
      return {
        chart: {
          id: "smb-example",
        },
        xaxis: {
          type: "datetime",
          categories: this.getCategories(),
        },
        yaxis: {
          labels: {
            formatter: (value) => Number(value).toFixed(2),
          },
        },
      };
    },
    series() {
      return this.getSeries();
    },
  },
  data() {
    const today = justDate(new Date());
    return {
      range: ["2020-03-22", today],
      field: {
        agrian_id: "3e803653-e24e-4524-9550-d79ab268137b",
        start_date: "2020-03-22",
      },
      query: {
        field_id: "3e803653-e24e-4524-9550-d79ab268137b",
        start_date: "2020-03-22",
        end_date: today,
      },
    };
  },
  methods: {
    updateQuery() {
      this.query = {
        start_date: this.range[0],
        end_date: this.range[1],
        field_id: this.field.agrian_id,
      };
    },
    getCategories() {
      if (this.$apollo.queries.chartData.loading) return [];
      let categories = this.chartData.smb.map(({ date }) => date);
      return categories;
    },
    getSeries() {
      if (this.$apollo.queries.chartData.loading)
        return [
          {
            name: "Loading",
            data: [],
          },
        ];
      let smb = this.chartData.smb.map(({ value }) => value);
      let mad = new Array(smb.length).fill(this.chartData.mad);
      return [
        {
          name: "Soil Moisture Balance",
          data: smb,
        },
        {
          name: "MAD",
          data: mad,
        },
      ];
    },
  },
};
</script>

<style scoped>
.form,
.input,
.apollo,
.message {
  padding: 12px;
}

label {
  display: block;
  margin-bottom: 6px;
}

.input {
  font-family: inherit;
  font-size: inherit;
  border: solid 2px #ccc;
  border-radius: 3px;
}

.error {
  color: red;
}

.images {
  display: grid;
  grid-template-columns: repeat(auto-fill, 300px);
  grid-auto-rows: 300px;
  grid-gap: 10px;
}

.image-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ccc;
  border-radius: 8px;
}

.image {
  max-width: 100%;
  max-height: 100%;
}

.image-input {
  margin: 20px;
}
</style>
