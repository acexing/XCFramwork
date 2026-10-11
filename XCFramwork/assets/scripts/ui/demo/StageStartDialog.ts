import { _decorator, Label, Sprite } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface ItemEntry {
  name: string;
  icon: string;
  selected: boolean;
  badge?: string;
}

const ITEM_ENTRIES: ItemEntry[] = [
  { name: 'PlusTime', icon: SPRITES.SLIDER_ICON_PLUS_TIME, selected: true },
  { name: 'Potion', icon: SPRITES.SLIDER_ICON_POTION, selected: false, badge: '1' },
  { name: 'Shield', icon: SPRITES.SLIDER_ICON_SHIELD, selected: false },
];

@ccclass('StageStartDialog')
export class StageStartDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 960,
      panelHeight: 700,
      headerTitle: 'STAGE',
    });
    this.buildStageBadge();
    this.buildStars();
    this.buildMission();
    this.buildItems();
    this.buildStartButton();
  }

  private buildStageBadge(): void {
    if (!this.panel) {
      return;
    }
    const badge = UIBuilder.sprite(this.panel, 'StageBadge', SPRITES.BTN_OVAL_BLUE, -340, 300, 180, 180);
    badge.color = DEMO_COLORS.PRIMARY;
    UIBuilder.label(badge.node, 'Num', '4', 0, 0, FONT_SIZE.HEADER, DEMO_COLORS.WHITE, true);
  }

  private buildStars(): void {
    if (!this.panel) {
      return;
    }
    const stars = UIBuilder.node(this.panel, 'Stars', 0, 130, 600, 220);
    const starPaths = [SPRITES.STAR_GRADE_02_ON_1, SPRITES.STAR_GRADE_02_ON_2, SPRITES.STAR_GRADE_02_OFF];
    const sizes = [160, 200, 160];
    for (let i = 0; i < 3; i++) {
      UIBuilder.sprite(stars, `Star_${i}`, starPaths[i], (i - 1) * 190, i === 1 ? 20 : 0, sizes[i], sizes[i] + 20);
    }
  }

  private buildMission(): void {
    if (!this.panel) {
      return;
    }
    const ribbon = UIBuilder.sprite(this.panel, 'MissionRibbon', SPRITES.LABEL_RIBBON_00_M, 0, 10, 340, 260);
    ribbon.color = DEMO_COLORS.RIBBON;
    UIBuilder.label(ribbon.node, 'Text', 'MISSION', 0, 0, FONT_SIZE.BODY, DEMO_COLORS.WHITE, true);

    const box = UIBuilder.sprite(this.panel, 'MissionBox', SPRITES.LIST_FRAME_01_N, 0, -80, 700, 110);
    box.color = DEMO_COLORS.PANEL_BG;
    UIBuilder.label(box.node, 'Text', 'SCORE 800,000', 0, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
  }

  private buildItems(): void {
    if (!this.panel) {
      return;
    }
    const row = UIBuilder.node(this.panel, 'Items', 0, -230, 800, 220);
    for (let i = 0; i < ITEM_ENTRIES.length; i++) {
      const entry = ITEM_ENTRIES[i];
      const item = UIBuilder.node(row, `Item_${entry.name}`, (i - 1) * 260, 0, 220, 220);
      if (entry.selected) {
        UIBuilder.sprite(item, 'Ring', SPRITES.BTN_CIRCLE_108, 0, 0, 220, 220);
      }
      UIBuilder.sprite(item, 'Icon', entry.icon, 0, 0, 170, 170);
      if (entry.badge) {
        const badge = UIBuilder.sprite(item, 'Badge', SPRITES.NOTIFY_ORANGE, 70, 70, 66, 66);
        badge.color = DEMO_COLORS.ACCENT_ORANGE;
        UIBuilder.label(badge.node, 'Text', entry.badge, 0, 0, FONT_SIZE.SMALL, DEMO_COLORS.WHITE, true);
      }
    }
  }

  private buildStartButton(): void {
    if (!this.panel) {
      return;
    }
    const startBtn = UIBuilder.button(this.panel, 'BtnStart', 0, -370, 960, 160, () => {
      this.closeSelf();
    });
    const bg = startBtn.node.addComponent(Sprite);
    bg.color = DEMO_COLORS.PRIMARY;
    UIBuilder.sprite(startBtn.node, 'Icon', SPRITES.ICON_LIFE, -260, 0, 70, 70);
    const label = startBtn.node.addComponent(Label);
    label.string = 'START!';
    label.fontSize = FONT_SIZE.BUTTON;
    label.color = DEMO_COLORS.WHITE;
    label.isBold = true;

  }
}