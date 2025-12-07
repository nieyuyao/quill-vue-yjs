import { createApp } from 'vue'
import AppVue from './App.vue'
import './reset.scss'
import 'element-plus/dist/index.css'
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import { ElLoading } from 'element-plus'

const app = createApp(AppVue)
app.directive('loading', ElLoading.directive)
app.mount('#app')


