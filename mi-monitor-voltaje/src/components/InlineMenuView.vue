<template>   
  <div class="more-info-card p-4">     
    <!-- Botón centrado con fondo transparente -->
    <div style="display: flex; justify-content: center; margin-bottom: 20px;">
      <button         
        @click="toggleExpand"         
        style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 6px; font-weight: 600; transition: all 0.3s ease;"
        class="hover:bg-white hover:bg-opacity-10 focus:outline-none"
        @mouseover="$event.target.style.borderColor='rgba(255,255,255,0.6)'"
        @mouseout="$event.target.style.borderColor='rgba(255,255,255,0.3)'"
      >         
        {{ isExpanded ? 'Menos info' : '...Más info' }}       
      </button>     
    </div>      

    <!-- Contenido expandible -->
    <transition name="fade">
      <div 
        v-if="isExpanded" 
        class="expanded-content w-full transition-all duration-500 ease-in-out mt-4" 
        style="margin-bottom: 40px;"
      >
        <!-- Voltaje más alto -->
        <div class="mb-4">
          <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mr-3">
            Voltaje más alto:
          </span>
          <span class="text-2xl font-bold text-green-500 dark:text-green-400">
            {{ maxVoltage !== null ? maxVoltage.toFixed(2) + ' V' : 'N/A' }}
          </span>
        </div>

        <!-- Voltaje más bajo -->
        <div class="mb-4">
          <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mr-3">
            Voltaje más bajo:
          </span>
          <span class="text-2xl font-bold text-red-500 dark:text-red-400">
            {{ minVoltage !== null ? minVoltage.toFixed(2) + ' V' : 'N/A' }}
          </span>
        </div>      
      </div>
    </transition>   
  </div> 
</template>  

<script> 
export default {   
  name: 'MoreInfo',   
  props: {     
    minVoltage: { type: Number, default: null },
    maxVoltage: { type: Number, default: null },
    activeTime: { type: String, default: null } // ⏱️ Nueva prop
  },   
  data() {     
    return { isExpanded: false };   
  },   
  methods: {     
    toggleExpand() {       
      this.isExpanded = !this.isExpanded;     
    }   
  } 
}; 
</script>

<style scoped>
/* Animación suave para mostrar/ocultar */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
