import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './index.css'
import Print from './print.vue'

const app = createApp(Print)
app.use(ElementPlus)
app.mount('#app')
