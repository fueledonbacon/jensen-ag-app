<template>
  <div class="apollo-example">
    <!-- Cute tiny form -->
    <div class="form">
      <label for="field-id" class="label">Field ID</label>
      <input v-model="field_id" placeholder="Enter field ID" class="input" id="field-id" />
      <label for="start-date" class="label">Start Date</label>
      <input v-model="start_date" placeholder="yyyy-mm-dd" class="input" id="start-date" />
      <label for="end-date" class="label">End Date</label>
      <input v-model="end_date" placeholder="yyyy-mm-dd" class="input" id="end-date" />
      <v-btn @click="updateQuery">Fetch</v-btn>
    </div>

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
  </div>
</template>

<script>
import GetSoilMoistureBalance from '../graphql/GetSoilMoistureBalance.gql'
export default {
  apollo: {
    chartData: {
      query: GetSoilMoistureBalance,
      variables() {
        return {
          start_date: this.query.start_date,
          end_date: this.query.end_date,
          field_id: this.query.field_id,
        };
      },
      update: (data) => data.getField
    }
  },
  computed: {
    chartOptions() {
      return {
        chart: {
          id: "smb-example",
        },
        xaxis: {
          type: "datetime",
          categories: this.getCategories() 
        },
        yaxis: {
          labels: {
            formatter: (value) => Number(value).toFixed(2)
          }
        }
      };
    },
    series() {
      return this.getSeries()
    },
  },
  data() {
    return {
      field_id: "3e803653-e24e-4524-9550-d79ab268137b",
      start_date: "2020-03-22",
      end_date: "2020-03-31",
      query: {
        field_id: "3e803653-e24e-4524-9550-d79ab268137b",
        start_date: "2020-03-22",
        end_date: "2020-03-31",
      },
    };
  },
  methods: {
    updateQuery() {
      this.query = {
        start_date: this.start_date,
        end_date: this.end_date,
        field_id: this.field_id,
      };
    },
    getCategories() {
      if(this.$apollo.queries.chartData.loading)
        return []
      let categories = this.chartData.smb.map(({ date }) => date);
      return categories
    },
    getSeries() {
      if(this.$apollo.queries.chartData.loading)
        return [{
          name: "Loading",
          data: []
        }]
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
