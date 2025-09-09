<template>   
  <div class="more-info-card p-4">     
    <!-- Voltaje más alto -->     
    <div class="mb-4">       
      <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mr-3">         
        Voltaje más alto:       
      </span>       
      <span class="text-2xl font-bold text-green-500 dark:text-green-400">         
        {{ maxVoltage !== null ? maxVoltage.toFixed(2) + ' V' : 'N/A' }}       
      </span>     
    </div>      

    <!-- Voltaje más bajo a la izquierda y botón centrado -->     
    <div style="display: flex;margin-bottom: 40px; align-items: center; justify-content: center; position: relative; width: 100%;">              
      <!-- Texto a la izquierda usando inline-block -->       
      <span style="display: inline-block; position: absolute; left: 0;">         
        <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">           
          Voltaje más bajo:         
        </span>         
        <span class="text-2xl font-bold text-red-500 dark:text-red-400">           
          {{ minVoltage !== null ? minVoltage.toFixed(2) + ' V' : 'N/A' }}         
        </span>       
      </span>        

      <!-- Botón centrado con fondo transparente -->       
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
    <div v-if="isExpanded" class="expanded-content w-full transition-all duration-500 ease-in-out mt-4" style="margin-bottom: 40px;">       
      <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">         
        Información Adicional       
      </h2>       
      <p class="text-gray-600 dark:text-gray-400">         
        Aquí puedes mostrar análisis más detallados sobre los valores de voltaje.       
      </p>     
    </div>   
  </div> 
</template>  

<script> 
export default {   
  name: 'MoreInfo',   
  props: {     
    minVoltage: {       
      type: Number,       
      default: null     
    },     
    maxVoltage: {       
      type: Number,       
      default: null     
    }   
  },   
  data() {     
    return {       
      isExpanded: false     
    };   
  },   
  methods: {     
    toggleExpand() {       
      this.isExpanded = !this.isExpanded;     
    }   
  } 
}; 
</script>