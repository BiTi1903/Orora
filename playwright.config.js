import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
export default defineConfig({
 testDir:'./qa',fullyParallel:true,workers:2,timeout:30000,expect:{timeout:8000},
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:5173',browserName:'chromium',launchOptions:{executablePath},trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[320,390,768,1440].map(width=>({name:`width-${width}`,use:{viewport:{width,height:1000}}})),
 webServer:{command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI,timeout:30000},
});
