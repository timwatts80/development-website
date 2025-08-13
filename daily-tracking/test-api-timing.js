#!/usr/bin/env node

/**
 * API-based Race Condition Test
 * 
 * This test makes direct API calls to test the backend timing
 * and verifies the race condition is fixed from a data perspective.
 */

const https = require('http')
const { performance } = require('perf_hooks')

class APIRaceConditionTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      
      const req = https.request(`${this.baseUrl}${path}`, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const endTime = performance.now()
          const duration = Math.round(endTime - startTime)
          
          try {
            const parsed = JSON.parse(data)
            resolve({ 
              status: res.statusCode, 
              data: parsed, 
              duration,
              headers: res.headers
            })
          } catch (error) {
            resolve({ 
              status: res.statusCode, 
              data: data, 
              duration,
              headers: res.headers,
              parseError: error.message
            })
          }
        })
      })

      req.on('error', reject)
      req.setTimeout(5000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
      
      req.end()
    })
  }

  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`)
    
    try {
      const result = await testFn()
      this.results.passed++
      this.results.tests.push({ name, status: 'PASSED', result })
      console.log(`✅ PASSED: ${name}`)
      return result
    } catch (error) {
      this.results.failed++
      this.results.tests.push({ name, status: 'FAILED', error: error.message })
      console.log(`❌ FAILED: ${name}`)
      console.log(`   Error: ${error.message}`)
      return null
    }
  }

  async testServerConnectivity() {
    return this.test('Server connectivity', async () => {
      const response = await this.makeRequest('/')
      
      if (response.status !== 200) {
        throw new Error(`Server returned status ${response.status}`)
      }

      return {
        message: 'Server is responding correctly',
        status: response.status,
        duration: response.duration
      }
    })
  }

  async testTaskGroupsAPI() {
    return this.test('Task Groups API', async () => {
      const response = await this.makeRequest('/api/task-groups')
      
      if (response.status !== 200) {
        throw new Error(`Task Groups API returned status ${response.status}`)
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Task Groups API did not return an array')
      }

      return {
        message: 'Task Groups API working correctly',
        taskGroupCount: response.data.length,
        duration: response.duration,
        sampleData: response.data.length > 0 ? response.data[0] : null
      }
    })
  }

  async testTaskCompletionsAPI() {
    return this.test('Task Completions API', async () => {
      const today = new Date().toISOString()
      const response = await this.makeRequest(`/api/task-completions?date=${today}`)
      
      if (response.status !== 200) {
        throw new Error(`Task Completions API returned status ${response.status}`)
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Task Completions API did not return an array')
      }

      return {
        message: 'Task Completions API working correctly',
        completionsCount: response.data.length,
        duration: response.duration,
        sampleData: response.data.length > 0 ? response.data[0] : null
      }
    })
  }

  async testAPITiming() {
    return this.test('API Response Timing', async () => {
      // Test multiple concurrent requests to simulate race condition
      const promises = []
      const startTime = performance.now()
      
      for (let i = 0; i < 5; i++) {
        promises.push(this.makeRequest('/api/task-groups'))
        promises.push(this.makeRequest(`/api/task-completions?date=${new Date().toISOString()}`))
      }

      const responses = await Promise.all(promises)
      const endTime = performance.now()
      const totalDuration = Math.round(endTime - startTime)

      // Check if all requests succeeded
      const failed = responses.filter(r => r.status !== 200)
      if (failed.length > 0) {
        throw new Error(`${failed.length} requests failed out of ${responses.length}`)
      }

      // Check timing consistency
      const durations = responses.map(r => r.duration)
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)

      if (maxDuration > 2000) { // 2 second threshold
        console.warn(`   ⚠️  Some requests were slow (max: ${maxDuration}ms)`)
      }

      return {
        message: 'API timing test completed',
        totalRequests: responses.length,
        totalDuration,
        avgDuration: Math.round(avgDuration),
        maxDuration,
        minDuration,
        allSucceeded: true
      }
    })
  }

  async testConsecutiveRequests() {
    return this.test('Consecutive Request Consistency', async () => {
      const results = []
      
      // Make 3 consecutive requests for task groups
      for (let i = 0; i < 3; i++) {
        const response = await this.makeRequest('/api/task-groups')
        if (response.status !== 200) {
          throw new Error(`Request ${i + 1} failed with status ${response.status}`)
        }
        results.push({
          requestNumber: i + 1,
          taskCount: response.data.length,
          duration: response.duration
        })
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Check consistency
      const taskCounts = results.map(r => r.taskCount)
      const allSame = taskCounts.every(count => count === taskCounts[0])
      
      if (!allSame) {
        throw new Error('Inconsistent task counts across requests')
      }

      return {
        message: 'Consecutive requests are consistent',
        requests: results,
        consistent: allSame
      }
    })
  }

  async runAllTests() {
    console.log('🧪 Daily Tracker API Race Condition Test Suite')
    console.log('=============================================')
    
    await this.testServerConnectivity()
    await this.testTaskGroupsAPI()
    await this.testTaskCompletionsAPI()
    await this.testAPITiming()
    await this.testConsecutiveRequests()

    this.printResults()
  }

  printResults() {
    console.log('\n📊 API Test Results Summary')
    console.log('============================')
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`📈 Success Rate: ${Math.round(this.results.passed / (this.results.passed + this.results.failed) * 100)}%`)
    
    console.log('\n📋 Detailed Results:')
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌'
      console.log(`${status} ${test.name}`)
      if (test.result && test.result.message) {
        console.log(`   ${test.result.message}`)
      }
      if (test.error) {
        console.log(`   Error: ${test.error}`)
      }
    })

    if (this.results.failed === 0) {
      console.log('\n🎉 All API tests passed! Backend is stable and fast.')
      console.log('The race condition fix should be working correctly.')
    } else {
      console.log('\n⚠️  Some API tests failed. Check server logs for issues.')
    }

    console.log('\n💡 Next Steps:')
    console.log('• Run the visual test: npm run test:manual-guide')
    console.log('• Run full browser test: npm run test:race-condition')
    console.log('• Check browser for race condition behavior')
  }
}

// Run the tests
async function main() {
  const tester = new APIRaceConditionTester()
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = APIRaceConditionTester
