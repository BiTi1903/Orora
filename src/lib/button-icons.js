export const BUTTON_ICON_TARGETS=[
 ['navDropdown','Navbar · Mở danh sách',false],['navExternal','Navbar · Liên kết ngoài'],['navMobileDropdown','Menu mobile · Mở danh sách',false],
 ['heroPrimary','Hero · Nút chính'],['productView','Thẻ sản phẩm · Nút Xem'],['productCart','Thẻ sản phẩm · Giỏ hàng',false],['navbarCart','Navbar · Giỏ hàng',false],
 ['consultation','Sản phẩm · Icon Tư vấn'],['consultationArrow','Sản phẩm · Mũi tên Tư vấn'],['orderNow','Sản phẩm · Icon Đặt hàng'],['orderArrow','Sản phẩm · Mũi tên Đặt hàng'],
 ['facebook','Sản phẩm · Facebook'],['tiktok','Sản phẩm · TikTok'],['trackingSubmit','Tra cứu · Nút tìm đơn'],['trackingContact','Tra cứu · Nút liên hệ'],
];
export const BUTTON_ICON_OPTIONS=[['default','Mặc định'],['none','Ẩn icon'],['arrow','Mũi tên phải'],['external','Mũi tên chéo'],['cart','Giỏ hàng'],['bag','Túi mua hàng'],['chat','Tư vấn'],['phone','Điện thoại'],['search','Tìm kiếm'],['heart','Trái tim'],['check','Dấu tích']];
export const BUTTON_ICON_PATHS={arrow:'M4 12h16m-6-6 6 6-6 6',external:'M5 19 19 5M5 5h14v14',cart:'M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01',bag:'M5 8h14l1 13H4ZM8 9V6a4 4 0 0 1 8 0v3',chat:'M21 11a9 9 0 0 1-9 9H4l-2 2V11a9.5 9.5 0 0 1 19 0ZM7 10h9M7 14h6',phone:'M6 3 3 6c0 8 7 15 15 15l3-3-6-4-2 2-5-5 2-2Z',search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',heart:'M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 1 10 8 16 7-6 13-11 8-16Z',check:'m4 12 5 5L20 6'};

export const BUTTON_ICON_DEFAULTS={
  "heroPrimary": {
    "text": "↗"
  },
  "trackingSubmit": {
    "text": "→"
  },
  "productView": {
    "props": {
      "className": "product-view-arrow",
      "width": "12",
      "height": "12",
      "viewBox": "0 0 16 16",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.6",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M4 12 12 4M4 4h8v8"
        }
      }
    ]
  },
  "productCart": {
    "props": {
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.7",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M3 3h2l3 12h10l3-9H6"
        }
      },
      {
        "tag": "circle",
        "props": {
          "cx": "9",
          "cy": "20",
          "r": "1.3"
        }
      },
      {
        "tag": "circle",
        "props": {
          "cx": "18",
          "cy": "20",
          "r": "1.3"
        }
      }
    ]
  },
  "consultation": {
    "props": {
      "width": "17",
      "height": "17",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.6",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z"
        }
      },
      {
        "tag": "path",
        "props": {
          "d": "M7 11h10M7 15h6"
        }
      }
    ]
  },
  "consultationArrow": {
    "props": {
      "width": "16",
      "height": "16",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.6",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M5 12h14m-5-5 5 5-5 5"
        }
      }
    ]
  },
  "orderNow": {
    "props": {
      "className": "purchase-bag",
      "width": "17",
      "height": "17",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.6",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M5 8h14l1 13H4L5 8Z"
        }
      },
      {
        "tag": "path",
        "props": {
          "d": "M8 9V6a4 4 0 0 1 8 0v3"
        }
      }
    ]
  },
  "orderArrow": {
    "props": {
      "width": "16",
      "height": "16",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.6",
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M5 12h14m-5-5 5 5-5 5"
        }
      }
    ]
  },
  "facebook": {
    "props": {
      "className": "purchase-channel-icon",
      "width": "17",
      "height": "17",
      "viewBox": "0 0 24 24",
      "fill": "currentColor",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8h1.9V2.4c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.4H7V13h2.7v9h3.8Z"
        }
      }
    ]
  },
  "tiktok": {
    "props": {
      "className": "purchase-channel-icon",
      "width": "17",
      "height": "17",
      "viewBox": "0 0 24 24",
      "fill": "currentColor",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M16 2h-3v13.4a3 3 0 1 1-2.5-3V9.3a6.1 6.1 0 1 0 5.5 6.1V8.3a8 8 0 0 0 5 1.7V7a5 5 0 0 1-5-5Z"
        }
      }
    ]
  },
  "navbarCart": {
    "props": {
      "width": "20",
      "height": "20",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.7",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01"
        }
      }
    ]
  },
  "trackingContact": {
    "props": {
      "aria-hidden": "true",
      "viewBox": "0 0 16 16",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.5"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M4 12 12 4M4 4h8v8"
        }
      }
    ]
  },
  "navDropdown": {
    "props": {
      "width": "12",
      "height": "12",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.8",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "m6 9 6 6 6-6"
        }
      }
    ]
  },
  "navExternal": {
    "props": {
      "width": "12",
      "height": "12",
      "viewBox": "0 0 16 16",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.5",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "M4 12 12 4M4 4h8v8"
        }
      }
    ]
  },
  "navMobileDropdown": {
    "props": {
      "width": "14",
      "height": "14",
      "viewBox": "0 0 24 24",
      "fill": "none",
      "stroke": "currentColor",
      "strokeWidth": "1.8",
      "aria-hidden": "true"
    },
    "shapes": [
      {
        "tag": "path",
        "props": {
          "d": "m6 9 6 6 6-6"
        }
      }
    ]
  }
};
