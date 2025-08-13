#!/usr/bin/env node

/**
 * Test Script: Daily Tracker Initial Load Race Condition Fix
 * 
 * This script tests that completed tasks are loaded immediately on initial page load
 * without requiring a page reload to see the correct task status.
 * 
 * Test Scenarios:
 * 1. Fresh page load with existing completed tasks
 * 2. Navigation between dates with different completion states  
 * 3. Multiple rapid date changes to test race conditions
 * 4. Browser refresh behavior
 * 5. Network timing variations
 */

const puppeteer = require('puppeteer')
const { performance } = require('perf_hooks')

class DailyTrackerTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl
    this.browser = null
    this.page = null
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  async setup() {
    console.log('🚀 Setting up test environment...')
    this.browser = await puppeteer.launch({ 
      headless: false, // Show browser for visual confirmation
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    })
    this.page = await this.browser.newPage()
    
    // Enable console logging from the page
    this.page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('🔧')) {
        console.log('📊 Browser:', msg.text())
      }
    })

    // Monitor network requests
    this.page.on('response', (response) => {
      if (response.url().includes('/api/task-') && response.status() === 200) {
        console.log(`📡 API Response: ${response.url().split('/api/')[1]} (${response.status()})`)
      }
    })

    await this.page.goto(this.baseUrl)
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`)
    const startTime = performance.now()
    
    try {
      const result = await testFn()
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      this.results.passed++
      this.results.tests.push({ name, status: 'PASSED', duration, result })
      console.log(`✅ PASSED (${duration}ms): ${name}`)
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      this.results.failed++
      this.results.tests.push({ name, status: 'FAILED', duration, error: error.message })
      console.log(`❌ FAILED (${duration}ms): ${name}`)
      console.log(`   Error: ${error.message}`)
      return null
    }
  }

  async waitForElement(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout })
  }

  async waitForApiCalls() {
    // Wait for both task groups and task completions to load
    await new Promise(resolve => {
      let taskGroupsLoaded = false
      let taskCompletionsLoaded = false
      
      const checkComplete = () => {
        if (taskGroupsLoaded && taskCompletionsLoaded) {
          resolve()
        }
      }

      this.page.on('response', (response) => {
        if (response.url().includes('/api/task-groups')) {
          taskGroupsLoaded = true
          checkComplete()
        }
        if (response.url().includes('/api/task-completions')) {
          taskCompletionsLoaded = true
          checkComplete()
        }
      })

      // Fallback timeout
      setTimeout(resolve, 3000)
    })
  }

  async testInitialPageLoad() {
    return this.test('Initial page load shows correct task states', async () => {
      // Reload the page to test fresh load
      await this.page.reload({ waitUntil: 'networkidle2' })
      
      // Wait for the main content to load
      await this.waitForElement('[data-testid="task-group"], .task-group, .p-6', 10000)
      
      // Wait for API calls to complete
      await this.waitForApiCalls()
      
      // Give a small additional buffer for UI updates
      await this.page.waitForTimeout(1000)
      
      // Check if any tasks are present and their states
      const taskElements = await this.page.$$('[type="checkbox"]')
      
      if (taskElements.length === 0) {
        return { message: 'No tasks found on page', taskCount: 0 }
      }

      // Check that checkboxes have their states set (not indeterminate)
      const taskStates = await Promise.all(
        taskElements.map(async (element) => {
          const isChecked = await element.evaluate(el => el.checked)
          const isIndeterminate = await element.evaluate(el => el.indeterminate)
          return { checked: isChecked, indeterminate: isIndeterminate }
        })
      )

      const indeterminateCount = taskStates.filter(state => state.indeterminate).length
      
      if (indeterminateCount > 0) {
        throw new Error(`Found ${indeterminateCount} tasks in indeterminate state (not loaded)`)
      }

      return {
        message: 'All tasks have determined states on initial load',
        taskCount: taskElements.length,
        completedCount: taskStates.filter(state => state.checked).length,
        taskStates
      }
    })
  }

  async testDateNavigation() {
    return this.test('Date navigation loads completions immediately', async () => {
      // Get current date
      const currentDate = new Date().toISOString().split('T')[0]
      
      // Navigate to yesterday
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      // Click on date input and change date
      const dateInput = await this.page.$('input[type="date"]')
      if (!dateInput) {
        throw new Error('Date input not found')
      }

      await dateInput.click()
      await dateInput.evaluate((el, date) => {
        el.value = date
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }, yesterdayStr)

      // Wait for API calls after date change
      await this.waitForApiCalls()
      await this.page.waitForTimeout(500)

      // Check that tasks loaded immediately
      const taskElements = await this.page.$$('[type="checkbox"]')
      const taskStates = await Promise.all(
        taskElements.map(async (element) => {
          const isIndeterminate = await element.evaluate(el => el.indeterminate)
          return isIndeterminate
        })
      )

      const indeterminateCount = taskStates.filter(state => state).length
      
      if (indeterminateCount > 0) {
        throw new Error(`Found ${indeterminateCount} tasks still loading after date change`)
      }

      return {
        message: 'Date navigation completed successfully',
        taskCount: taskElements.length,
        indeterminateCount
      }
    })
  }

  async testRapidDateChanges() {
    return this.test('Rapid date changes handle race conditions properly', async () => {
      const dateInput = await this.page.$('input[type="date"]')
      if (!dateInput) {
        throw new Error('Date input not found')
      }

      const dates = []
      const baseDate = new Date()
      for (let i = 0; i < 5; i++) {
        const date = new Date(baseDate)
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }

      // Rapidly change dates
      for (const date of dates) {
        await dateInput.click()
        await dateInput.evaluate((el, dateStr) => {
          el.value = dateStr
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }, date)
        await this.page.waitForTimeout(200) // Small delay between changes
      }

      // Wait for all requests to settle
      await this.page.waitForTimeout(2000)
      await this.waitForApiCalls()

      // Check final state
      const taskElements = await this.page.$$('[type="checkbox"]')
      const indeterminateCount = await Promise.all(
        taskElements.map(async (element) => {
          return await element.evaluate(el => el.indeterminate)
        })
      ).then(states => states.filter(state => state).length)

      if (indeterminateCount > 0) {
        throw new Error(`Found ${indeterminateCount} tasks in indeterminate state after rapid changes`)
      }

      return {
        message: 'Rapid date changes handled correctly',
        datesChanged: dates.length,
        finalTaskCount: taskElements.length
      }
    })
  }

  async testTaskInteraction() {
    return this.test('Task completion state persists immediately', async () => {
      // Find the first uncompleted task
      const taskCheckboxes = await this.page.$$('[type="checkbox"]')
      
      if (taskCheckboxes.length === 0) {
        return { message: 'No tasks available for interaction test' }
      }

      let targetCheckbox = null
      let originalState = null

      for (const checkbox of taskCheckboxes) {
        const isChecked = await checkbox.evaluate(el => el.checked)
        if (!isChecked) {
          targetCheckbox = checkbox
          originalState = false
          break
        }
      }

      // If all tasks are completed, use the first one and toggle it off first
      if (!targetCheckbox) {
        targetCheckbox = taskCheckboxes[0]
        originalState = true
      }

      // Click the checkbox
      await targetCheckbox.click()
      
      // Wait a moment for the API call
      await this.page.waitForTimeout(500)
      
      // Verify the state changed
      const newState = await targetCheckbox.evaluate(el => el.checked)
      
      if (newState === originalState) {
        throw new Error('Task state did not change after click')
      }

      // Reload the page to test persistence
      await this.page.reload({ waitUntil: 'networkidle2' })
      await this.waitForApiCalls()
      await this.page.waitForTimeout(1000)

      // Find the same task and verify it maintained its state
      const reloadedCheckboxes = await this.page.$$('[type="checkbox"]')
      if (reloadedCheckboxes.length === 0) {
        throw new Error('No tasks found after reload')
      }

      // Check first checkbox state (assuming same order)
      const persistedState = await reloadedCheckboxes[0].evaluate(el => el.checked)
      
      if (persistedState !== newState) {
        throw new Error('Task state was not persisted after page reload')
      }

      return {
        message: 'Task interaction and persistence working correctly',
        originalState,
        newState,
        persistedState
      }
    })
  }

  async runAllTests() {
    console.log('🧪 Daily Tracker Race Condition Test Suite')
    console.log('==========================================')
    
    try {
      await this.setup()
      
      await this.testInitialPageLoad()
      await this.testDateNavigation()  
      await this.testRapidDateChanges()
      await this.testTaskInteraction()
      
    } finally {
      await this.teardown()
    }

    this.printResults()
  }

  printResults() {
    console.log('\n📊 Test Results Summary')
    console.log('=======================')
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`📈 Success Rate: ${Math.round(this.results.passed / (this.results.passed + this.results.failed) * 100)}%`)
    
    console.log('\n📋 Detailed Results:')
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌'
      console.log(`${status} ${test.name} (${test.duration}ms)`)
      if (test.result && test.result.message) {
        console.log(`   ${test.result.message}`)
      }
      if (test.error) {
        console.log(`   Error: ${test.error}`)
      }
    })

    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! Race condition fix is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. The race condition fix may need additional work.')
    }
  }
}

// Run the tests
async function main() {
  const tester = new DailyTrackerTester()
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = DailyTrackerTester
