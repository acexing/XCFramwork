import { _decorator, Button } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface UnlockEntry {
  name: string;
  icon: string;
  tint?: 'none' | 'highlight' | 'dim';
}

const UNLOCK_ENTRIES: UnlockEntry[] = [
  { name: 'Shield', icon: SPRITES.ICON_180_SHIELD_RED, tint: 'none' },
  { name: 'Bomb', icon: SPRITES.ICON_180_BOMB, tint: 'highlight' },
  { name: 'Lock', icon: SPRITES.ICON_180_LOCK_DIM, tint: 'dim' },
];

@ccclass('LevelUpDialog')
export class LevelUpDialog extends BaseDialog {
  public onLoad(): void {
    this.buildBlueBackground();
    this.buildDialogShell({
      panelWidth: 1730,
      panelHeight: 560,
      panelSprite: SPRITES.POPUP_01,
      closeable: false,
      useMask: false,
    });
    this.buildCenter();
    this.repositionPanel();
    this.buildUnlockItems();
  }

  private buildBlueBackground(): void {
    UIBuilder.solidSprite(this.node, 'BlueBg', DEMO_COLORS.SKY_BG, 0, 0, 1920, 1080);
    UIBuilder.solidSprite(this.node, 'Deco_1', DEMO_COLORS.DECO_WHITE_60, -300, 250, 400, 400);
    UIBuilder.solidSprite(this.node, 'Deco_2', DEMO_COLORS.DECO_WHITE_40, 400, 150, 300, 300);
    UIBuilder.solidSprite(this.node, 'Deco_3', DEMO_COLORS.DECO_WHITE_30, 50, -50, 500, 500);
    const closeNode = UIBuilder.sprite(this.node, 'BtnClose', SPRITES.BTN_BLACK_CLOSE, 870, 470, 96, 96);
    const button = closeNode.node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.9;
    closeNode.node.on(Button.EventType.CLICK, this.onCloseClick, this);
  }

  private buildCenter(): void {
    const ribbon = UIBuilder.sprite(this.node, 'Ribbon', SPRITES.LABEL_RIBBON_01, 0, 400, 560, 290);
    ribbon.color = DEMO_COLORS.RIBBON;
    UIBuilder.label(ribbon.node, 'Text', 'LEVEL UP!', 0, 0, FONT_SIZE.HEADER, DEMO_COLORS.WHITE, true);

    const bigStar = UIBuilder.sprite(this.node, 'BigStar', SPRITES.STAR_GRADE_02_ON_3, 0, 120, 400, 420);
    UIBuilder.label(bigStar.node, 'LevelNum', '2', 0, 0, 140, DEMO_COLORS.TEXT_DARK, true);
  }

  private repositionPanel(): void {
    if (!this.panel) {
      return;
    }
    this.panel.setPosition(0, -260, 0);
    const tag = UIBuilder.sprite(this.panel, 'UnlockedTag', SPRITES.LABEL_TAG, 0, 250, 280, 300);
    tag.color = DEMO_COLORS.ACCENT_RED;
    UIBuilder.label(tag.node, 'Text', 'UNLOCKED', 0, 0, FONT_SIZE.SMALL, DEMO_COLORS.WHITE, true);
  }

  private buildUnlockItems(): void {
    if (!this.panel) {
      return;
    }
    const row = UIBuilder.node(this.panel, 'Items', 0, -60, 1200, 260);
    for (let i = 0; i < UNLOCK_ENTRIES.length; i++) {
      const entry = UNLOCK_ENTRIES[i];
      const item = UIBuilder.node(row, `Item_${entry.name}`, (i - 1) * 380, 0, 260, 260);
      const ring = UIBuilder.sprite(item, 'Bg', SPRITES.BTN_OVAL_WHITE, 0, 0, 240, 240);
      if (entry.tint === 'highlight') {
        ring.color = DEMO_COLORS.GOLD;
      } else if (entry.tint === 'dim') {
        ring.color = DEMO_COLORS.LOCKED;
      } else {
        ring.color = DEMO_COLORS.PRIMARY;
      }
      UIBuilder.sprite(item, 'Icon', entry.icon, 0, 0, 170, 170);
    }
  }
}