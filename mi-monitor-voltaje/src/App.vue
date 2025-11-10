<template>
  <div class="container">
    <StatusHeader 
      :isOnline="isOnline"
      :sensorId="sensorId"
      :lastUpdate="lastUpdate"
      :api-base-url="getApiBaseUrl"
      @sensor-change="handleSensorIdUpdate"
    />
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <VoltageChart 
      :chartData="chartData"
      :currentVoltage="currentVoltage"
      :loading="loading && !chartData.length"
      title="Datos en Tiempo Real"
    />
    
    <ControlPanel 
      :apiUrl="apiUrl"
      :selectedEndpoint="selectedEndpoint"
      :sensorId="sensorId"
      :autoUpdate="autoUpdate"
      :loading="loading"
      :startDate="startDate"    
      :endDate="endDate"      
      @update-endpoint="handleEndpointUpdate"
      @update-external-url="handleExternalUrlUpdate"
      @update-sensor-id="handleSensorIdUpdate"
      @toggle-auto-update="toggleAutoUpdate"
      @fetch-data="fetchData"
      @update-start-date="handleStartDateUpdate" 
      @update-end-date="handleEndDateUpdate"   
      @apply-date-filter="fetchDataWithRange"
      @update-filtered-readings="handleFilteredReadings" 
    />

    <!-- Gráfico filtrado por fecha -->
    <VoltageChart 
      v-if="showChart && rangeChartData.length > 0"
      :chartData="rangeChartData"
      :currentVoltage="null"
      :loading="rangeLoading"
      title="Voltaje filtrado por rango"
    />
    
    <InlineMenuView 
      :minVoltage="minMaxVoltages.min"
      :maxVoltage="minMaxVoltages.max"
    />
  </div>
</template>

<script>
import StatusHeader from './components/StatusHeader.vue'
import ControlPanel from './components/ControlPanel.vue'
import VoltageChart from './components/VoltageChart.vue'
import InlineMenuView from './components/InlineMenuView.vue'

export default {
  name: 'App',
  components: {
    StatusHeader,
    ControlPanel,
    VoltageChart,
    InlineMenuView
  },
  data() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return {
      sensorId: 1,
      selectedEndpoint: 'local',
      externalUrl: 'https://b18811412a85.ngrok-free.app',
      apiUrl: import.meta.env.VITE_API_URL, 
      chartData: [],
      rangeChartData: [],   
      currentVoltage: null,
      autoUpdate: true,
      loading: false,
      rangeLoading: false,
      error: null,
      lastUpdate: 'Nunca',
      isOnline: false,
      intervalId: null,
      targetTimezone: 'America/Los_Angeles',
      startDate: yesterday.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      showChart: false, 
    }
  },
  computed: {
    minMaxVoltages() {
      if (!this.chartData || this.chartData.length === 0) {
        return { min: null, max: null };
      }
      const voltages = this.chartData.map(point => point.value);
      const min = Math.min(...voltages);
      const max = Math.max(...voltages);
      return { min, max };
    },
     getApiBaseUrl() {
      if (this.selectedEndpoint === 'local') {
        return import.meta.env.VITE_API_URL?.replace('/api/v1/sensor_data', '/api/v1') || 'http://192.166.0.254:8000/api/v1'
      } else {
        return this.externalUrl.replace('/api/v1/sensor_data', '/api/v1')
      }
    }
  },
  mounted() {
    this.fetchData();
    this.startAutoUpdate(); 
  },
  beforeUnmount() {
    this.stopAutoUpdate()
  },
  methods: {
    // ✅ NUEVO MÉTODO PARA MANEJAR LOS DATOS FILTRADOS
    handleFilteredReadings(filteredReadings) {
      console.log('Datos filtrados recibidos en App.vue:', filteredReadings);
      
      if (filteredReadings && Array.isArray(filteredReadings)) {
        this.rangeChartData = this.processReadingsForChart(filteredReadings);
        this.showChart = true;
        this.rangeLoading = false;
        
        console.log('Gráfico filtrado actualizado con:', this.rangeChartData.length, 'puntos');
      } else {
        this.rangeChartData = [];
        this.showChart = false;
      }
    },

    // ✅ MÉTODO PARA PROCESAR LECTURAS PARA EL GRÁFICO
    processReadingsForChart(readings) {
      return readings
        .map(reading => ({
          time: this.timestampToUnix(reading.timestamp),
          value: reading.voltage,
          originalTimestamp: reading.timestamp
        }))
        .sort((a, b) => a.time - b.time);
    },

    // Los demás métodos permanecen igual...
    handleEndpointUpdate(endpoint) {
      this.selectedEndpoint = endpoint
      this.updateApiUrl()
      if (this.autoUpdate) {
        this.stopAutoUpdate();
        this.startAutoUpdate();
      }
    },

    handleExternalUrlUpdate(url) {
      this.externalUrl = url
      if (this.selectedEndpoint === 'external') {
        this.updateApiUrl()
      }
      if (this.autoUpdate && this.selectedEndpoint === 'external') {
        this.stopAutoUpdate();
        this.startAutoUpdate();
      }
    },

    handleSensorIdUpdate(id) {
      this.sensorId = id
      if (this.autoUpdate) {
        this.stopAutoUpdate();
        this.startAutoUpdate();
      }
      this.fetchData(); 
    },

    handleStartDateUpdate(date) {
      this.startDate = date;
    },
    
    handleEndDateUpdate(date) {
      this.endDate = date;
    },

    toggleAutoUpdate() {
      if (this.autoUpdate) {
        this.stopAutoUpdate()
      } else {
        this.startAutoUpdate()
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
        let url = `${this.apiUrl}/${this.sensorId}/recent`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
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
            const mostRecentReading = data.readings[0]
            this.lastUpdate = this.formatTimestampForDisplay(mostRecentReading.timestamp)
          } else {
            this.currentVoltage = null;
            this.lastUpdate = 'No hay datos recientes';
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

    formatTimestampForDisplay(timestampString) {
      try {
        const date = new Date(timestampString)
        const correction = -1 * 60 * 60 * 1000; // -1 hora
        const correctedDate = new Date(date.getTime() + correction);
        
        return correctedDate.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Los_Angeles'
        }) + ' PST'
      } catch (error) {
        console.error('Error formatting timestamp:', error)
        return 'Error en formato'
      }
    },

  timestampToUnix(timestampString) {
    try {
      const date = new Date(timestampString);
      
      if (!timestampString.endsWith('Z') && !timestampString.includes('+')) {

        const pdtOffset = -9 * 60 * 60 * 1000; 
        return Math.floor((date.getTime() + pdtOffset) / 1000);
      }
      
      return Math.floor(date.getTime() / 1000);
    } catch (error) {
      console.error('Error converting timestamp:', error, timestampString);
      return NaN;
    }
  },

    processData(readings) {
      const sortedReadings = [...readings].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      const chartPoints = sortedReadings.map(reading => ({
        time: this.timestampToUnix(reading.timestamp),
        value: reading.voltage,
        originalTimestamp: reading.timestamp
      }))

      this.chartData = chartPoints.sort((a, b) => a.time - b.time)

      console.log('Processed chart data:', this.chartData)
    },

    startAutoUpdate() {
      this.autoUpdate = true
      this.fetchData();
      this.intervalId = setInterval(() => {
        this.fetchData()
      }, 5000)
    },

    stopAutoUpdate() {
      this.autoUpdate = false
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    },

    async fetchDataWithRange() {
      this.rangeLoading = true;
      this.error = null;

      try {
        const formattedStartDate = this.startDate.includes(' ') ? this.startDate : `${this.startDate} 00:00`;
        const formattedEndDate = this.endDate.includes(' ') ? this.endDate : `${this.endDate} 23:59`;
        
        // Aumentar/eliminar limit o implementar paginación
        const url = `${this.apiUrl}/${this.sensorId}/range?start_date=${encodeURIComponent(formattedStartDate)}&end_date=${encodeURIComponent(formattedEndDate)}&limit=10000`;
        
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP: ${response.status} - ${response.statusText}. Response: ${errorText}`);
        }

        const data = await response.json();

        if (data.readings && Array.isArray(data.readings)) {
          const processed = this.processReadingsForChart(data.readings);
          this.rangeChartData = processed;
          this.isOnline = true;
          this.showChart = processed.length > 0;
        } else if (data.readings === undefined) {
          this.rangeChartData = [];
          this.showChart = false;
        } else {
          throw new Error('Formato de datos inválido: la propiedad readings no es un array');
        }

      } catch (error) {
        console.error('Error fetching data with range:', error);
        this.error = `Error al obtener datos por rango: ${error.message}`;
        this.isOnline = false;
        this.rangeChartData = [];
        this.showChart = false;
      } finally {
        this.rangeLoading = false;
      }
    }

  }
}
</script>