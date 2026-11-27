import {test, expect} from '@playwright/test';
import {mount, render, fit} from './fixtures';

test('translation drafts survive paging and filtering', async ({page}) => {
  await page.route('**/*firebase_firestore.js*', route => route.fulfill({
    contentType:'application/javascript',
    body:`export const collection=()=>null,doc=()=>null,runTransaction=()=>null;
      export const getDocFromServer=async()=>({data:()=>({})});
      export const getDocsFromServer=async()=>({docs:Array.from({length:12},(_,i)=>({id:String(i),data:()=>({name:'Sản phẩm '+i})}))});`
  }));
  await mount(page, `import Editor from '/src/admin/TranslationAdmin.jsx';${render("R.createElement(Editor)")}`, {
    'lib/firebase.js':'export const db={};'
  });
  const items = page.locator('.translation-row');
  await expect(items).toHaveCount(8);
  await items.first().click();
  await page.getByRole('textbox',{name:'Tiếng Anh',exact:true}).fill('First product');
  await page.getByRole('button',{name:'Sau',exact:true}).click();
  await expect(items).toHaveCount(4);
  await page.getByLabel('Lọc bản dịch').selectOption('changed');
  await expect(items).toHaveCount(1);
  await expect(page.getByRole('textbox',{name:'Tiếng Anh',exact:true})).toHaveValue('First product');
  await fit(page);
});
