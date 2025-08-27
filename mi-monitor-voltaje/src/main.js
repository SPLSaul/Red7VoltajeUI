import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import VueSidebarMenu from 'vue-sidebar-menu'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'

const app = createApp(App)

// Registra la librería de la barra lateral de forma global en tu aplicación.
// De esta manera, no necesitas importarla en cada componente que la use.
app.use(VueSidebarMenu)

// Monta la aplicación principal
app.mount('#app')
