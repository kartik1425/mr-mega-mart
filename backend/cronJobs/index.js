const cron = require('node-cron')
const setSearchTrends = require('./setSearchTrends')
const setBestOfWeekProducts = require('./setBestOfWeekProducts')
const setBestOfMonthProducts = require('./setBestOfMonthProducts')
const env = require('../config/env')
const { logger } = require('../services/logger')

const searchTrendsSchedule = env.CRON_SEARCH_TRENDS_SCHEDULE
const bestOfWeekSchedule = env.CRON_BEST_OF_WEEK_SCHEDULE
const bestOfMonthSchedule = env.CRON_BEST_OF_MONTH_SCHEDULE

cron.schedule(searchTrendsSchedule, async () => {
  const startTime = performance.now()
  logger.info({ event: 'cron_started', job: 'setSearchTrends', schedule: searchTrendsSchedule }, 'Starting cron job: setSearchTrends')
  try {
    await setSearchTrends()
    const durationMs = Math.round(performance.now() - startTime)
    logger.info({ event: 'cron_completed', job: 'setSearchTrends', durationMs }, `setSearchTrends completed successfully in ${durationMs}ms`)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger.error({ event: 'cron_failed', job: 'setSearchTrends', durationMs, error: error.message }, 'Error running setSearchTrends cron job')
  }
})

cron.schedule(bestOfWeekSchedule, async () => {
  const startTime = performance.now()
  logger.info({ event: 'cron_started', job: 'setBestOfWeekProducts', schedule: bestOfWeekSchedule }, 'Starting cron job: setBestOfWeekProducts')
  try {
    await setBestOfWeekProducts()
    const durationMs = Math.round(performance.now() - startTime)
    logger.info({ event: 'cron_completed', job: 'setBestOfWeekProducts', durationMs }, `setBestOfWeekProducts completed successfully in ${durationMs}ms`)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger.error({ event: 'cron_failed', job: 'setBestOfWeekProducts', durationMs, error: error.message }, 'Error running setBestOfWeekProducts cron job')
  }
})

cron.schedule(bestOfMonthSchedule, async () => {
  const startTime = performance.now()
  logger.info({ event: 'cron_started', job: 'setBestOfMonthProducts', schedule: bestOfMonthSchedule }, 'Starting cron job: setBestOfMonthProducts')
  try {
    await setBestOfMonthProducts()
    const durationMs = Math.round(performance.now() - startTime)
    logger.info({ event: 'cron_completed', job: 'setBestOfMonthProducts', durationMs }, `setBestOfMonthProducts completed successfully in ${durationMs}ms`)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger.error({ event: 'cron_failed', job: 'setBestOfMonthProducts', durationMs, error: error.message }, 'Error running setBestOfMonthProducts cron job')
  }
})