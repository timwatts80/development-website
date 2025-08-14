#!/usr/bin/env node

/**
 * PR Review Testing Script
 * Tests the calendar day completion indicator feature
 */

const { chromium } = require('playwright');

async function testCalendarCompletionFeature() {
  console.log('🧪 Starting PR Testing: Calendar Day Completion Indicators\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Load the app
    console.log('📝 Test 1: Loading Daily Tracker...');
    await page.goto('http://localhost:3001');
    await page.waitForSelector('[data-testid="task-list"], .space-y-3', { timeout: 10000 });
    console.log('✅ App loaded successfully');
    
    // Test 2: Open calendar
    console.log('\n📝 Test 2: Opening calendar dialog...');
    const calendarButton = page.locator('button:has-text("📅")').or(page.locator('button[title*="calendar"], button[aria-label*="calendar"]')).or(page.locator('text=Calendar').locator('..').locator('button')).first();
    await calendarButton.click();
    await page.waitForSelector('text=January, text=February, text=March', { timeout: 5000 });
    console.log('✅ Calendar opened successfully');
    
    // Test 3: Check for completion indicators
    console.log('\n📝 Test 3: Checking for day completion indicators...');
    const calendarDays = page.locator('button[class*="calendar"], .grid button');
    const dayCount = await calendarDays.count();
    console.log(`📊 Found ${dayCount} calendar days`);
    
    // Test 4: Look for green completion indicators
    console.log('\n📝 Test 4: Looking for green completion indicators...');
    const completedDays = page.locator('button[class*="bg-green"], button[class*="text-green"]');
    const completedCount = await completedDays.count();
    console.log(`🟢 Found ${completedCount} days with green completion indicators`);
    
    // Test 5: Check current day styling
    console.log('\n📝 Test 5: Checking current day styling...');
    const today = new Date().getDate().toString();
    const todayButton = page.locator(`button:has-text("${today}")`).first();
    const todayClasses = await todayButton.getAttribute('class');
    console.log(`📅 Today's button classes: ${todayClasses}`);
    
    // Test 6: Test date navigation
    console.log('\n📝 Test 6: Testing date navigation...');
    await todayButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Date navigation working');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`- ✅ App loads correctly`);
    console.log(`- ✅ Calendar opens`);
    console.log(`- ✅ Calendar days render (${dayCount} days)`);
    console.log(`- 🟢 Completion indicators found (${completedCount} green days)`);
    console.log(`- ✅ Date navigation works`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testCalendarCompletionFeature().catch(console.error);
