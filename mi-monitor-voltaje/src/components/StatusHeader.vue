<template>
  <div class="header">
    <h1>Monitor de Voltaje</h1>
    <div class="status-info">
      <div class="status-item">
        <div :class="['status-dot', isOnline ? 'status-online' : 'status-offline']"></div>
        <span>{{ isOnline ? 'Conectado' : 'Desconectado' }}</span>
      </div>
      <div class="status-item">
        <span>Sensor: {{ sensorId }}</span>
      </div>
      <div class="status-item">
        <span>Última actualización: {{ lastUpdate }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatusHeader',
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
    }
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
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
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

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .status-info {
    justify-content: center;
  }
}
</style>