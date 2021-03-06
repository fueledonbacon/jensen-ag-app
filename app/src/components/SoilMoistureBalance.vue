<template>
  <v-row>
    <v-col>
    <div class="form">
      <v-select :items="fields" v-model="field" @change="selectField" label="Field" />
      <v-row>
        <v-col>
          <v-menu
            ref="menu1"
            v-model="rangeMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="dateFormatted"
                label="Range"
                prepend-icon="mdi-calendar"
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-date-picker range v-model="range" @change="checkRange" no-title />
          </v-menu>
        </v-col>
      </v-row>
    </div>

    <v-row>
      <v-col>
        <!-- Loading -->
        <div v-if="$apollo.loading" class="loading apollo">Loading...</div>

        <!-- Error -->
        <div v-else-if="$apollo.error" class="error apollo">An error occured</div>

        <div v-else-if="chartData.smb.length > 0" class="result apollo">
          <apexchart
            width="800"
            type="line"
            :options="chartOptions"
            :series="series"
          />
        </div>

        <!-- No result -->
        <div v-else class="no-result apollo">No result :(</div>
      </v-col>
    </v-row>
    </v-col>
  </v-row>
</template>

<script>
// import moment from "moment";
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
          field_id: this.field.agrian_id,
        };
      },
      update: (data) => {
        return data?.getField || { smb: [] }
      },
      skip(){
        return !this.field?.agrian_id 
      }
    },
  },
  computed: {
    dateFormatted() {
      return this.range.join(" ~ ");
    },
    fields() {
      if (!this.listFields) return [];
      return this.listFields
        .filter((field) => /^Active$/i.test(field.subscription_status))
        .map((field) => ({
          text: field.name,
          value: field
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
      return this.getSeries() || [];
    },
  },
  watch: {
    listFields(list){
      if(Array.isArray(list) && this.$route.params.field_id){
        this.field = list.find(field => field.agrian_id == this.$route.params.field_id)
        this.selectField()
      }
    }
  },
  data() {
    return {
      rangeMenu: null,
      range: [],
      chartData: { smb: [] },
      field: {
        agrian_id: this.$route?.params?.field_id,
      },
    };
  },
  methods: {
    selectField(){
      this.range = [
        this.field.start_date,
        this.field.end_date
      ]
    },
    checkRange() {
      let [a, b] = this.range;
      if (new Date(a).getTime() > new Date(b).getTime()) {
        this.range = [b, a];
      }
    },
    updateQuery() {
      this.query = {
        field_id: this.field.agrian_id,
      };
    },
    getCategories() {
      if (this.$apollo.queries.chartData.loading) return [];
      let categories = this.chartData?.smb
        .filter(item => {
          let [start, end] = this.range
          const t  = new Date(item.date).getTime()
          return new Date(start).getTime() <= t && new Date(end).getTime() >= t
        })
        .map(({ date }) => date);
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
      let smb = this.chartData.smb
        .filter(item => {
          let [start, end] = this.range
          const t  = new Date(item.date).getTime()
          return new Date(start).getTime() <= t && new Date(end).getTime() >= t
        })
        .map(({ value }) => value) || [];
      let mad = new Array(smb?.length).fill(this.chartData?.mad);
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
