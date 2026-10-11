import { _decorator, Sprite } from 'cc';
import { BaseView } from '../common/BaseView';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';

const { ccclass } = _decorator;

interface MenuEntry {
  name: string;
  icon: string;
  label: string;
  target: string;
  badge?: string;
  badgeColor?: string;
}

const MENU_ENTRIES: MenuEntry[] = [
  { name: 'Store', icon: SPRITES.TITLE_ICON_SHOP, label: 'STORE', target: 'ShopCoinDialog' },
  { name: 'Gifts', icon: SPRITES.SHOP_ICON_COIN_01, label: 'GIFTS', target: 'ShopGemDialog' },
  {
    name: 'Messages',
    icon: SPRITES.TITLE_ICON_MESSAGE,
    label: 'MESSAGES',
    target: 'MessageDialog',
    badge: '3',
    badgeColor: SPRITES.NOTIFY_ORANGE,
  },
  {
    name: 'Mission',
    icon: SPRITES.TITLE_ICON_MISSION,
    label: 'MISSION',
    target: 'MissionDialog',
    badge: '!',
    badgeColor: SPRITES.NOTIFY_BLUE,
  },
  { name: 'Settings', icon: SPRITES.TITLE_ICON_SETTING, label: 'SETTINGS', target: 'SettingsDialog' },
];

@ccclass('MainMenuView')
export class MainMenuView extends BaseView {
  public onLoad(): void {
    UIBuilder.pageBackground(this.node);
    this.buildVideoButton();
    this.buildSnsButtons();
    this.buildTitleArea();
    this.buildPlayButton();
    this.buildBottomBar();
  }

  private get uiManager(): IUIManager {
    return ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
  }

  private openView(viewId: string): void {
    void this.uiManager.open(viewId);
  }

  private buildVideoButton(): void {
    const videoBtn = UIBuilder.button(this.node, 'BtnVideo', -870, 470, 160, 160);
    const bg = videoBtn.node.addComponent(Sprite);
    bg.color = DEMO_COLORS.BTN_GRAY;
    UIBuilder.sprite(videoBtn.node, 'Icon', SPRITES.ICON_MOVIE, 0, 0, 120, 120);
    const bubble = UIBuilder.sprite(
      this.node,
      'SpeechBubble',
      SPRITES.LABEL_SPEECH_BUBBLE_00,
      -650,
      350,
      260,
      190
    );
    bubble.color = DEMO_COLORS.WHITE;
    UIBuilder.label(bubble.node, 'Text', 'MOTION VIEW', 0, 10, FONT_SIZE.SMALL, DEMO_COLORS.TEXT_GRAY, true);
  }

  private buildSnsButtons(): void {
    const snsIcons = [SPRITES.ICON_SNS_GOOGLE, SPRITES.ICON_SNS_TWITTER, SPRITES.ICON_SNS_FACEBOOK];
    const bgColors = [DEMO_COLORS.ACCENT_RED, DEMO_COLORS.PRIMARY, DEMO_COLORS.FACEBOOK];
    for (let i = 0; i < snsIcons.length; i++) {
      const x = 640 + i * 130;
      const btn = UIBuilder.button(this.node, `Sns_${i}`, x, 470, 110, 110);
      const bg = btn.node.addComponent(Sprite);
      bg.color = bgColors[i];
      UIBuilder.sprite(btn.node, 'Icon', snsIcons[i], 0, 0, 70, 70);
    }
  }

  private buildTitleArea(): void {
    const ribbon = UIBuilder.sprite(this.node, 'Ribbon', SPRITES.LABEL_RIBBON_01, 0, 430, 480, 250);
    ribbon.color = DEMO_COLORS.RIBBON;
    UIBuilder.label(ribbon.node, 'Text', 'GAME GUI SKIN', 0, 0, FONT_SIZE.BODY, DEMO_COLORS.WHITE, true);
    UIBuilder.label(this.node, 'Title', 'SIMPLE ROUND', 0, 250, FONT_SIZE.TITLE, DEMO_COLORS.TEXT_DARK, true);
  }

  private buildPlayButton(): void {
    const playBtn = UIBuilder.button(this.node, 'BtnStart', 0, -60, 420, 420, () => {
      this.openView('StageView');
    });
    UIBuilder.sprite(playBtn.node, 'Bg', SPRITES.BTN_START, 0, 0, 420, 420);
    const playIcon = UIBuilder.sprite(playBtn.node, 'Icon', SPRITES.ICON_RESUME, 0, 0, 150, 150);
    playIcon.color = DEMO_COLORS.WHITE;
  }

  private buildBottomBar(): void {
    const bar = UIBuilder.node(this.node, 'BottomBar', 0, -430, 1300, 280);
    UIBuilder.hLayout(bar, 90);
    for (const entry of MENU_ENTRIES) {
      const item = UIBuilder.node(bar, `Item_${entry.name}`, 0, 0, 210, 280);
      const btn = UIBuilder.button(item, `Btn_${entry.name}`, 0, 30, 210, 210, () => {
        this.openView(entry.target);
      });
      UIBuilder.sprite(btn.node, 'Bg', SPRITES.BTN_OVAL_WHITE, 0, 0, 210, 210);
      UIBuilder.sprite(btn.node, 'Icon', entry.icon, 0, 0, 150, 150);
      if (entry.badge) {
        const badgeSprite = UIBuilder.sprite(btn.node, 'Badge', SPRITES.NOTIFY_ORANGE, 75, 75, 66, 66);
        badgeSprite.color = DEMO_COLORS.ACCENT_ORANGE;
        UIBuilder.label(badgeSprite.node, 'Text', entry.badge, 0, 0, FONT_SIZE.SMALL, DEMO_COLORS.WHITE, true);
      }
      UIBuilder.label(item, 'Label', entry.label, 0, -110, FONT_SIZE.SMALL, DEMO_COLORS.TEXT_GRAY, true);
    }
  }
}