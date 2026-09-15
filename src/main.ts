import { createApp } from 'vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from './App.vue'
import './styles.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          background: '#F1F5F9',
          surface: '#FFFFFF',
          primary: '#1D4ED8',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
          text: '#0F172A',
          secondaryText: '#64748B',
          border: '#E2E8F0',
        },
      },
    },
  },
})

createApp(App).use(vuetify).mount('#app')
