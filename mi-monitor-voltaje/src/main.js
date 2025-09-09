import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import '@vuepic/vue-datepicker/dist/main.css'


const app = createApp(App)

// Registra la librería de la barra lateral de forma global en tu aplicación.
// De esta manera, no necesitas importarla en cada componente que la use.

// Monta la aplicación principal
app.mount('#app')
