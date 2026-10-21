# CatWeb Assets & Component Library (v2.18.3.1)

## Overview

This library provides confirmed, production-ready resources for CatWeb website creators and AI assistants:
- **84 Verified UI Icons** (pre-uploaded Lucide icons with valid Roblox asset IDs)
- **8 Verified UI Audio Assets** (one-shot clicks, chimes, buzzes, and swooshes)
- **Reusable Interactive UI Patterns** (animated toggle switch, tab bar, modal, responsive header, glass panel)
- **Anti-Filter String Decoder System** (character code mapping and drop-in decoder script to prevent `######` text tagging)

---

## 1. Icon Library (84 Verified Lucide Icons)

All icons are 256×256px, pure white (`#ffffff`), 2px stroke, with rounded caps.

### How to Use Icons
Place an `ImageLabel` with `image_id` (numeric string), `image_color` for tinting, and `background_transparency: "1"`.
- **Inline / button icon:** `size: "{0,16},{0,16}"`
- **Standard UI icon:** `size: "{0,24},{0,24}"`
- **Card / feature badge:** `size: "{0,32},{0,32}"`
- **Tint:** white on dark (`#ffffff`), dark on light (`#1a1a1a`), muted (`#888888`), or the page accent.
- **Icon + text:** put both in a horizontal `UIListLayout`, each with `size: "auto"`.
- **Never invent an icon ID.** If you need one that isn't listed, ask for the asset ID.

```json
{
  "class": "ImageLabel",
  "globalid": "ic1",
  "alias": "search_icon",
  "size": "{0,20},{0,20}",
  "position": "{0,0},{0,0}",
  "image_id": "76297972789266",
  "image": "rbxassetid://76297972789266",
  "image_color": "#9ca3af",
  "scale_type": "Fit",
  "background_transparency": "1"
}
```

### Verified Icon Directory

| # | Name | Asset ID | Common Uses |
|---|---|---|---|
| 1 | `house` | `128490289676597` | Home, navbar brand, dashboard |
| 2 | `search` | `76297972789266` | Search bar, find, lookup |
| 3 | `user-round` | `117017076630548` | Profile, account, login |
| 4 | `settings` | `123045282429289` | Settings, preferences, configuration |
| 5 | `mail` | `114078871101444` | Contact, email, inbox |
| 6 | `star` | `73775766036081` | Ratings, bookmarks, favorites |
| 7 | `heart` | `81821025513215` | Like, wishlist, favorites |
| 8 | `arrow-left` | `132053311021067` | Back, previous page |
| 9 | `arrow-right` | `86341424256591` | Next, continue, CTA button suffix |
| 10 | `plus` | `128762341789893` | Add item, create, expand |
| 11 | `x` | `97241930499310` | Close modal, dismiss, delete |
| 12 | `pencil` | `76098741870595` | Edit post, write, rename |
| 13 | `trash` | `106229864631841` | Delete, remove, trash |
| 14 | `download` | `111132539535750` | Download, export file |
| 15 | `upload` | `92547022320190` | Upload, import, submit media |
| 16 | `link` | `128161995104832` | Hyperlink, copy URL, share |
| 17 | `info` | `132978996034921` | Tooltip indicator, info card |
| 18 | `triangle-alert` | `101044232164905` | Warning badge, alert banner |
| 19 | `grid-2x2` | `133463448364347` | Grid view toggle, app launcher |
| 20 | `bell` | `130734329855948` | Notifications, alerts |
| 21 | `bell-off` | `131313860737094` | Muted notifications, silent |
| 22 | `menu` | `84352806499655` | Hamburger menu toggle for mobile |
| 23 | `check` | `99802726511524` | Success mark, completed task |
| 24 | `chevron-down` | `87080095544609` | Dropdown toggle, accordion open |
| 25 | `chevron-up` | `96573229929402` | Collapse accordion, scroll to top |
| 26 | `clock` | `82968254856227` | Duration, timestamp, schedule |
| 27 | `calendar` | `123093358000872` | Date picker, events, deadlines |
| 28 | `eye` | `88997485015923` | View counter, reveal password |
| 29 | `eye-off` | `139554241318642` | Hide password, private mode |
| 30 | `lock` | `99601667182985` | Security, password-protected, locked |
| 31 | `lock-open` | `128013412438498` | Unlocked, public access |
| 32 | `share-2` | `114039748228833` | Share sheet, social media |
| 33 | `external-link` | `122444800533384` | External outbound URL indicator |
| 34 | `copy` | `130977740797889` | Copy code/text to clipboard |
| 35 | `rotate-cw` | `103831305015789` | Refresh, reload, retry action |
| 36 | `funnel` | `91180148376757` | Filter list, data sorting |
| 37 | `list-sort-ascending` | `132178203048228` | Sort A → Z, lowest to highest |
| 38 | `list-sort-descending` | `96229858716187` | Sort Z → A, highest to lowest |
| 39 | `arrow-up-right` | `118136232094518` | Directional link, popout |
| 40 | `loader` | `100424218947821` | Loading indicator |
| 41 | `loader-circle` | `81239384648948` | Circular loading spinner |
| 42 | `ellipsis-vertical` | `81626897936532` | 3-dot overflow menu (vertical) |
| 43 | `ellipsis` | `139825203386447` | 3-dot overflow menu (horizontal) |
| 44 | `bookmark` | `92628008144421` | Save reading list, bookmark |
| 45 | `message-circle` | `74178575771264` | Chat, comments, discussion |
| 46 | `volume-2` | `103516276905873` | Sound enabled, volume controls |
| 47 | `sun` | `80788164629601` | Light mode toggle |
| 48 | `moon` | `124700849271660` | Dark mode toggle |
| 49 | `zap` | `98819316845453` | Fast action, power, premium badge |
| 50 | `map` | `92300540805299` | Map overview, navigation |
| 51 | `map-pin` | `116471861153777` | Location pin, address |
| 52 | `phone` | `133427066456170` | Contact phone, support line |
| 53 | `folder` | `93755286057513` | Directory, file manager |
| 54 | `shopping-bag` | `110888789046931` | Shop, merchandise, store |
| 55 | `store` | `76740445213011` | Marketplace, shop storefront |
| 56 | `users-round` | `103128988356985` | Team, community, members |
| 57 | `layers` | `80429653768693` | Layers, version history, stack |
| 58 | `layout-grid` | `94828998904657` | Dashboard, workspace overview |
| 59 | `wallet` | `100717817674057` | Currency, balance, wallet |
| 60 | `megaphone` | `105447664594265` | Announcements, banner alert |
| 61 | `image` | `76478225596850` | Media upload, photo placeholder |
| 62 | `shopping-cart` | `117074905498023` | Shopping cart, checkout |
| 63 | `send` | `118501485251954` | Submit form, send message |
| 64 | `shield-check` | `116015031695975` | Verified security, protection |
| 65 | `play` | `100984531058540` | Video playback, demo start |
| 66 | `globe` | `132473860015433` | Internationalization, website URL |
| 67 | `badge-check` | `75364661852335` | Official verified badge |
| 68 | `list` | `126181252830019` | List format, tasks, menu |
| 69 | `refresh-cw` | `122404692422803` | Sync state, reload |
| 70 | `save` | `139830175443527` | Save progress, commit changes |
| 71 | `sliders-horizontal` | `100952596126070` | Advanced filter / controls |
| 72 | `trending-up` | `117604461413371` | Analytics increase, positive trend |
| 73 | `lightbulb` | `114237527539643` | Tips, insights, inspiration |
| 74 | `history` | `132539284401125` | Recent activity, log |
| 75 | `file` | `119100927707815` | Document, single file |
| 76 | `brain` | `110674321553035` | AI, intelligence, logic |
| 77 | `credit-card` | `122689283993405` | Payments, billing, subscriptions |
| 78 | `shield` | `132071632855830` | Privacy, safety |
| 79 | `minus` | `137413491041285` | Minimize, decrement, collapse |
| 80 | `dot` | `115463795068023` | Online status indicator, bullet |
| 81 | `camera` | `90172905139857` | Snapshot, photo capture |
| 82 | `package` | `82366494295497` | Inventory, package, bundle |
| 83 | `flame` | `136802848902260` | Popular, hot, streak |
| 84 | `ban` | `134524065816559` | Blocked, restricted, disabled |

---

## 2. Sound Library (8 Verified UI Audio Assets)

Pre-uploaded Roblox audio assets for interface interactions.
- Trigger using Action `5 Play audio` or `26 Play looped audio`.
- Capture the audio handle in a variable to control volume (`73`), pause (`75`), or stop (`74`).
- Global concurrent sound limit: 150 sounds.

| # | Name | Asset ID | Nominal Length | Intended Feedback |
|---|---|---|---|---|
| 1 | `click` | `88442833509532` | 0:00 | Button tap, general click |
| 2 | `hover` | `107511012621133` | 0:00 | Mouse hover over button/card |
| 3 | `toggle` | `94316899429786` | 0:00 | Toggle switch, checkbox toggle |
| 4 | `success` | `136211732441165` | 0:02 | Action completed, form submission |
| 5 | `error` | `131661013076677` | 0:00 | Validation error, blocked action |
| 6 | `notification` | `131039887376992` | 0:00 | Toast alert, incoming message |
| 7 | `send` | `5485567028` | 0:00 | Message sent, prompt dispatched |
| 8 | `transition` | `119137729729534` | 0:01 | Tab switch, view whoosh |

Lengths of `0:00` mean the clip is under a second, not that it's empty. These are the only confirmed sound IDs; never invent others.

**Wiring:** `click` / `toggle` on `When <button> pressed` (`1`), `hover` on `When mouse enters` (`3`), `success` / `error` in the branches after `When <input> submitted` (`8`), `notification` on `When message received` (`9`), `send` on submit, `transition` before a `Redirect` (`4`) or view swap. For rapid-fire feedback (a click per keystroke), reuse one handle instead of spawning a new sound each time.

### Play Audio Example
```json
{
  "id": "5",
  "globalid": "s1",
  "text": [
    "Play audio (click)",
    {"value": "88442833509532", "t": "string", "l": "id", "assetbrowser": "audio"},
    "→ ({o!sfx})",
    {"value": "o!sfx", "t": "string", "l": "variable?"}
  ]
}
```

---

## 3. Reusable Interactive UI Patterns

### Pattern 1: Animated Toggle Switch
A clickable toggle switch track with a knob that slides between off and on states.

```json
{
  "class": "TextButton",
  "globalid": "t1",
  "alias": "toggle_track",
  "size": "{0,48},{0,26}",
  "position": "{0,0},{0,0}",
  "background_color": "#3f3f46",
  "text": "",
  "auto_color": "false",
  "children": [
    { "class": "UICorner", "globalid": "t2", "radius": "1,0" },
    {
      "class": "Frame",
      "globalid": "ta",
      "alias": "toggle_knob",
      "size": "{0,20},{0,20}",
      "position": "{0,3},{0.5,0}",
      "anchor": "0,0.5",
      "background_color": "#ffffff",
      "children": [
        { "class": "UICorner", "globalid": "t9", "radius": "1,0" }
      ]
    },
    {
      "class": "script",
      "globalid": "td",
      "alias": "toggle_script",
      "enabled": "true",
      "content": [
        {
          "id": "1",
          "globalid": "t3",
          "x": "5000", "y": "5000", "width": "350",
          "text": ["When", {"value":"t1","t":"object","l":"button"}, "pressed..."],
          "actions": [
            {
              "id": "18",
              "globalid": "t8",
              "text": ["If", {"value":"o!on","t":"string","l":"any"}, "is equal to", {"value":"1","t":"string","l":"any"}]
            },
            {
              "id": "11",
              "globalid": "tb",
              "text": ["Set", {"value":"o!on","t":"string","l":"variable"}, "to", {"value":"0","t":"string","l":"any"}]
            },
            {
              "id": "88",
              "globalid": "te",
              "text": ["Tween", {"value":"Position","t":"string","l":"property"}, "of", {"value":"ta","t":"object"}, "to", {"value":"{0,3},{0.5,0}","t":"any"}, "-", {"value":"0.2","t":"number","l":"time"}, {"value":"Quad","t":"string","l":"style"}, {"value":"Out","t":"string","l":"direction"}]
            },
            {
              "id": "31",
              "globalid": "t4",
              "text": ["Set", {"value":"Background Color","t":"string","l":"property"}, "of", {"value":"t1","t":"object"}, "to", {"value":"#3f3f46","t":"any"}]
            },
            {
              "id": "112",
              "globalid": "t6",
              "text": ["else"]
            },
            {
              "id": "11",
              "globalid": "tc",
              "text": ["Set", {"value":"o!on","t":"string","l":"variable"}, "to", {"value":"1","t":"string","l":"any"}]
            },
            {
              "id": "88",
              "globalid": "tf",
              "text": ["Tween", {"value":"Position","t":"string","l":"property"}, "of", {"value":"ta","t":"object"}, "to", {"value":"{1,-23},{0.5,0}","t":"any"}, "-", {"value":"0.2","t":"number","l":"time"}, {"value":"Quad","t":"string","l":"style"}, {"value":"Out","t":"string","l":"direction"}]
            },
            {
              "id": "31",
              "globalid": "t5",
              "text": ["Set", {"value":"Background Color","t":"string","l":"property"}, "of", {"value":"t1","t":"object"}, "to", {"value":"#2563eb","t":"any"}]
            },
            {
              "id": "25",
              "globalid": "t7",
              "text": ["end"]
            }
          ]
        }
      ]
    }
  ]
}
```

---

### Pattern 2: Tab Bar / View Switcher
Switches visibility between Tab Panel 1 and Tab Panel 2 on button press.

```json
{
  "class": "Frame",
  "globalid": "bd",
  "size": "{1,0},{0,300}",
  "position": "{0,0},{0,0}",
  "background_transparency": "1",
  "children": [
    {
      "class": "Frame",
      "globalid": "b7",
      "size": "{1,0},{0,44}",
      "position": "{0,0},{0,0}",
      "background_transparency": "1",
      "children": [
        { "class": "UIListLayout", "globalid": "ba", "direction": "Horizontal", "padding": "0,8", "sort": "LayoutOrder" },
        { "class": "TextButton", "globalid": "b5", "order": "1", "size": "{0,120},{1,0}", "text": "Overview", "font": "GothamBold", "font_size": "14", "font_color": "#ffffff", "background_color": "#27272a" },
        { "class": "TextButton", "globalid": "b6", "order": "2", "size": "{0,120},{1,0}", "text": "Settings", "font": "GothamBold", "font_size": "14", "font_color": "#71717a", "background_color": "#18181b" }
      ]
    },
    {
      "class": "Frame",
      "globalid": "bb",
      "alias": "panel_overview",
      "size": "{1,0},{1,-52}",
      "position": "{0,0},{0,52}",
      "background_color": "#18181b",
      "visible": "true",
      "children": []
    },
    {
      "class": "Frame",
      "globalid": "bc",
      "alias": "panel_settings",
      "size": "{1,0},{1,-52}",
      "position": "{0,0},{0,52}",
      "background_color": "#18181b",
      "visible": "false",
      "children": []
    },
    {
      "class": "script",
      "globalid": "be",
      "alias": "tab_controller",
      "enabled": "true",
      "content": [
        {
          "id": "1",
          "globalid": "b8",
          "x": "4900", "y": "5000", "width": "350",
          "text": ["When", {"value":"b5","t":"object","l":"button"}, "pressed..."],
          "actions": [
            { "id": "9", "globalid": "a1", "text": ["Make", {"value":"bb","t":"object"}, "visible"] },
            { "id": "8", "globalid": "a2", "text": ["Make", {"value":"bc","t":"object"}, "invisible"] },
            { "id": "31", "globalid": "a3", "text": ["Set", {"value":"Text Color","t":"string","l":"property"}, "of", {"value":"b5","t":"object"}, "to", {"value":"#ffffff","t":"any"}] },
            { "id": "31", "globalid": "a4", "text": ["Set", {"value":"Text Color","t":"string","l":"property"}, "of", {"value":"b6","t":"object"}, "to", {"value":"#71717a","t":"any"}] }
          ]
        },
        {
          "id": "1",
          "globalid": "b9",
          "x": "5300", "y": "5000", "width": "350",
          "text": ["When", {"value":"b6","t":"object","l":"button"}, "pressed..."],
          "actions": [
            { "id": "8", "globalid": "b1", "text": ["Make", {"value":"bb","t":"object"}, "invisible"] },
            { "id": "9", "globalid": "b2", "text": ["Make", {"value":"bc","t":"object"}, "visible"] },
            { "id": "31", "globalid": "b3", "text": ["Set", {"value":"Text Color","t":"string","l":"property"}, "of", {"value":"b5","t":"object"}, "to", {"value":"#71717a","t":"any"}] },
            { "id": "31", "globalid": "b4", "text": ["Set", {"value":"Text Color","t":"string","l":"property"}, "of", {"value":"b6","t":"object"}, "to", {"value":"#ffffff","t":"any"}] }
          ]
        }
      ]
    }
  ]
}
```

---

### Pattern 3: Modal Dialog (Popup with Dark Backdrop)
An overlay covering the whole viewport with a centered modal card, opened and closed by buttons.

```json
{
  "class": "Frame",
  "globalid": "m4",
  "alias": "modal_overlay",
  "size": "{1,0},{1,0}",
  "position": "{0,0},{0,0}",
  "background_color": "#000000",
  "background_transparency": "0.6",
  "visible": "false",
  "z_index": "50",
  "children": [
    {
      "class": "Frame",
      "globalid": "m1",
      "alias": "modal_card",
      "size": "{0,440},{0,240}",
      "position": "{0.5,0},{0.5,0}",
      "anchor": "0.5,0.5",
      "background_color": "#18181b",
      "children": [
        { "class": "UICorner", "globalid": "m2", "radius": "0,16" },
        { "class": "UIStroke", "globalid": "m5", "stroke_color": "#27272a", "stroke_thickness": "1" },
        {
          "class": "TextLabel",
          "globalid": "m6",
          "size": "{1,-64},{0,32}",
          "position": "{0,24},{0,20}",
          "text": "Modal Title",
          "font": "GothamBold",
          "font_size": "18",
          "font_color": "#ffffff",
          "align_x": "Left",
          "align_y": "Center",
          "background_transparency": "1"
        },
        {
          "class": "ImageButton",
          "globalid": "m3",
          "alias": "modal_close",
          "size": "{0,24},{0,24}",
          "position": "{1,-20},{0,24}",
          "anchor": "1,0",
          "image_id": "97241930499310",
          "image": "rbxassetid://97241930499310",
          "image_color": "#a1a1aa",
          "scale_type": "Fit",
          "auto_color": "true",
          "background_transparency": "1"
        }
      ]
    }
  ]
}
```

---

### Pattern 4: Responsive Header
A logo, nav links, and a menu button that replaces the links below 700px and opens a dropdown with the same links (18 elements). It's a complete example of viewport polling ([UIGPT.md](UIGPT.md) §11).

```json
{
  "class": "Frame", "globalid": "hd", "alias": "header",
  "position": "{0,0},{0,0}", "size": "{1,0},{0,56}", "background_color": "#09090a", "z_index": "10",
  "children": [
    {"class":"UIStroke","globalid":"hs","stroke_color":"#1a1a1a","stroke_thickness":"1"},
    {"class":"TextButton?link","globalid":"lg","alias":"logo","href":"mysite.rbx",
     "position":"{0,24},{0.5,0}","anchor":"0,0.5","size":"auto_x","height":"{0,28}",
     "background_transparency":"1","text":"Brand","font":"BuilderSansBold","font_size":"18",
     "font_color":"#f2f2f3","align_x":"Left","align_y":"Center"},
    {"class":"Frame","globalid":"nv","alias":"navlinks","background_transparency":"1",
     "position":"{0.5,0},{0.5,0}","anchor":"0.5,0.5","size":"auto_x","height":"{0,32}",
     "children":[
       {"class":"UIListLayout","globalid":"nl","direction":"Horizontal","padding":"0,28","sort":"LayoutOrder","alignment_vertical":"Center"},
       {"class":"TextButton?link","globalid":"n1","alias":"navproduct","order":"1","href":"mysite.rbx/product",
        "size":"auto_x","height":"{1,0}","background_transparency":"1","auto_color":"true","text":"Product",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Center","align_y":"Center"},
       {"class":"TextButton?link","globalid":"n2","alias":"navpricing","order":"2","href":"mysite.rbx/pricing",
        "size":"auto_x","height":"{1,0}","background_transparency":"1","auto_color":"true","text":"Pricing",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Center","align_y":"Center"},
       {"class":"TextButton?link","globalid":"n3","alias":"navdocs","order":"3","href":"mysite.rbx/docs",
        "size":"auto_x","height":"{1,0}","background_transparency":"1","auto_color":"true","text":"Docs",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Center","align_y":"Center"},
       {"class":"TextButton?link","globalid":"n4","alias":"navsupport","order":"4","href":"mysite.rbx/support",
        "size":"auto_x","height":"{1,0}","background_transparency":"1","auto_color":"true","text":"Support",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Center","align_y":"Center"}
     ]},
    {"class":"ImageButton","globalid":"mb","alias":"menubutton","visible":"false",
     "position":"{1,-24},{0.5,0}","anchor":"1,0.5","size":"{0,24},{0,24}",
     "image":"rbxassetid://84352806499655","image_id":"84352806499655","image_color":"#f2f2f3",
     "scale_type":"Fit","auto_color":"true","background_transparency":"1","tooltip":"Menu"},
    {"class":"Frame","globalid":"mm","alias":"mobilemenu","visible":"false",
     "position":"{0,0},{1,0}","size":"auto_y","width":"{1,0}","background_color":"#09090a",
     "children":[
       {"class":"UIListLayout","globalid":"ml","direction":"Vertical","padding":"0,0","sort":"LayoutOrder"},
       {"class":"UIPadding","globalid":"mp","left":"0,24","right":"0,24","top":"0,8","bottom":"0,8"},
       {"class":"TextButton?link","globalid":"m1","alias":"menuproduct","order":"1","href":"mysite.rbx/product",
        "size":"{1,0},{0,40}","background_transparency":"1","auto_color":"true","text":"Product",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Left","align_y":"Center"},
       {"class":"TextButton?link","globalid":"m2","alias":"menupricing","order":"2","href":"mysite.rbx/pricing",
        "size":"{1,0},{0,40}","background_transparency":"1","auto_color":"true","text":"Pricing",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Left","align_y":"Center"},
       {"class":"TextButton?link","globalid":"m3","alias":"menudocs","order":"3","href":"mysite.rbx/docs",
        "size":"{1,0},{0,40}","background_transparency":"1","auto_color":"true","text":"Docs",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Left","align_y":"Center"},
       {"class":"TextButton?link","globalid":"m4","alias":"menusupport","order":"4","href":"mysite.rbx/support",
        "size":"{1,0},{0,40}","background_transparency":"1","auto_color":"true","text":"Support",
        "font":"BuilderSansMedium","font_size":"14","font_color":"#adadad","align_x":"Left","align_y":"Center"}
     ]},
    {"class":"script","globalid":"rs","alias":"navscript","enabled":"true",
     "content":[
       {"id":"0","text":["When website loaded..."],"globalid":"e1","x":"4900","y":"4900","width":"350","actions":[
         {"id":"11","text":["Set",{"value":"92","t":"string","l":"variable"},"to",{"value":"0","t":"string","l":"any"}],"globalid":"a1"},
         {"id":"23","text":["Repeat forever"],"globalid":"a2"},
         {"id":"3","text":["Wait",{"value":"0.1","t":"number"},"seconds"],"globalid":"a3"},
         {"id":"84","text":["Get viewport size →",{"value":"90","t":"string","l":"x"},{"value":"91","t":"string","l":"y"}],"globalid":"a4"},
         {"id":"21","text":["If",{"value":"{90}","t":"string","l":"any"},"is lower than",{"value":"700","t":"string","l":"any"}],"globalid":"a5"},
         {"id":"8","text":["Make",{"value":"nv","t":"object"},"invisible"],"globalid":"a6"},
         {"id":"9","text":["Make",{"value":"mb","t":"object"},"visible"],"globalid":"a7"},
         {"id":"112","text":["else"],"globalid":"a8"},
         {"id":"9","text":["Make",{"value":"nv","t":"object"},"visible"],"globalid":"a9"},
         {"id":"8","text":["Make",{"value":"mb","t":"object"},"invisible"],"globalid":"a10"},
         {"id":"18","text":["If",{"value":"{92}","t":"string","l":"any"},"is equal to",{"value":"1","t":"string","l":"any"}],"globalid":"a11"},
         {"id":"8","text":["Make",{"value":"mm","t":"object"},"invisible"],"globalid":"a12"},
         {"id":"11","text":["Set",{"value":"92","t":"string","l":"variable"},"to",{"value":"0","t":"string","l":"any"}],"globalid":"a13"},
         {"id":"106","text":["Set",{"value":"mb","t":"object"},"image to",{"value":"84352806499655","t":"id","assetbrowser":"image"}],"globalid":"a14"},
         {"id":"25","text":["end"],"globalid":"a15"},
         {"id":"25","text":["end"],"globalid":"a16"},
         {"id":"25","text":["end"],"globalid":"a17"}
       ]},
       {"id":"1","text":["When",{"value":"mb","t":"object","l":"button"},"pressed..."],"globalid":"e2","x":"4900","y":"5400","width":"350","actions":[
         {"id":"18","text":["If",{"value":"{92}","t":"string","l":"any"},"is equal to",{"value":"1","t":"string","l":"any"}],"globalid":"b1"},
         {"id":"8","text":["Make",{"value":"mm","t":"object"},"invisible"],"globalid":"b2"},
         {"id":"11","text":["Set",{"value":"92","t":"string","l":"variable"},"to",{"value":"0","t":"string","l":"any"}],"globalid":"b3"},
         {"id":"106","text":["Set",{"value":"mb","t":"object"},"image to",{"value":"84352806499655","t":"id","assetbrowser":"image"}],"globalid":"b4"},
         {"id":"112","text":["else"],"globalid":"b5"},
         {"id":"9","text":["Make",{"value":"mm","t":"object"},"visible"],"globalid":"b6"},
         {"id":"11","text":["Set",{"value":"92","t":"string","l":"variable"},"to",{"value":"1","t":"string","l":"any"}],"globalid":"b7"},
         {"id":"106","text":["Set",{"value":"mb","t":"object"},"image to",{"value":"97241930499310","t":"id","assetbrowser":"image"}],"globalid":"b8"},
         {"id":"25","text":["end"],"globalid":"b9"}
       ]}
     ]}
  ]
}
```

`{92}` is the menu state (`0` closed, `1` open). Pressing `mb` toggles the dropdown and swaps the icon between `menu` and `x`. At 700px and wider the links return and an open dropdown closes. The loop nests an `If` inside `else`, so it needs three `end`s.

---

### Pattern 5: Glass Panel (Glassmorphism)
CatWeb has no backdrop blur, so "glass" is two layers: a very transparent fill and a gradient inner stroke that reads as a rim light.

> [!NOTE]
> This recipe comes from SiteGPT V11.5 and was dropped from V12's key lists: `stroke_position` and a `UIGradient` nested under a `UIStroke` aren't in the current tables. Test it in CatWeb before shipping, and drop `stroke_position` if the import rejects it.

```json
{
  "class": "Frame",
  "globalid": "gl",
  "alias": "glasspanel",
  "background_color": "#ffffff",
  "background_transparency": "0.9",
  "position": "{0.5,0},{0.5,0}",
  "anchor": "0.5,0.5",
  "size": "{0.8,0},{0.55,0}",
  "children": [
    {
      "class": "UIStroke",
      "globalid": "gs",
      "stroke_color": "#ffffff",
      "stroke_transparency": "0",
      "stroke_position": "Inner",
      "children": [
        {
          "class": "UIGradient",
          "globalid": "gg",
          "rotation": "90",
          "gradient_color": "[[0,\"ffffff\"],[1,\"000000\"]]",
          "gradient_transparency": "[[0,0.8],[1,0.5]]"
        }
      ]
    },
    {"class": "UICorner", "globalid": "gc", "radius": "0,10"}
  ]
}
```

- **The gradient sits on the stroke, not the frame.** Under the `UIStroke` it shades the rim; on the frame it would shade the fill instead.
- **The glass base must oppose the surface behind it:** light glass (`#ffffff`) on a dark surface, dark glass (`#000000`) on a light one. Glass that matches its parent is invisible.
- **Text must oppose the composite**, which is roughly the surface colour, not the glass colour. On light glass over a dark surface, set `font_color: "#ffffff"` explicitly on every label and button inside; leaving the default dark text there is the most common glass bug.
- A glass `TextButton` uses the same fill, stroke, gradient and corner; only `background_color` and `font_color` change with the theme.
- On a gradient hero, glass picks up the hero colours for free. Choose base and text colour by the hero region each card sits on.
- **Don't:** go below `background_transparency: "0.85"` (reads as a solid card), skip the `UICorner`, or vary the gradient stops between glass elements in one set.

---

## 4. Anti-Filter String Decoder System

Roblox moderates arbitrary on-screen text into `######` if a word or phrase triggers the automated filter.
For ordinary site copy this is rare, so **write text normally**: headings, nav items, labels, numbers and short body copy go straight into `text`. The decoder is only for **really long strings you wrote as site copy** (a long paragraph), never for user input, broadcast payloads, or anything the filter would rightly block.

**Don't encode by default.** Every encoded string is hand-computed and a miscount fails silently: you get garbled characters, not an obvious `######`. When you do use it: add the decoder script (§4.2), encode the string with the table (§4.1), leave the label's JSON `text` as `""`, and set it at runtime (§4.3).

### 4.1 Character → Code Table
Every character has a numeric code with **no zero**. The digit `0` serves as the delimiter.
To encode a string: replace each character with its code, join with `0`, and wrap in leading and trailing `0`. Codes are 1–3 digits; don't pad them.

**Example:** `"Cat"` → `C` (`32`), `a` (`68`), `t` (`89`) → `"0320680890"`.

#### Basic ASCII Codes
| Char | Code | Char | Code | Char | Code | Char | Code | Char | Code | Char | Code |
|---|---|---|---|---|---|---|---|---|---|---|---|
| *(space)* | `1` | `!` | `2` | `"` | `3` | `#` | `4` | `$` | `5` | `%` | `6` |
| `'` | `7` | `()` | `8` | `+` | `9` | `,` | `11` | `-` | `12` | `.` | `13` |
| `/` | `14` | `{` | `15` |  |  |  |  |  |  |  |  |
| `\|` | `16` | `}` | `17` | `@` | `18` | `~` | `19` | `→` | `21` | `’` | `22` |
| `—` | `23` | `&` | `24` | `:` | `25` | `;` | `26` | `?` | `27` | `=` | `28` |
| `A` | `29` | `B` | `31` | `C` | `32` | `D` | `33` | `E` | `34` | `F` | `35` |
| `G` | `36` | `H` | `37` | `I` | `38` | `J` | `39` | `K` | `41` | `L` | `42` |
| `M` | `43` | `N` | `44` | `O` | `45` | `P` | `46` | `Q` | `47` | `R` | `48` |
| `S` | `49` | `T` | `51` | `U` | `52` | `V` | `53` | `W` | `54` | `X` | `55` |
| `Y` | `56` | `Z` | `57` | `[` | `58` | `\` | `59` | `]` | `61` | `^` | `62` |
| `_` | `63` | `` ` `` | `64` | `<` | `65` | `>` | `66` | `*` | `67` | `a` | `68` |
| `b` | `69` | `c` | `71` | `d` | `72` | `e` | `73` | `f` | `74` | `g` | `75` |
| `h` | `76` | `i` | `77` | `j` | `78` | `k` | `79` | `l` | `81` | `m` | `82` |
| `n` | `83` | `o` | `84` | `p` | `85` | `q` | `86` | `r` | `87` | `s` | `88` |
| `t` | `89` | `u` | `91` | `v` | `92` | `w` | `93` | `x` | `94` | `y` | `95` |
| `z` | `96` | `1` | `97` | `2` | `98` | `3` | `99` | `4` | `111` | `5` | `112` |
| `6` | `113` | `7` | `114` | `8` | `115` | `9` | `116` | `0` | `117` | `\n` | `263` |

#### Extended Latin Codes
Accented names, symbols and currency. Same rules.

| Char | Code | Char | Code | Char | Code | Char | Code | Char | Code | Char | Code |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `⌦` | `118` | `€` | `119` | `ƒ` | `121` | `„` | `122` | `…` | `123` | `†` | `124` |
| `‡` | `125` | `ˆ` | `126` | `‰` | `127` | `Š` | `128` | `‹` | `129` | `Œ` | `131` |
| `Ž` | `132` | `‘` | `133` | *(unused)* | `134` | `“` | `135` | `”` | `136` | `•` | `137` |
| `–` | `138` | *(unused)* | `139` | `˜` | `141` | `™` | `142` | `š` | `143` | `›` | `144` |
| `œ` | `145` | `ž` | `146` | `Ÿ` | `147` | `¡` | `148` | `¢` | `149` | `£` | `151` |
| `¤` | `152` | `¥` | `153` | `¦` | `154` | `§` | `155` | `¨` | `156` | `©` | `157` |
| `ª` | `158` | `«` | `159` | `¬` | `161` | `®` | `162` | `¯` | `163` | `°` | `164` |
| `±` | `165` | `²` | `166` | `³` | `167` | `´` | `168` | `µ` | `169` | `¶` | `171` |
| `·` | `172` | `¸` | `173` | `¹` | `174` | `º` | `175` | `»` | `176` | `¼` | `177` |
| `½` | `178` | `¾` | `179` | `¿` | `181` | `À` | `182` | `Á` | `183` | `Â` | `184` |
| `Ã` | `185` | `Ä` | `186` | `Å` | `187` | `Æ` | `188` | `Ç` | `189` | `È` | `191` |
| `É` | `192` | `Ê` | `193` | `Ë` | `194` | `Ì` | `195` | `Í` | `196` | `Î` | `197` |
| `Ï` | `198` | `Ð` | `199` | `Ñ` | `211` | `Ò` | `212` | `Ó` | `213` | `Ô` | `214` |
| `Õ` | `215` | `Ö` | `216` | `×` | `217` | `Ø` | `218` | `Ù` | `219` | `Ú` | `221` |
| `Û` | `222` | `Ü` | `223` | `Ý` | `224` | `Þ` | `225` | `ß` | `226` | `à` | `227` |
| `á` | `228` | `â` | `229` | `ã` | `231` | `ä` | `232` | `å` | `233` | `æ` | `234` |
| `ç` | `235` | `è` | `236` | `é` | `237` | `ê` | `238` | `ë` | `239` | `ì` | `241` |
| `í` | `242` | `î` | `243` | `ï` | `244` | `ð` | `245` | `ñ` | `246` | `ò` | `247` |
| `ó` | `248` | `ô` | `249` | `õ` | `251` | `ö` | `252` | `÷` | `253` | `ø` | `254` |
| `ù` | `255` | `ú` | `256` | `û` | `257` | `ü` | `258` | `ý` | `259` | `þ` | `261` |
| `ÿ` | `262` |  |  |  |  |  |  |  |  |  |  |

**Dead slots.** Code `8` is the two-character token `()`, so `(` and `)` can't be encoded on their own; keep parentheses out of encoded strings. The two *(unused)* slots decode to nothing useful.

### 4.2 Drop-In Decoder Script
Paste this script verbatim into `webcontent`. It defines function `d` (decode), adapted to read its input from global `{70}` instead of a function parameter. The original SiteGPT decoder also has an encode function `e`; it isn't needed to display text.

```json
{
  "class": "script",
  "globalid": "db",
  "alias": "StringDecoder",
  "enabled": "true",
  "content": [
    {
      "id": "0",
      "globalid": "da",
      "x": "4695", "y": "4667", "width": "517",
      "text": ["When website loaded..."],
      "actions": [
        { "id": "11", "globalid": "d1", "text": ["Set", {"value":"o!1","t":"string","l":"variable"}, "to", {"value":"! \" # $ !! ' () + , - . / { | } @ ~ → ’ — & : ; ? = A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ ` < > * a b c d e f g h i j k l m n o p q r s t u v w x y z ","t":"string","l":"any"}] },
        { "id": "11", "globalid": "d2", "text": ["Set", {"value":"o!1","t":"string","l":"variable"}, "to", {"value":"{o!1}1 2 3 4 5 6 7 8 9 0 ","t":"string","l":"any"}] },
        { "id": "11", "globalid": "d3", "text": ["Set", {"value":"o!1","t":"string","l":"variable"}, "to", {"value":"{o!1}⌦ € ƒ „ … † ‡ ˆ ‰ Š ‹ Œ Ž ‘ !! “ ” • – !! ˜ ™ š › œ ž Ÿ ¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ® ¯ ° ± ² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ð Ñ Ò Ó Ô Õ Ö × Ø Ù Ú Û Ü Ý Þ ß à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ÷ ø ù ú û ü ý þ ÿ \n","t":"string","l":"any"}] },
        { "id": "57", "globalid": "d4", "text": ["Split", {"value":"{o!1}","t":"string"}, {"value":" ","t":"string","l":"separator"}, "→", {"value":"o!2","t":"string","l":"table"}] },
        { "id": "89", "globalid": "d5", "text": ["Insert", {"value":" ","t":"string","l":"any"}, "at position", {"value":"1","t":"number","l":"number?"}, "of", {"value":"o!2","t":"string","l":"array"}] },
        { "id": "55", "globalid": "d6", "text": ["Set entry", {"value":"6","t":"string","l":"entry"}, "of", {"value":"o!2","t":"string","l":"table"}, "to", {"value":"%%","t":"string","l":"any"}] },
        { "id": "57", "globalid": "d7", "text": ["Split", {"value":"1 2 3 4 5 6 7 8 9 11 12 13 14 15 16 17 18 19 21 22 23 24 25 26 27 28 29 31 32 33 34 35 36 37 38 39 41 42 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 59 61 62 63 64 65 66 67 68 69 71 72 73 74 75 76 77 78 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99 111 112 113 114 115 116 117 118 119 121 122 123 124 125 126 127 128 129 131 132 133 134 135 136 137 138 139 141 142 143 144 145 146 147 148 149 151 152 153 154 155 156 157 158 159 161 162 163 164 165 166 167 168 169 171 172 173 174 175 176 177 178 179 181 182 183 184 185 186 187 188 189 191 192 193 194 195 196 197 198 199 211 212 213 214 215 216 217 218 219 221 222 223 224 225 226 227 228 229 231 232 233 234 235 236 237 238 239 241 242 243 244 245 246 247 248 249 251 252 253 254 255 256 257 258 259 261 262 263 264 265 266 267 268 269 271 272 273 274 275 276 277 278 279 281 282 283 284 285 286 287 288 289 291 292 293 294 295 296 297 298 299 311 312 313 314 315 316 317 318 319 321 322 323 324 325 326 327 328 329 331 332 333 334 335 336 337 338 339 341 342 343 344 345 346 347 348 349 351 352 353 354 355 356 357 358 359 361 362 363 364 365 366 367 368 369 371 372 373 374 375 376 377 378 379 381 382 383 384 385 386 387 388 389 391 392 393 394 395 396 397 398 399 411 412 413 414 415 416 417 418 419 421 422 423 424 425 426 427 428 429 431 432 433 434 435 436 437 438 439 441 442 443 444 445 446 447 448 449 451 452 453 454 455 456 457 458 459 461 462 463 464 465 466 467 468 469 471 472 473 474 475 476 477 478 479 481 482 483 484 485 486 487 488 489 491 492 493 494 495 496 497 498 499","t":"string"}, {"value":" ","t":"string","l":"separator"}, "→", {"value":"o!nums","t":"string","l":"table"}] }
      ]
    },
    {
      "id": "6",
      "globalid": "d9",
      "x": "5805", "y": "4668", "width": "589",
      "text": ["Define function", {"value":"d","t":"string","l":"function"}],
      "actions": [
        { "id": "93", "globalid": "f1", "text": ["If", {"value":"{o!2}","t":"string","l":"variable"}, "doesn't exist"] },
        { "id": "3", "globalid": "f2", "text": ["Wait", {"value":"0.01","t":"number"}, "seconds"] },
        { "id": "25", "globalid": "f3", "text": ["end"] },
        { "id": "43", "globalid": "f4", "text": ["Replace", {"value":"0","t":"string"}, "in", {"value":"70","t":"string","l":"variable"}, "by", {"value":"\f\f","t":"string"}] },
        { "id": "113", "globalid": "f5", "text": ["Iterate through", {"value":"{o!nums}","t":"string","l":"table"}, "({l!index},{l!value})"] },
        { "id": "56", "globalid": "f6", "text": ["Get entry", {"value":"{l!index}","t":"string","l":"entry"}, "of", {"value":"{o!2}","t":"string","l":"table"}, "→", {"value":"l!ac","t":"string","l":"variable"}] },
        { "id": "43", "globalid": "f7", "text": ["Replace", {"value":"\f{l!value}\f","t":"string"}, "in", {"value":"70","t":"string","l":"variable"}, "by", {"value":"{l!ac}","t":"string"}] },
        { "id": "25", "globalid": "f8", "text": ["end"] },
        { "id": "42", "globalid": "f9", "text": ["Sub", {"value":"70","t":"string","l":"variable"}, {"value":"2","t":"number","l":"start"}, "-", {"value":"-2","t":"number","l":"end"}] },
        { "id": "115", "globalid": "f10", "text": ["Return", {"value":"{70}","t":"string","l":"any"}] }
      ]
    }
  ]
}
```

### 4.3 Decoder Calling Pattern
Pass the encoded digit string through global `{70}`, call function `d`, and assign the result to the target `TextLabel`.

The decoder's character table lives in `{o!2}`, an **object-scoped** variable that only this script element can see. Put the calling event in the decoder's own `content` array; a separate script would render blank or garbled text. The label is referenced by `globalid`, which works across the whole file.

```json
{
  "id": "0",
  "globalid": "d8",
  "x": "5000", "y": "5200", "width": "350",
  "text": ["When website loaded..."],
  "actions": [
    {
      "id": "11",
      "globalid": "dd",
      "text": ["Set", {"value":"70","t":"string","l":"variable"}, "to", {"value":"0320680890","t":"string","l":"any"}]
    },
    {
      "id": "87",
      "globalid": "dc",
      "text": ["Run function", {"value":"d","t":"string","l":"function"}, {"value":[],"t":"tuple"}, "→", {"value":"71","t":"string","l":"variable?"}]
    },
    {
      "id": "10",
      "globalid": "de",
      "text": ["Set", {"value":"my_label","t":"object"}, "text to", {"value":"{71}","t":"string"}]
    }
  ]
}
```

---

## 5. Cross-References

- **UI Specification:** See [UIGPT.md](UIGPT.md) for element classes and styling modifiers.
- **Scripting Specification:** See [JSONScript.md](JSONScript.md) for full action reference.
- **Complete CatWeb Docs:** See [CatDocs.md](CatDocs.md).
