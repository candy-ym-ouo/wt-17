import { createApp } from 'vue'
import App from './App.vue'
import './styles/global.css'
import { runAllMigrations, getMigrationStatus } from '@/utils/migration'

try {
  const statusBefore = getMigrationStatus()
  const needsMigration = Object.values(statusBefore).some(s => s.needsUpgrade)
  
  if (needsMigration) {
    console.info('[Migration] Starting data migration...')
    const reports = runAllMigrations()
    
    if (reports.length > 0) {
      console.info(`[Migration] Completed ${reports.length} data migrations:`)
      reports.forEach(report => {
        if (report.migrated) {
          console.info(`  ✓ ${report.dataType}: v${report.fromVersion} → v${report.toVersion} (${report.duration.toFixed(2)}ms)`)
        }
      })
    } else {
      console.info('[Migration] All data is up to date.')
    }
  }
} catch (e) {
  console.error('[Migration] Failed to run migrations:', e)
}

createApp(App).mount('#app')
