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
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-gray-800 mb-2"
        >
          <option value="" disabled>{{ loading ? 'Cargando sensores...' : 'Selecciona un sensor' }}</option>
          <option 
            v-for="sensor in sensors" 
            :key="sensor.sensor_id" 
            :value="sensor.sensor_id"
          >
            Sensor {{ sensor.sensor_id }} - {{ sensor.descripcion || sensor.sensor_type }} ({{ sensor.location }})
          </option>
          <option value="new" class="text-blue-600 font-semibold">
            + Agregar nuevo sensor
          </option>
        </select>

        <!-- Formulario para nuevo sensor (se muestra cuando se selecciona "Agregar nuevo sensor") -->
        <div v-if="showNewSensorForm" class="new-sensor-form bg-white p-3 rounded-lg shadow-md mt-2">
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Agregar Nuevo Sensor</h3>
          
          <div class="space-y-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Tipo de Sensor</label>
              <input
                v-model="newSensor.sensor_type"
                type="text"
                placeholder="Ej: ESP32, Medicion, etc."
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-xs text-gray-600 mb-1">Descripción</label>
              <input
                v-model="newSensor.description"
                type="text"
                placeholder="Ej: Testing, Medidor principal, etc."
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-xs text-gray-600 mb-1">Ubicación</label>
              <input
                v-model="newSensor.location"
                type="text"
                placeholder="Ej: Ucallz, Laboratorio, etc."
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Botones del formulario -->
          <div class="flex gap-2 mt-3">
            <button
              @click="createNewSensor"
              :disabled="creatingSensor"
              class="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {{ creatingSensor ? 'Creando...' : 'Crear Sensor' }}
            </button>
            <button
              @click="cancelNewSensor"
              class="flex-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
          </div>

          <!-- Mensaje de error/éxito -->
          <div v-if="newSensorMessage" :class="['text-xs mt-2 p-2 rounded', newSensorMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
            {{ newSensorMessage.text }}
          </div>
        </div>
        
        <!-- Mensaje de error general -->
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
      error: '',
      showNewSensorForm: false,
      creatingSensor: false,
      newSensor: {
        sensor_type: '',
        description: '',
        location: ''
      },
      newSensorMessage: null
    }
  },
  watch: {
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
      if (this.selectedSensor === 'new') {
        // Mostrar formulario para nuevo sensor
        this.showNewSensorForm = true
        this.newSensorMessage = null
      } else {
        // Sensor normal seleccionado
        this.showNewSensorForm = false
        this.newSensorMessage = null
        console.log('Sensor seleccionado:', this.selectedSensor)
        this.$emit('sensor-change', parseInt(this.selectedSensor))
      }
    },

    async createNewSensor() {
      // Validar campos requeridos
      if (!this.newSensor.sensor_type.trim() || !this.newSensor.description.trim() || !this.newSensor.location.trim()) {
        this.newSensorMessage = {
          type: 'error',
          text: 'Todos los campos son requeridos'
        }
        return
      }

      this.creatingSensor = true
      this.newSensorMessage = null

      try {
        const response = await axios.post(`${this.apiBaseUrl}/sensors`, {
          sensor_type: this.newSensor.sensor_type,
          description: this.newSensor.description,
          location: this.newSensor.location
        }, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })

        console.log('Nuevo sensor creado:', response.data)
        
        // Mostrar mensaje de éxito
        this.newSensorMessage = {
          type: 'success',
          text: `Sensor creado exitosamente! ID: ${response.data.sensor_id}`
        }

        // Limpiar formulario
        this.newSensor = {
          sensor_type: '',
          description: '',
          location: ''
        }

        // Recargar lista de sensores después de un breve delay
        setTimeout(() => {
          this.fetchSensors().then(() => {
            // Seleccionar el nuevo sensor automáticamente
            if (response.data.sensor_id) {
              this.selectedSensor = response.data.sensor_id
              this.showNewSensorForm = false
              this.$emit('sensor-change', response.data.sensor_id)
            }
          })
        }, 1500)

      } catch (err) {
        console.error('Error creando sensor:', err)
        this.newSensorMessage = {
          type: 'error',
          text: `Error al crear sensor: ${err.response?.data?.detail || err.message}`
        }
      } finally {
        this.creatingSensor = false
      }
    },

    cancelNewSensor() {
      this.showNewSensorForm = false
      this.newSensorMessage = null
      // Restaurar selección anterior o primera opción
      if (this.sensors.length > 0) {
        this.selectedSensor = this.sensors[0].sensor_id
      } else {
        this.selectedSensor = ''
      }
      this.newSensor = {
        sensor_type: '',
        description: '',
        location: ''
      }
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
  min-width: 300px;
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

.new-sensor-form {
  border: 1px solid #e2e8f0;
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

  .sensor-selector-container {
    min-width: 100%;
  }
}
</style>