import {test, expect} from '@playwright/test';
import {mount, render, fit} from './fixtures';

test('translation drafts survive paging and filtering', async ({page}) => {
  await page.route('**/*firebase_firestore.js*', route => route.fulfill({
    contentType:'application/javascript',
    body:`export const collection=()=>null,doc=()=>null,runTransaction=()=>null;
      export const getDocFromServer=async()=>({data:()=>({phraseOverrides:{example:{vi:"Cần tư vấn",en:"Need advice",ja:"ご相談"}}})});
      let reads=0;
      export const getDocsFromServer=async()=>{const prefix=++reads===1?'Sản phẩm ':'Mới ';return {docs:Array.from({length:12},(_,i)=>({id:String(i),data:()=>({name:prefix+i})}))}};`
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
  const reload = page.getByRole('button',{name:'Tải lại bản dịch',exact:true});
  page.once('dialog', dialog => dialog.dismiss());
  await reload.click();
  await expect(page.getByRole('textbox',{name:'Tiếng Anh',exact:true})).toHaveValue('First product');
  page.once('dialog', dialog => dialog.accept());
  await reload.click();
  await expect(page.getByRole('status')).toHaveText('Đã tải bản dịch mới nhất từ máy chủ.');
  await expect(items.first()).toContainText('Mới 0');
  await expect(page.getByRole('textbox',{name:'Tiếng Anh',exact:true})).toHaveValue('');
  await page.getByRole('button',{name:'Dịch theo cụm từ',exact:true}).click();
  await page.getByRole('searchbox',{name:'Tìm cụm từ'}).fill('can tu van');
  await expect(page.getByText('Need advice',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sửa',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Tiếng Anh',exact:true})).toHaveValue('Need advice');
  await fit(page);
});

test('published phrases match whole text and restore Vietnamese', async ({page}) => {
  await mount(page, `
    import {translateVisiblePhrases} from '/src/lib/phrase-overrides.js';
    const root = document.getElementById('root');
    root.innerHTML = '<p id="label">Cần tư vấn</p><p id="long">Cần tư vấn ngay</p>';
    window.restorePhrases = translateVisiblePhrases(root, {example:{vi:'Cần tư vấn',en:'Need advice'}}, 'en');
    setTimeout(() => root.insertAdjacentHTML('beforeend', '<p id="late">Cần tư vấn</p>'), 10);
  `);
  await expect(page.locator('#label')).toHaveText('Need advice');
  await expect(page.locator('#long')).toHaveText('Cần tư vấn ngay');
  await expect(page.locator('#late')).toHaveText('Need advice');
  await page.evaluate(() => window.restorePhrases());
  await expect(page.locator('#label')).toHaveText('Cần tư vấn');
  await expect(page.locator('#late')).toHaveText('Cần tư vấn');
});
