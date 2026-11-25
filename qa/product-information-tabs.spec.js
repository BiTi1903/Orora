import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('product information shows just the selected tab with keyboard controls and editable admin labels',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await mount(page,`import Info from '/src/components/ProductInformation.jsx';import Settings from '/src/admin/builder/InformationTabsSettings.jsx';import Glass from '/src/components/MobileGlass.jsx';import '/src/styles/product-detail.css';function Fixture(){const [settings,setSettings]=R.useState({});return R.createElement(R.Fragment,null,R.createElement(Glass),R.createElement(Settings,{value:settings,onChange:patch=>setSettings(v=>({...v,...patch}))}),R.createElement('main',null,R.createElement(Info,{key:settings.defaultTab||'description',settings,sections:[{id:'d',group:'description',title:'Mô tả',content:'Mô tả sản phẩm đầy đủ.'},{id:'s',group:'specifications',title:'Thành phần',content:'Thông số sản phẩm riêng.'},{id:'u',group:'usage',title:'Hướng dẫn sử dụng',content:'Hướng dẫn dùng sản phẩm.'}],css:()=>({}),select:()=>()=>{},selectedClass:()=>''})))};${render('R.createElement(Fixture)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 const description=page.getByRole('tab',{name:'Mô tả',exact:true}),spec=page.getByRole('tab',{name:'Thông số',exact:true});
 await expect(description).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveCount(1);
 await expect(page.getByText('Thông số sản phẩm riêng.',{exact:true})).toBeHidden();
 await spec.click();await expect(page.getByRole('tabpanel')).toContainText('Thông số sản phẩm riêng.');await expect(page.getByText('Mô tả sản phẩm đầy đủ.',{exact:true})).toBeHidden();
 await spec.press('ArrowRight');await expect(page.getByRole('tab',{name:'Hướng dẫn sử dụng',exact:true})).toBeFocused();await expect(page.getByRole('tabpanel')).toContainText('Hướng dẫn dùng sản phẩm.');
 await page.getByRole('tab',{name:'Hướng dẫn sử dụng',exact:true}).press('Home');await expect(description).toBeFocused();await expect(page.getByRole('tabpanel')).toContainText('Mô tả sản phẩm đầy đủ.');
 await page.getByText('Nhãn tab và mục mở mặc định',{exact:true}).click();await page.getByLabel('Tên tab Mô tả',{exact:true}).fill('Giới thiệu');await expect(page.getByRole('tab',{name:'Giới thiệu',exact:true})).toBeVisible();
 await page.getByLabel('Tab mở mặc định',{exact:true}).selectOption('specifications');await expect(spec).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveCount(1);
 if(page.viewportSize().width<=768)await expect.poll(()=>page.locator('.product-information-nav').evaluate(el=>parseFloat(el.style.getPropertyValue('--tab-w')))).toBeGreaterThan(0);
 await fit(page);expect(errors).toEqual([]);
});

test('long ingredients span the grid and short facts stack cleanly on mobile',async({page})=>{
 const ingredients='Thành phần hoạt tính: '+ 'Chiết xuất thực vật, dưỡng ẩm và chăm sóc da. '.repeat(24);
 await mount(page,`import Info from '/src/components/ProductInformation.jsx';import '/src/styles/product-detail.css';import '/src/styles/product-detail-mobile.css';${render(`R.createElement('main',{className:'product-detail'},R.createElement(Info,{settings:{defaultTab:'specifications'},sections:[{id:'ingredients',group:'specifications',title:'Thành phần',content:${JSON.stringify(ingredients)}},{id:'size',group:'specifications',title:'Dung tích',content:'150 ml'},{id:'origin',group:'specifications',title:'Xuất xứ',content:'Nhật Bản'}],css:()=>({}),select:()=>()=>{},selectedClass:()=>''}))`)}`);
 const rows=page.locator('.product-detail-row');
 await expect(rows).toHaveCount(3);await expect(rows.first()).toContainText(ingredients);
 const bounds=await rows.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};}));
 const mobile=page.viewportSize().width<=768;
 if(mobile){expect(bounds[1].width).toBeCloseTo(bounds[0].width,0);expect(bounds[2].y).toBeGreaterThan(bounds[1].y);}
 else{expect(bounds[0].width).toBeGreaterThan(bounds[1].width*1.9);expect(bounds[1].y).toBeCloseTo(bounds[2].y,0);}
 const label=await rows.first().locator(':scope > span').boundingBox();const content=await rows.first().locator('.product-detail-value').boundingBox();expect(content.y).toBeGreaterThan(label.y+label.height);
 await expect(page.getByRole('button',{name:/Xem thêm|Thu gọn/})).toHaveCount(0);
 await fit(page);
});

test('product detail editor adds image blocks, applies text effects and hides individual tabs', async ({page}) => {
 await page.route('**/detail-image.svg', (route) => route.fulfill({
  contentType: 'image/svg+xml',
  body: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1280"><rect width="1920" height="1280" fill="pink"/></svg>',
 }));
 await mount(page,`
  import Info from '/src/components/ProductInformation.jsx';
  import Editor from '/src/admin/ProductInformationEditor.jsx';
  import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
  import {productInformationBlocks} from '/src/lib/product-content.js';
  import '/src/styles/product-detail.css';
  const block = group => ({id:crypto.randomUUID(),group,image:'',content:'',effect:'fade'});
  function Example() {
   const [sections,setSections]=R.useState(()=>['description','specifications','usage'].map(block));
   const [visibility,setVisibility]=R.useState({});
   return R.createElement('main',{className:'admin-main'},
    R.createElement(Editor,{sections,visibility,onChange:setSections,onVisibility:(group,value)=>setVisibility(old=>({...old,[group]:value})),onUpload:()=>{},newBlock:block}),
    R.createElement(Info,{sections:productInformationBlocks({detailSections:[{group:"description",content:"Nội dung cũ"},...sections]}),visibility,css:()=>({}),select:()=>()=>{},selectedClass:()=>''}));
  };
  ${render('R.createElement(ConfirmProvider,null,R.createElement(Example))')}`, {
   'lib/cloudinary.js':'export const cloudinaryConfigured=false;export const uploadImage=async()=>"";',
  });
 const editor = page.getByRole('region',{name:'Nội dung chi tiết sản phẩm'});
 const imageFields = editor.getByRole('textbox',{name:/Mô tả · Ảnh/});
 await expect(imageFields).toHaveCount(1);
 await imageFields.first().fill('/detail-image.svg');
 await editor.getByRole('button',{name:'+ Thêm mục · Mô tả',exact:true}).click();
 await expect(imageFields).toHaveCount(2);
 await imageFields.nth(1).fill('/detail-image.svg');
 await editor.getByText('Thêm chữ sau ảnh (tùy chọn)',{exact:true}).first().click();
 await editor.getByRole('textbox',{name:'Mô tả · Nội dung khối 1',exact:true}).fill('Chữ ngay sau ảnh thứ nhất.\\nDòng thứ hai.');
 await editor.getByRole('combobox',{name:'Hiệu ứng chữ',exact:true}).selectOption('rise');
 const panel = page.getByRole('tabpanel');
 const images = panel.locator('.product-information-image');
 await expect(images).toHaveCount(2);
 await images.first().scrollIntoViewIfNeeded();
 await expect(images.first()).toHaveAttribute('data-image-state','ready');
 await expect(images.first()).toHaveAttribute('data-revealed','true');
 await expect(panel.getByText('Nội dung cũ',{exact:true})).toHaveCount(0);
 await expect(panel.locator('[data-text-effect] br')).toHaveCount(1);
 await expect(panel.locator('[data-text-effect="rise"]')).toContainText('Chữ ngay sau ảnh thứ nhất.');
 const box = await images.first().boundingBox();
 expect(box.width / box.height).toBeCloseTo(1.5, 1);
 await editor.getByRole('button',{name:'Xem mục',exact:true}).first().click();
 const preview = page.getByRole('dialog',{name:'Xem mục · Mô tả'});
 await expect(preview.locator('img')).toBeVisible();
 await expect(preview).toContainText('Dòng thứ hai.');
 await preview.getByRole('button',{name:'Đóng cửa sổ'}).click();
 await editor.getByRole('button',{name:'Xóa mục',exact:true}).last().click();
 await page.getByRole('dialog',{name:'Xóa mục nội dung'}).getByRole('button',{name:'Xóa mục',exact:true}).click();
 await expect(images).toHaveCount(1);
 await editor.getByRole('switch',{name:'Hiển thị Mô tả'}).uncheck();
 await expect(page.getByRole('tab',{name:'Mô tả',exact:true})).toHaveCount(0);
 await expect(page.getByRole('tab',{name:'Thông số',exact:true})).toHaveAttribute('aria-selected','true');
 await editor.locator('summary').filter({hasText:/^Hướng dẫn sử dụng$/}).click();
 await expect(editor.getByRole('textbox',{name:'Hướng dẫn sử dụng · Ảnh 1'})).toBeVisible();
 await editor.getByRole('switch',{name:'Hiển thị Hướng dẫn sử dụng'}).uncheck();
 await editor.locator('summary').filter({hasText:/^Thông số$/}).click();
 await editor.getByRole('switch',{name:'Hiển thị Thông số'}).uncheck();
 await expect(page.getByRole('tablist')).toHaveCount(0);
 await fit(page);
});

test('block and caption switches, skeleton shimmer, and Visual Builder frame/motion settings work together', async ({ page }) => {
  let releaseImage;
  const imageGate = new Promise((resolve) => { releaseImage = resolve; });
  await page.route('**/slow-detail.svg', async (route) => {
    await imageGate;
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1280"><rect width="1920" height="1280" fill="#f7c6d8"/></svg>',
    });
  });

  await mount(page, `
    import Info from '/src/components/ProductInformation.jsx';
    import Editor from '/src/admin/ProductInformationEditor.jsx';
    import Settings from '/src/admin/builder/InformationTabsSettings.jsx';
    import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
    import '/src/styles/product-detail.css';
    const block = (group) => ({ id: crypto.randomUUID(), group, enabled: true, showText: true, image: '', imageAlt: '', title: '', content: '', effect: 'fade' });
    function Demo() {
      const [sections, setSections] = R.useState(() => [
        { id: 'd1', group: 'description', enabled: true, showText: true, image: '/slow-detail.svg', imageAlt: 'Ảnh 1', title: 'Chú thích mẫu', content: 'Nội dung chú thích.', effect: 'rise' },
        block('specifications'),
        block('usage'),
      ]);
      const [visibility, setVisibility] = R.useState({});
      const [settings, setSettings] = R.useState({});
      return R.createElement('main', { className: 'admin-main' },
        R.createElement(Settings, { value: settings, onChange: (patch) => setSettings((old) => ({ ...old, ...patch })) }),
        R.createElement(Editor, { sections, visibility, onChange: setSections, onVisibility: (group, value) => setVisibility((old) => ({ ...old, [group]: value })), onUpload: () => {}, newBlock: block }),
        R.createElement(Info, { sections, visibility, settings, css: () => ({}), select: () => () => {}, selectedClass: () => '' })
      );
    }
    ${render('R.createElement(ConfirmProvider, null, R.createElement(Demo))')}
  `, {
    'lib/cloudinary.js': 'export const cloudinaryConfigured=false;export const uploadImage=async()=>"";',
  });

  const infoRoot = page.locator('.product-information');
  const firstImage = infoRoot.locator('.product-information-image').first();
  await expect(infoRoot).toHaveAttribute('data-skeleton-effect', 'shimmer');
  await expect(infoRoot).toHaveAttribute('data-tab-transition', 'slide-up');
  await expect(firstImage).toHaveAttribute('data-image-state', 'loading');

  releaseImage();
  await expect(firstImage).toHaveAttribute('data-image-state', 'ready');

  const editor = page.getByRole('region', { name: 'Nội dung chi tiết sản phẩm' });
  await editor.getByText('Chỉnh chữ sau ảnh', { exact: true }).first().click();
  await editor.getByRole('switch', { name: 'Hiển thị chú thích khối 1' }).uncheck();
  await expect(infoRoot.getByText('Nội dung chú thích.')).toHaveCount(0);
  await expect(firstImage).toBeVisible();

  await editor.getByRole('switch', { name: 'Hiển thị mục 1' }).uncheck();
  await expect(infoRoot.locator('.product-information-image')).toHaveCount(0);
  await editor.getByRole('switch', { name: 'Hiển thị mục 1' }).check();
  await expect(infoRoot.locator('.product-information-image')).toHaveCount(1);

  await page.getByText('Khung ảnh nội dung', { exact: true }).click();
  await page.getByLabel('Bo góc ảnh (px)', { exact: true }).fill('24');
  await page.getByText('Hiệu ứng tải (Skeleton / Shimmer) & Chuyển cảnh', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Hiệu ứng tải ảnh (Skeleton)', exact: true }).selectOption('pulse');
  await page.getByRole('combobox', { name: 'Hiệu ứng chuyển tab', exact: true }).selectOption('fade');
  await expect(infoRoot).toHaveAttribute('data-skeleton-effect', 'pulse');
  await expect(infoRoot).toHaveAttribute('data-tab-transition', 'fade');
  const radius = await infoRoot.evaluate((el) => el.style.getPropertyValue('--info-img-radius'));
  expect(radius).toBe('24px');
  await fit(page);
});

