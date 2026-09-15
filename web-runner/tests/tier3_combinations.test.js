/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Validates complex pairwise interactions between layouts, modifiers, containers, and subtypes (≥25 tests).
 */

import { describe, test, it, expect } from './harness.js';
import {
  renderElement,
  applyLayoutModifiers,
  applyUICorner,
  applyUIStroke,
  applyUIGradient,
  parseUDim2,
  parseUDim
} from './reference_adapter.js';
import { getDocument } from './harness.js';

describe('Tier 3: Cross-Feature Combinations', () => {

  // Combination 1: UIListLayout inside ScrollingFrame
  describe('Combination 1: UIListLayout inside ScrollingFrame', () => {
    test('1.1 renders vertical UIListLayout inside ScrollingFrame with canvassize="auto_y"', () => {
      const sf = renderElement({
        class: "ScrollingFrame",
        globalid: "sf_main",
        canvassize: "auto_y",
        size: "{1,0},{1,-56}",
        children: [
          { class: "UIListLayout", globalid: "ll_vert", direction: "Vertical", padding: "0,12" },
          { class: "Frame", globalid: "card_1", size: "{1,0},{0,100}", order: "1" },
          { class: "Frame", globalid: "card_2", size: "{1,0},{0,100}", order: "2" }
        ]
      });
      expect(sf.style.overflowY).toBe('auto');
      expect(sf.style.display).toBe('flex');
      expect(sf.style.flexDirection).toBe('column');
      expect(sf.style.gap).toBe('12px');
      expect(sf.children.length).toBe(2);
    });

    test('1.2 renders horizontal UIListLayout inside ScrollingFrame with overflow scrolling', () => {
      const sf = renderElement({
        class: "ScrollingFrame",
        globalid: "sf_horiz",
        canvassize: "{2,0},{0,80}",
        children: [
          { class: "UIListLayout", globalid: "ll_horiz", direction: "Horizontal", padding: "0,8" },
          { class: "Frame", globalid: "tab_1", size: "{0,120},{1,0}" },
          { class: "Frame", globalid: "tab_2", size: "{0,120},{1,0}" }
        ]
      });
      expect(sf.style.flexDirection).toBe('row');
      expect(sf.style.gap).toBe('8px');
    });

    test('1.3 sorts children dynamically by order property inside ScrollingFrame', () => {
      const sf = renderElement({
        class: "ScrollingFrame",
        globalid: "sf_sort",
        children: [
          { class: "UIListLayout", globalid: "ll_s", sort: "LayoutOrder" },
          { class: "TextLabel", globalid: "c_second", text: "2nd", order: "2" },
          { class: "TextLabel", globalid: "c_first", text: "1st", order: "1" },
          { class: "TextLabel", globalid: "c_third", text: "3rd", order: "3" }
        ]
      });
      expect(sf.children[0].getAttribute('data-order')).toBe('2');
      expect(sf.children[0].style.order).toBe('2');
      expect(sf.children[1].getAttribute('data-order')).toBe('1');
      expect(sf.children[1].style.order).toBe('1');
      expect(sf.children[2].getAttribute('data-order')).toBe('3');
      expect(sf.children[2].style.order).toBe('3');
    });

    test('1.4 combines UIPadding with UIListLayout inside ScrollingFrame', () => {
      const sf = renderElement({
        class: "ScrollingFrame",
        globalid: "sf_pad",
        children: [
          { class: "UIPadding", top: "0,20", bottom: "0,20", left: "0,16", right: "0,16" },
          { class: "UIListLayout", direction: "Vertical", padding: "0,10" },
          { class: "Frame", globalid: "item_a" }
        ]
      });
      expect(sf.style.paddingTop).toBe('calc(0% + 20px)');
      expect(sf.style.paddingLeft).toBe('calc(0% + 16px)');
      expect(sf.style.display).toBe('flex');
      expect(sf.style.gap).toBe('10px');
    });

    test('1.5 reproduces Pattern 1: Sticky Navbar sibling to ScrollingFrame body', () => {
      const doc = getDocument();
      const pageRoot = doc.createElement('div');
      const navbar = renderElement({
        class: "Frame",
        globalid: "nb",
        size: "{1,0},{0,56}",
        z_index: "10"
      }, pageRoot);
      const scroller = renderElement({
        class: "ScrollingFrame",
        globalid: "sf",
        size: "{1,0},{1,-56}",
        position: "{0,0},{0,56}",
        canvassize: "auto_y",
        children: [
          { class: "UIListLayout", direction: "Vertical" },
          { class: "Frame", globalid: "section_hero" }
        ]
      }, pageRoot);

      expect(pageRoot.children.length).toBe(2);
      expect(navbar.style.zIndex).toBe('10');
      expect(scroller.style.top).toBe('calc(0% + 56px)');
      expect(scroller.style.height).toBe('calc(100% + -56px)');
    });
  });

  // Combination 2: UICorner on Stroked Frame
  describe('Combination 2: UICorner on Stroked Frame', () => {
    test('2.1 applies both UICorner border-radius and UIStroke inset box-shadow to Frame', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "card_cs",
        children: [
          { class: "UICorner", radius: "0,12" },
          { class: "UIStroke", stroke_thickness: "2", stroke_color: "#3b82f6" }
        ]
      });
      expect(el.style.borderRadius).toBe('12px');
      expect(el.style.boxShadow).toBe('inset 0 0 0 2px #3b82f6');
    });

    test('2.2 applies pill corner "1,0" (9999px) with thick stroke', () => {
      const el = renderElement({
        class: "TextButton",
        globalid: "btn_pill",
        children: [
          { class: "UICorner", radius: "1,0" },
          { class: "UIStroke", stroke_thickness: "4", stroke_color: "#ffffff" }
        ]
      });
      expect(el.style.borderRadius).toBe('9999px');
      expect(el.style.boxShadow).toBe('inset 0 0 0 4px #ffffff');
    });

    test('2.3 combines UICorner, UIStroke, and UIGradient on a single Frame', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "combo_all",
        children: [
          { class: "UICorner", radius: "0,16" },
          { class: "UIStroke", stroke_thickness: "1", stroke_color: "#52525b" },
          { class: "UIGradient", gradient_color: '[[0,"#18181b"],[1,"#27272a"]]', rotation: "45" }
        ]
      });
      expect(el.style.borderRadius).toBe('16px');
      expect(el.style.boxShadow).toBe('inset 0 0 0 1px #52525b');
      expect(el.style.backgroundImage).toContain('linear-gradient(135deg');
    });

    test('2.4 stroked and rounded container with canvas="true" retains overflow clipping', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "clipped_card",
        canvas: "true",
        children: [
          { class: "UICorner", radius: "0,8" },
          { class: "UIStroke", stroke_thickness: "1", stroke_color: "#000000" },
          { class: "ImageLabel", globalid: "banner_img", size: "{1,0},{1,0}" }
        ]
      });
      expect(el.style.overflow).toBe('hidden');
      expect(el.style.borderRadius).toBe('8px');
      expect(el.style.boxShadow).toBe('inset 0 0 0 1px #000000');
      expect(el.children.length).toBe(1);
    });

    test('2.5 maintains modifier independence regardless of child declaration order', () => {
      const el1 = renderElement({
        class: "Frame",
        globalid: "ord_1",
        children: [{ class: "UICorner", radius: "0,10" }, { class: "UIStroke", stroke_thickness: "2" }]
      });
      const el2 = renderElement({
        class: "Frame",
        globalid: "ord_2",
        children: [{ class: "UIStroke", stroke_thickness: "2" }, { class: "UICorner", radius: "0,10" }]
      });
      expect(el1.style.borderRadius).toBe(el2.style.borderRadius);
      expect(el1.style.boxShadow).toBe(el2.style.boxShadow);
    });
  });

  // Combination 3: UIGridLayout with UIPadding and UIFlexItem
  describe('Combination 3: UIGridLayout with UIPadding and UIFlexItem', () => {
    test('3.1 applies UIGridLayout and UIPadding to same container', () => {
      const grid = renderElement({
        class: "Frame",
        globalid: "grid_pad",
        children: [
          { class: "UIPadding", top: "0,16", bottom: "0,16", left: "0,16", right: "0,16" },
          { class: "UIGridLayout", size: "{0,200},{0,150}", padding: "0,12" },
          { class: "Frame", globalid: "cell_1" }
        ]
      });
      expect(grid.style.display).toBe('grid');
      expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fill, minmax(200px, 1fr))');
      expect(grid.style.gridAutoRows).toBe('150px');
      expect(grid.style.gap).toBe('12px 12px');
      expect(grid.style.paddingTop).toBe('calc(0% + 16px)');
      expect(grid.style.paddingLeft).toBe('calc(0% + 16px)');
    });

    test('3.2 sorts multiple grid items according to order property', () => {
      const grid = renderElement({
        class: "Frame",
        globalid: "grid_sorted",
        children: [
          { class: "UIGridLayout" },
          { class: "Frame", globalid: "g_c", order: "3" },
          { class: "Frame", globalid: "g_a", order: "1" },
          { class: "Frame", globalid: "g_b", order: "2" }
        ]
      });
      expect(grid.children[0].style.order).toBe('3');
      expect(grid.children[1].style.order).toBe('1');
      expect(grid.children[2].style.order).toBe('2');
    });

    test('3.3 applies UIFlexItem grow_ratio to child inside flex container', () => {
      const flexList = renderElement({
        class: "Frame",
        globalid: "flex_cont",
        children: [
          { class: "UIListLayout", direction: "Horizontal" },
          {
            class: "Frame",
            globalid: "flex_child_1",
            children: [{ class: "UIFlexItem", grow_ratio: "2" }]
          },
          {
            class: "Frame",
            globalid: "flex_child_2",
            children: [{ class: "UIFlexItem", grow_ratio: "1" }]
          }
        ]
      });
      expect(flexList.children[0].style.flexGrow).toBe('2');
      expect(flexList.children[1].style.flexGrow).toBe('1');
    });

    test('3.4 applies UIFlexItem flex_mode="Fill" inside flex container', () => {
      const flexList = renderElement({
        class: "Frame",
        globalid: "fill_cont",
        children: [
          { class: "UIListLayout", direction: "Horizontal" },
          {
            class: "Frame",
            globalid: "fill_child",
            children: [{ class: "UIFlexItem", flex_mode: "Fill" }]
          }
        ]
      });
      expect(flexList.children[0].style.flex).toBe('1 1 0%');
    });

    test('3.5 renders nested interactive elements inside grid cells', () => {
      const grid = renderElement({
        class: "Frame",
        globalid: "grid_interactive",
        children: [
          { class: "UIGridLayout", size: "{0,140},{0,140}" },
          {
            class: "Frame",
            globalid: "cell_frame",
            children: [
              { class: "TextButton", globalid: "cell_btn", text: "Action" }
            ]
          }
        ]
      });
      const btn = grid.querySelector('[data-globalid="cell_btn"]');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Action');
    });
  });

  // Combination 4: Button Subtypes inside Flex Lists
  describe('Combination 4: Button Subtypes inside Flex Lists', () => {
    test('4.1 renders mixed button subtypes in a horizontal navigation bar UIListLayout', () => {
      const navbar = renderElement({
        class: "Frame",
        globalid: "nb_bar",
        children: [
          { class: "UIListLayout", direction: "Horizontal", padding: "0,16" },
          { class: "TextButton?link", globalid: "lnk_1", text: "Home", href: "home.rbx", order: "1" },
          { class: "TextButton?transfer", globalid: "trn_1", text: "Donate", robux_amount: "25", order: "2" },
          { class: "ImageButton?avataritem", globalid: "avt_1", product: "112233", order: "3" }
        ]
      });
      expect(navbar.children.length).toBe(3);
      expect(navbar.children[0].getAttribute('data-subtype')).toBe('link');
      expect(navbar.children[0].getAttribute('data-href')).toBe('home.rbx');
      expect(navbar.children[1].getAttribute('data-subtype')).toBe('transfer');
      expect(navbar.children[1].getAttribute('data-robux')).toBe('25');
      expect(navbar.children[2].getAttribute('data-subtype')).toBe('avataritem');
      expect(navbar.children[2].getAttribute('data-product')).toBe('112233');
    });

    test('4.2 preserves relative positioning and order styling across button subtypes in list', () => {
      const list = renderElement({
        class: "Frame",
        globalid: "btn_list",
        children: [
          { class: "UIListLayout", direction: "Vertical" },
          { class: "TextButton?link", globalid: "b_sub", order: "10" }
        ]
      });
      expect(list.children[0].style.position).toBe('relative');
      expect(list.children[0].style.order).toBe('10');
    });

    test('4.3 dispatches click events independently on subtype buttons inside list', () => {
      let linkClicked = false;
      let donateClicked = false;
      const nav = renderElement({
        class: "Frame",
        globalid: "click_nav",
        children: [
          { class: "UIListLayout", direction: "Horizontal" },
          { class: "TextButton?link", globalid: "b_link" },
          { class: "TextButton?transfer", globalid: "b_donate" }
        ]
      });
      nav.children[0].addEventListener('click', () => { linkClicked = true; });
      nav.children[1].addEventListener('click', () => { donateClicked = true; });

      nav.children[0].click();
      expect(linkClicked).toBe(true);
      expect(donateClicked).toBe(false);

      nav.children[1].click();
      expect(donateClicked).toBe(true);
    });

    test('4.4 renders ImageButton?link with inline SVG and link attributes', () => {
      const btn = renderElement({
        class: "ImageButton?link",
        globalid: "img_lnk",
        image_id: "128490289676597",
        href: "index.rbx"
      });
      expect(btn.getAttribute('data-subtype')).toBe('link');
      expect(btn.getAttribute('data-href')).toBe('index.rbx');
      expect(btn.innerHTML).toContain('cw-icon-house');
    });

    test('4.5 renders TextButton?donation legacy subtype identically to transfer', () => {
      const btn = renderElement({
        class: "TextButton?donation",
        globalid: "don_btn",
        text: "Tip 10",
        robux_amount: "10"
      });
      expect(btn.getAttribute('data-subtype')).toBe('donation');
      expect(btn.getAttribute('data-robux')).toBe('10');
    });
  });

  // Combination 5: TextScaled in Constrained Containers
  describe('Combination 5: TextScaled in Constrained Containers', () => {
    test('5.1 renders TextLabel with data-text-scaled inside fixed-size container', () => {
      const cont = renderElement({
        class: "Frame",
        globalid: "box_fixed",
        size: "{0,200},{0,50}",
        children: [
          { class: "TextLabel", globalid: "lbl_sc", text: "Responsive Title", font_size: "scaled", size: "{1,0},{1,0}" }
        ]
      });
      const lbl = cont.querySelector('[data-globalid="lbl_sc"]');
      expect(lbl.getAttribute('data-text-scaled')).toBe('true');
      expect(lbl.style.width).toBe('calc(100% + 0px)');
      expect(lbl.style.height).toBe('calc(100% + 0px)');
    });

    test('5.2 combines TextScaled with UIPadding on container', () => {
      const card = renderElement({
        class: "Frame",
        globalid: "card_pad_sc",
        size: "{0,300},{0,80}",
        children: [
          { class: "UIPadding", top: "0,10", bottom: "0,10", left: "0,15", right: "0,15" },
          { class: "TextLabel", globalid: "padded_text", text: "Padded Scaled", font_size: "scaled" }
        ]
      });
      expect(card.style.paddingTop).toBe('calc(0% + 10px)');
      const lbl = card.querySelector('[data-globalid="padded_text"]');
      expect(lbl.getAttribute('data-text-scaled')).toBe('true');
    });

    test('5.3 handles TextScaled with multi-line text and wrap="true"', () => {
      const lbl = renderElement({
        class: "TextLabel",
        globalid: "multiline_sc",
        text: "Line 1\nLine 2\nLine 3",
        font_size: "scaled",
        wrap: "true"
      });
      expect(lbl.getAttribute('data-text-scaled')).toBe('true');
      expect(lbl.style.whiteSpace).toBe('normal');
    });

    test('5.4 handles TextScaled with custom font weight and text alignment', () => {
      const lbl = renderElement({
        class: "TextLabel",
        globalid: "styled_sc",
        text: "Bold Center",
        font_size: "scaled",
        font_weight: "Bold",
        align_x: "Center"
      });
      expect(lbl.getAttribute('data-text-scaled')).toBe('true');
      expect(lbl.style.fontWeight).toBe('Bold');
      expect(lbl.style.textAlign).toBe('center');
    });

    test('5.5 handles TextButton with font_size="scaled" and hover/click capability', () => {
      let pressed = false;
      const btn = renderElement({
        class: "TextButton",
        globalid: "btn_sc",
        text: "Press Scaled",
        font_size: "scaled"
      });
      btn.addEventListener('click', () => { pressed = true; });
      btn.click();
      expect(btn.getAttribute('data-text-scaled')).toBe('true');
      expect(pressed).toBe(true);
    });
  });

});
