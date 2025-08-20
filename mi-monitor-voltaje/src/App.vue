<template>
  <div class="container">
    <StatusHeader 
      :isOnline="isOnline"
      :sensorId="sensorId"
      :lastUpdate="lastUpdate"
    />
    
    <ControlPanel 
      :selectedEndpoint="selectedEndpoint"
      :externalUrl="externalUrl"
      :sensorId="sensorId"
      :autoUpdate="autoUpdate"
      :loading="loading"
      @update-endpoint="handleEndpointUpdate"
      @update-external-url="handleExternalUrlUpdate"
      @update-sensor-id="handleSensorIdUpdate"
      @toggle-auto-update="toggleAutoUpdate"
      @fetch-data="fetchData"
    />

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <VoltageChart 
      :chartData="chartData"
      :currentVoltage="currentVoltage"
      :loading="loading && !chartData.length"
    />
  </div>
</template>

<script>
import StatusHeader from './components/StatusHeader.vue'
import ControlPanel from './components/ControlPanel.vue'
import VoltageChart from './components/VoltageChart.vue'

export default {
  name: 'App',
  components: {
    StatusHeader,
    ControlPanel,
    VoltageChart
  },
  data() {
    return {
      sensorId: 1,
      selectedEndpoint: 'local',
      externalUrl: 'https://41e1b4f12ed4.ngrok-free.app',
      apiUrl: '',
      chartData: [],
      currentVoltage: null,
      autoUpdate: false,
      loading: false,
      error: null,
      lastUpdate: 'Nunca',
      isOnline: false,
      intervalId: null
    }
  },
  mounted() {
    this.urlapi = import.meta.apiurlLocal;
    this.fetchData()
  },
  beforeUnmount() {
    this.stopAutoUpdate()
  },
  methods: {
    handleEndpointUpdate(endpoint) {
      this.selectedEndpoint = endpoint
      this.updateApiUrl()
    },

    handleExternalUrlUpdate(url) {
      this.externalUrl = url
      if (this.selectedEndpoint === 'external') {
        this.updateApiUrl()
      }
    },

    handleSensorIdUpdate(id) {
      this.sensorId = id
      if (this.autoUpdate) {
        this.fetchData()
      }
    },

    updateApiUrl() {
      if (this.selectedEndpoint === 'local') {
        this.apiUrl = 'http://192.166.0.254:8000/api/v1/sensor_data'
      } else {
        this.apiUrl = `${this.externalUrl}/api/v1/sensor_data`
      }
    },

    async fetchData() {
      this.loading = true
      this.error = null

      try {
        const url = `${this.apiUrl}/${this.sensorId}/recent`
        console.log('Fetching from:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        })

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Data received:', data)

        if (data.readings && Array.isArray(data.readings)) {
          this.processData(data.readings)
          this.isOnline = true
          this.lastUpdate = new Date().toLocaleTimeString('es-MX')
          
          if (data.readings.length > 0) {
            this.currentVoltage = data.readings[0].voltage
          }
        } else {
          throw new Error('Formato de datos inválido')
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        this.error = `Error al obtener datos: ${error.message}`
        this.isOnline = false
      } finally {
        this.loading = false
      }
    },

    processData(readings) {
      // Convert timestamp to chart format and sort by time
      const chartPoints = readings.map(reading => ({
        time: Math.floor(new Date(reading.timestamp).getTime() / 1000),
        value: reading.voltage
      })).sort((a, b) => a.time - b.time)

      this.chartData = chartPoints
    },

    toggleAutoUpdate() {
      if (this.autoUpdate) {
        this.stopAutoUpdate()
      } else {
        this.startAutoUpdate()
      }
    },

    startAutoUpdate() {
      this.autoUpdate = true
      this.intervalId = setInterval(() => {
        this.fetchData()
      }, 5000) // 5 seconds
    },

    stopAutoUpdate() {
      this.autoUpdate = false
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    }
  }
}
</script>
