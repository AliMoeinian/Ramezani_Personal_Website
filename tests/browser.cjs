const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path'); const output=path.resolve(__dirname,'../test-results'); fs.mkdirSync(output,{recursive:true});const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});await page.waitForTimeout(2000);
 assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.service-card:visible').count(),6);
 await page.locator('[data-filter="academic"]').click();assert.equal(await page.locator('.service-card:visible').count(),5);
 await page.locator('[data-filter="career"]').click();assert.equal(await page.locator('.service-card:visible').count(),3);
 await page.locator('[data-filter="all"]').click();
 await page.locator('.plant-button').click();await page.locator('.planted-flower:not([hidden])').first().waitFor({state:'visible'});assert.equal(await page.locator('.planted-flower:visible').count(),1);
 await page.locator('.booking-slot').first().click();assert.equal(await page.locator('.booking-summary:visible').count(),1);
 const href=await page.locator('.booking-telegram').getAttribute('href');assert.ok(href.startsWith('https://t.me/Elham_ramezni?text='));assert.ok(decodeURIComponent(href).includes('به وقت تهران'));
 await page.locator('.booking-slot').first().click();assert.equal(await page.locator('.booking-summary:visible').count(),0);
 await page.locator('.booking-week').nth(1).click();assert.equal(await page.locator('.booking-week[aria-pressed="true"]').innerText(),'هفته‌ی دوم');
 await page.locator('.booking-slot').first().click();await page.locator('.booking-week').nth(2).click();assert.equal(await page.locator('.booking-summary:visible').count(),0);
 await page.locator('#contact').scrollIntoViewIfNeeded();await page.waitForTimeout(800);assert.equal(await page.locator('.tree-art').getAttribute('data-stage'),'6');
 await page.locator('.tree-heart').click();assert.equal(await page.locator('.tree-message:visible').count(),1);
 const growth=await page.locator('#scene').evaluate(e=>+e.style.getPropertyValue('--growth'));await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(800);assert.ok(await page.locator('#scene').evaluate(e=>+e.style.getPropertyValue('--growth'))>=growth);
 await page.locator('.motion-toggle').click();assert.equal(await page.locator('html').getAttribute('data-motion'),'off');assert.equal(await page.locator('.guide:visible').count(),0);
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);await page.screenshot({path:path.join(output,'home-desktop.png'),fullPage:true});
 for(const width of [320,360,390,410,768,1024,1440]){
   await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});await page.waitForTimeout(100);
   const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(overflow.doc<=overflow.viewport+1,`Overflow at ${width}: ${JSON.stringify(overflow)}`);
   if(width<=410){await page.locator('.menu-toggle').click();assert.equal(await page.locator('dialog[open]').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);}
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:3000');await page.waitForTimeout(1800);await page.screenshot({path:path.join(output,'home-mobile.png')});
 await page.locator('.booking-slot').first().click();await page.waitForTimeout(200);await page.screenshot({path:path.join(output,'booking-mobile.png')});
 await page.goto('http://127.0.0.1:3000/career/#experience',{waitUntil:'networkidle'});assert.equal(await page.locator('#experience:visible .career-card').count(),9);assert.equal(await page.locator('.career-current:visible').count(),3);
 await page.locator('#tab-experience').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#tab-courses').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#courses:visible .career-card').count(),6);
 await page.keyboard.press('End');assert.equal(await page.locator('#projects:visible .career-card').count(),4);
 await page.keyboard.press('Home');assert.equal(await page.locator('#education:visible .career-card').count(),2);
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.career-card:visible').count(),21);await page.emulateMedia({media:'screen'});
 await page.setViewportSize({width:1440,height:1000});await page.locator('#tab-experience').click();await page.screenshot({path:path.join(output,'career-desktop.png'),fullPage:true});
 await page.goto('http://127.0.0.1:3000/404.html');assert.equal(await page.locator('.empty-page h1').innerText(),'به نظر راه رو گم کردیم');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:3000');assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
 assert.deepEqual(errors,[]);console.log('PASS: filters, flower planting, selection/clear/week changes, Telegram message, contact growth, irreversible growth, reduced motion, menu/Escape, résumé deep links/keyboard/print, 404, overflow at 7 widths. No browser errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
