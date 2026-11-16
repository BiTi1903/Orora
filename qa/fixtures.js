import {expect} from '@playwright/test';
export async function mount(page,code,modules={}){
 for(const [path,body] of Object.entries(modules))await page.route(`**/src/${path}*`,route=>route.fulfill({contentType:'application/javascript',body}));
 await page.route('**/qa-ui',route=>route.fulfill({contentType:'text/html',body:`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">import {R,D,MemoryRouter} from '/qa/runtime.js';import '/src/App.css';import '/src/styles/admin.css';${code}</script>`}));
 await page.goto('/qa-ui');
}
export const render=element=>`D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,null,${element}));`;
export const fit=async page=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
export async function reveal(control){
 for(const details of await control.locator('xpath=ancestor::details').all()){
  if(!await details.evaluate(el=>el.open))await details.locator(':scope > summary').click();
 }
}
