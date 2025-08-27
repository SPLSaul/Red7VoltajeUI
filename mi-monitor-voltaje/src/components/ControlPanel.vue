<template>
  <div class="controls">
    <div class="control-group">
      <input 
        v-if="selectedEndpoint === 'external'" 
        :value="externalUrl"
        @input="$emit('update-external-url', $event.target.value)"
        placeholder="URL externa (ej: https://xxx.ngrok-free.app)"
        class="external-url-input"
      >
    </div>
  
  </div>
</template>

<script>
export default {
  name: 'ControlPanel',
  props: {
    selectedEndpoint: {
      type: String,
      required: true
    },
    externalUrl: {
      type: String,
      required: true
    },
    sensorId: {
      type: Number,
      required: true
    },
    autoUpdate: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    'update-endpoint',
    'update-external-url', 
    'update-sensor-id',
    'toggle-auto-update',
    'fetch-data'
  ]
}
</script>

<style scoped>
.controls {
  padding: 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
}

.control-group input, 
.control-group select {
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.control-group input:focus, 
.control-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.external-url-input {
  flex: 1;
  max-width: 400px;
}

.sensor-id-input {
  width: 100px;
}

@media (max-width: 768px) {
  .control-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group label {
    min-width: auto;
  }

  .external-url-input {
    max-width: none;
  }
}
</style>