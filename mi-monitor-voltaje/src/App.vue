<template>
  <div class="container">
    <StatusHeader 
      :isOnline="isOnline"
      :sensorId="sensorId"
      :lastUpdate="lastUpdate"
    />
    


    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <VoltageChart 
      :chartData="chartData"
      :currentVoltage="currentVoltage"
      :loading="loading && !chartData.length"
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
    />

        <VoltageChart 
      :chartData="rangeChartData"
      :currentVoltage="null"
      :loading="loading && !rangeChartData.length"
        title="Voltaje filtrado por rango"

    />
    
    <!-- Componente del menú expandible -->
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
      error: null,
      lastUpdate: 'Nunca',
      isOnline: false,
      intervalId: null,
      targetTimezone: 'America/Los_Angeles',
      startDate: yesterday.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
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
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Los_Angeles' 
        }) + ' PDT'
      } catch (error) {
        console.error('Error formatting timestamp:', error)
        return 'Error en formato'
      }
    },

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
  this.rangeLoading = true; // Usar rangeLoading en lugar de loading general
  this.error = null;

  try {
    // Asegurar que las fechas tengan formato completo con hora
    const formattedStartDate = this.startDate.includes(' ') ? this.startDate : `${this.startDate} 00:00`;
    const formattedEndDate = this.endDate.includes(' ') ? this.endDate : `${this.endDate} 23:59`;
    
    // Codificar correctamente los parámetros
    const url = `${this.apiUrl}/${this.sensorId}/range?start_date=${encodeURIComponent(formattedStartDate)}&end_date=${encodeURIComponent(formattedEndDate)}&limit=100`;
    
    console.log('Fetching range data from:', url); // Para debugging
    
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' } 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}. Response: ${errorText}`);
    }

    const data = await response.json();
    console.log('Range data received:', data); // Para debugging

    if (data.readings && Array.isArray(data.readings)) {
      // Procesar datos correctamente
      this.rangeChartData = data.readings
        .map(r => ({
          time: this.timestampToUnix(r.timestamp),
          value: r.voltage,
          originalTimestamp: r.timestamp // Mantener para referencia
        }))
        .sort((a, b) => a.time - b.time); // Ordenar cronológicamente

      console.log('Processed range chart data:', this.rangeChartData);
      this.isOnline = true;
    } else if (data.readings === undefined) {
      // Si no hay datos pero la respuesta es válida
      this.rangeChartData = [];
      console.log('No readings found in the specified range');
    } else {
      throw new Error('Formato de datos inválido: la propiedad readings no es un array');
    }

  } catch (error) {
    console.error('Error fetching data with range:', error);
    this.error = `Error al obtener datos por rango: ${error.message}`;
    this.isOnline = false;
    
    // Limpiar datos en caso de error
    this.rangeChartData = [];
  } finally {
    this.rangeLoading = false;
  }
}
  }
}
</script>
```
