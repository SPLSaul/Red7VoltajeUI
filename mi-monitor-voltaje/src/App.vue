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
      externalUrl: 'https://b18811412a85.ngrok-free.app',
      apiUrl: import.meta.env.VITE_API_URL, 
      chartData: [],
      currentVoltage: null,
      autoUpdate: false,
      loading: false,
      error: null,
      lastUpdate: 'Nunca',
      isOnline: false,
      intervalId: null,
      // Define the target timezone
      targetTimezone: 'America/Los_Angeles' // -07:00 corresponds to PDT
    }
  },
  mounted() {
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
        this.apiUrl = import.meta.env.VITE_API_URL
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

        const text = await response.text()
        console.log('RAW response:', text)

        let data
        try {
          data = JSON.parse(text)
        } catch (err) {
          throw new Error('Respuesta no es JSON válido')
        }

        if (data.readings && Array.isArray(data.readings)) {
          this.processData(data.readings)
          this.isOnline = true
          
          if (data.readings.length > 0) {
            this.currentVoltage = data.readings[0].voltage
            // Update lastUpdate using the most recent reading's timestamp
            const mostRecentReading = data.readings[0]
            this.lastUpdate = this.formatTimestampForDisplay(mostRecentReading.timestamp)
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

    /**
     * Format a timestamp string for display, preserving the original timezone
     */
    formatTimestampForDisplay(timestampString) {
      try {
        const date = new Date(timestampString)
        // Mantener el formato original con el offset
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Los_Angeles'  // ← Forzar timezone específico
        }) + ' PDT'
      } catch (error) {
        console.error('Error formatting timestamp:', error)
        return 'Error en formato'
      }
    },

    /**
     * Convert timestamp to Unix timestamp for chart, preserving timezone context
     */
    timestampToUnix(timestampString) {
      try {
        const date = new Date(timestampString)
        const timeWithOffset = date.getTime() - (date.getTimezoneOffset() * 60000)
    return Math.floor(timeWithOffset / 1000)
        } catch (error) {
        console.error('Error converting timestamp:', error)
        return 0
      }
    },

    processData(readings) {
      // Sort readings by timestamp first (newest first based on your data structure)
      const sortedReadings = [...readings].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Convert to chart format, preserving the original timestamp timezone
      const chartPoints = sortedReadings.map(reading => ({
        time: this.timestampToUnix(reading.timestamp),
        value: reading.voltage,
        // Keep original timestamp for debugging/reference
        originalTimestamp: reading.timestamp
      }))

      // Sort chart points by time for proper display (oldest first for chart)
      this.chartData = chartPoints.sort((a, b) => a.time - b.time)

      console.log('Processed chart data:', this.chartData)
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
