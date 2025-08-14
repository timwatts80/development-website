/**
 * Test script to verify calendar completion visualization
 * This script tests that the calendar shows completed days in green
 */

const puppeteer = require('puppeteer');

async function testCalendarCompletions() {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting calendar completion test...');
    
    // Navigate to the app
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded');
    
    // Wait for the app to fully load
    await page.waitForSelector('[data-testid="task-list"]', { timeout: 10000 });
    console.log('✅ App fully loaded');
    
    // Create a task group for testing
    console.log('📝 Creating test task group...');
    await page.click('button:has-text("Create Task Group")');
    await page.waitForSelector('input[placeholder="Enter task group name"]');
    
    // Fill in task group details
    await page.fill('input[placeholder="Enter task group name"]', 'Calendar Test Tasks');
    await page.fill('input[placeholder="7"]', '3'); // 3 days duration
    await page.fill('textarea[placeholder="Add tasks (one per line)"]', 'Test Task 1\nTest Task 2\nTest Task 3');
    
    // Create the group
    await page.click('button:has-text("Create Task Group")');
    await page.waitForTimeout(1000);
    console.log('✅ Task group created');
    
    // Complete all tasks for today
    console.log('📋 Completing all tasks for today...');
    const taskCheckboxes = await page.$$('[data-testid="task-checkbox"]');
    for (let checkbox of taskCheckboxes) {
      await checkbox.click();
      await page.waitForTimeout(500); // Wait for API call
    }
    console.log('✅ All tasks completed for today');
    
    // Open calendar
    console.log('📅 Opening calendar...');
    await page.click('button:has-text("Calendar")');
    await page.waitForSelector('[data-testid="calendar-dialog"]', { timeout: 5000 });
    console.log('✅ Calendar opened');
    
    // Check if today's date has green background
    const today = new Date();
    const todayButton = await page.$(`button[data-date="${today.toISOString().split('T')[0]}"]`);
    
    if (todayButton) {
      const bgColor = await page.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      }, todayButton);
      
      console.log('🎨 Today\'s button background color:', bgColor);
      
      // Check if the color is green (various green representations)
      const isGreen = bgColor.includes('rgb(34, 197, 94)') || // green-500
                     bgColor.includes('rgb(16, 185, 129)') || // emerald-500  
                     bgColor.includes('green') ||
                     bgColor.includes('22, 163, 74'); // green-600
      
      if (isGreen) {
        console.log('✅ SUCCESS: Today\'s completed day is shown in green!');
      } else {
        console.log('❌ FAIL: Today\'s completed day is not green. Color:', bgColor);
      }
    } else {
      console.log('❌ FAIL: Could not find today\'s date button in calendar');
    }
    
    // Test navigation to previous month and back
    console.log('🔄 Testing month navigation...');
    await page.click('[data-testid="prev-month"]');
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to previous month');
    
    await page.click('[data-testid="next-month"]');
    await page.waitForTimeout(1000);
    console.log('✅ Navigated back to current month');
    
    // Verify today is still green after navigation
    const todayButtonAfterNav = await page.$(`button[data-date="${today.toISOString().split('T')[0]}"]`);
    if (todayButtonAfterNav) {
      const bgColorAfterNav = await page.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      }, todayButtonAfterNav);
      
      const isGreenAfterNav = bgColorAfterNav.includes('rgb(34, 197, 94)') ||
                             bgColorAfterNav.includes('rgb(16, 185, 129)') ||
                             bgColorAfterNav.includes('green') ||
                             bgColorAfterNav.includes('22, 163, 74');
      
      if (isGreenAfterNav) {
        console.log('✅ SUCCESS: Today\'s completed day remains green after navigation!');
      } else {
        console.log('❌ FAIL: Today\'s completed day lost green color after navigation');
      }
    }
    
    console.log('🎉 Calendar completion test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCalendarCompletions().catch(console.error);
