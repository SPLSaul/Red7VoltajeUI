<template>
  <div class="header">
    <h1>Monitor de Voltaje</h1>

    <div class="status-info">
      <!-- Estado de conexión -->
      <div class="status-item">
        <div :class="['status-dot', isOnline ? 'status-online' : 'status-offline']"></div>
        <span>{{ isOnline ? 'Conectado' : 'Desconectado' }}</span>
      </div>

      <!-- ID del sensor -->
      <div class="status-item sensor-selector-container">
        <label for="sensor-select" class="block text-xs font-medium text-white mb-1">
          Seleccionar Sensor
        </label>
        <select
          id="sensor-select"
          v-model="selectedSensor"
          @change="handleSensorChange"
          :disabled="loading"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-gray-800"
        >
          <option value="" disabled>{{ loading ? 'Cargando sensores...' : 'Selecciona un sensor' }}</option>
          <option 
            v-for="sensor in sensors" 
            :key="sensor.sensor_id" 
            :value="sensor.sensor_id"
          >
            Sensor {{ sensor.sensor_id }} - {{ sensor.descripcion || sensor.sensor_type }} ({{ sensor.location }})
          </option>
        </select>
        
        <!-- Mensaje de error -->
        <div v-if="error" class="text-red-300 text-xs mt-1">
          {{ error }}
        </div>
      </div>

      <!-- Última actualización -->
      <div class="status-item">
        <span>Última actualización: {{ lastUpdate }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StatusHeader',
  emits: ['sensor-change'],
  props: {
    isOnline: {
      type: Boolean,
      required: true
    },
    sensorId: {
      type: Number,
      required: true
    },
    lastUpdate: {
      type: String,
      required: true
    },
    apiBaseUrl: {
      type: String,
      default: 'http://192.166.0.254:8000/api/v1'
    }
  },
  data() {
    return {
      sensors: [],
      selectedSensor: this.sensorId,
      loading: false,
      error: ''
    }
  },
  watch: {
    // Actualizar selectedSensor cuando el prop sensorId cambie desde el padre
    sensorId(newVal) {
      if (newVal !== this.selectedSensor) {
        this.selectedSensor = newVal
      }
    }
  },
  methods: {
    async fetchSensors() {
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.get(`${this.apiBaseUrl}/sensor/sensores_info`, {
          headers: {
            'Accept': 'application/json'
          }
        })
        
        console.log('Sensores obtenidos:', response.data)
        this.sensors = response.data
        
        // Si el sensorId actual no está en la lista, seleccionar el primero
        const currentSensorExists = this.sensors.some(sensor => sensor.sensor_id === this.selectedSensor)
        if (!currentSensorExists && this.sensors.length > 0) {
          this.selectedSensor = this.sensors[0].sensor_id
          this.handleSensorChange()
        }
        
      } catch (err) {
        console.error('Error cargando sensores:', err)
        this.error = `Error al cargar sensores: ${err.response?.data?.detail || err.message}`
      } finally {
        this.loading = false
      }
    },
    
    handleSensorChange() {
      console.log('Sensor seleccionado:', this.selectedSensor)
      this.$emit('sensor-change', parseInt(this.selectedSensor))
    }
  },
  mounted() {
    this.fetchSensors()
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #2c3e50, #3498db);
  color: white;
  padding: 30px;
  text-align: center;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 300;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  min-width: 200px;
}

.sensor-selector-container {
  min-width: 250px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-online {
  background-color: #27ae60;
}

.status-offline {
  background-color: #e74c3c;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .status-info {
    justify-content: center;
    flex-direction: column;
  }

  .status-item {
    min-width: 100%;
  }
}
</style>