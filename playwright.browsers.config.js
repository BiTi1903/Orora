import {defineConfig,devices} from '@playwright/test';
import base from './playwright.config.js';

// Focused browser-engine checks; the default config retains the full width matrix.
export default defineConfig({
 ...base,
 testMatch:[
  '**/safari-side-nav.spec.js','**/petals-icons.spec.js','**/button-press.spec.js','**/presentation-polish.spec.js','**/card-actions.spec.js','**/browser-adaptation.spec.js','**/mobile-nav-reveal.spec.js',
  '**/popup-motion.spec.js','**/cart-toggle.spec.js','**/tracking-layout.spec.js',
  '**/ui-efficiency.spec.js','**/responsive-cleanup.spec.js',
  '**/shopping.spec.js','**/editor-simplification.spec.js','**/admin-appearance.spec.js','**/builder-spacing.spec.js','**/tracking-navigation.spec.js',
 ],
 projects:[
  {name:'chromium-android',use:{...devices['Pixel 7'],browserName:'chromium',launchOptions:base.use.launchOptions}},
  {name:'webkit-ios',use:{...devices['iPhone 13'],browserName:'webkit',launchOptions:{}}},
  {name:'webkit-desktop',use:{browserName:'webkit',viewport:{width:1440,height:1000},launchOptions:{}}},
  {name:'firefox-desktop',use:{...devices['Desktop Firefox'],browserName:'firefox',viewport:{width:1440,height:1000},launchOptions:{}}},
 ],
});
