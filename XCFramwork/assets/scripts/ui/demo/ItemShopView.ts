import { _decorator, Button, Color, Label, Node, Sprite } from 'cc';
import { BaseView } from '../common/BaseView';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';

const { ccclass } = _decorator;

const CARD_BORDER = { left: 40, top: 40, right: 40, bottom: 40 };

interface ItemCard {
  name: string;
  icon: string;
  iconRing: Color;
  title: string;
  price: string;
  isNew?: boolean;
  locked?: boolean;
}

const ITEM_CARDS: ItemCard[] = [
  {
    name: 'PlusTime',
    icon: SPRITES.SLIDER_ICON_PLUS_TIME,
    iconRing: DEMO_COLORS.SUCCESS,
    title: 'Plus Time',
    price: '500',
    isNew: true,
  },
  {
    name: 'Shield',
    icon: SPRITES.SLIDER_ICON_SHIELD,
    iconRing: DEMO_COLORS.PRIMARY,
    title: 'Shield',
    price: '500',
  },
  {
    name: 'Bomb',
    icon: SPRITES.SLIDER_ICON_BOMB,
    iconRing: DEMO_COLORS.GOLD,
    title: 'Bomb',
    price: '500',
  },
  {
    name: 'Locked',
    icon: SPRITES.ICON_180_LOCK,
    iconRing: DEMO_COLORS.LOCKED,
    title: 'Locked',
    price: 'LV.30',
    locked: true,
  },
];

@ccclass('ItemShopView')
export class ItemShopView extends BaseView {
  public onLoad(): void {
    UIBuilder.pageBackground(this.node);
    this.buildTopBar();
    this.buildCards();
    this.buildPageDots();
  }

  private get uiManager(): IUIManager {
    return ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
  }

  private buildTopBar(): void {
    UIBuilder.iconButton(
      this.node,
      'BtnBack',
      SPRITES.BTN_BLACK_BACK,
      -880,
      450,
      130,
      () => this.closeSelf()
    );

    UIBuilder.label(this.node, 'Title', 'ITEM SHOP', -640, 450, FONT_SIZE.SUB_HEADER, DEMO_COLORS.TEXT_DARK, true);

    const coinBar = UIBuilder.node(this.node, 'StatusCoin', 700, 450, 340, 90);
    UIBuilder.sprite(coinBar, 'Frame', SPRITES.STATUS_FRAME, 0, 0, 340, 110);
    UIBuilder.sprite(coinBar, 'Icon', SPRITES.STATUS_ICON_COIN, -120, 0, 64, 64);
    UIBuilder.label(coinBar, 'Text', '176,300', 20, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
    const plusBtn = UIBuilder.sprite(coinBar, 'BtnPlus', SPRITES.STATUS_BTN_N, 135, 0, 64, 64);
    plusBtn.node.addComponent(Button);
  }

  private buildCards(): void {
    const scroll = UIBuilder.node(this.node, 'CardScroll', 0, -80, 1920, 700);
    for (let i = 0; i < ITEM_CARDS.length; i++) {
      const x = -720 + i * 480;
      this.buildCard(scroll, `Card_${ITEM_CARDS[i].name}`, x, 0, ITEM_CARDS[i]);
    }
  }

  private buildCard(parent: Node, name: string, x: number, y: number, card: ItemCard): void {
    const node = UIBuilder.sprite(parent, name, SPRITES.LIST_FRAME_01_D_WHITE, x, y, 440, 640, {
      border: CARD_BORDER,
    });
    node.color = card.locked ? DEMO_COLORS.LOCKED : DEMO_COLORS.WHITE;

    if (card.isNew) {
      const newTag = UIBuilder.sprite(node.node, 'NewTag', SPRITES.NOTIFY_ORANGE, -150, 250, 110, 110);
      newTag.color = DEMO_COLORS.ACCENT_ORANGE;
      UIBuilder.label(newTag.node, 'Text', 'NEW', 0, 0, FONT_SIZE.TINY, DEMO_COLORS.WHITE, true);
    }

    if (card.locked) {
      UIBuilder.sprite(node.node, 'Icon', card.icon, 0, 80, 140, 140);
      UIBuilder.label(node.node, 'Title', card.title, 0, -60, FONT_SIZE.BODY, DEMO_COLORS.TEXT_GRAY);
      UIBuilder.label(node.node, 'Price', card.price, 0, -180, FONT_SIZE.SMALL, DEMO_COLORS.TEXT_GRAY);
      return;
    }

    const ring = UIBuilder.sprite(node.node, 'IconRing', SPRITES.BTN_OVAL_WHITE, 0, 120, 220, 220);
    ring.color = card.iconRing;
    UIBuilder.sprite(node.node, 'Icon', card.icon, 0, 120, 160, 160);

    UIBuilder.label(node.node, 'Title', card.title, 0, -60, FONT_SIZE.BODY, DEMO_COLORS.TEXT_GRAY);

    const buyBtn = UIBuilder.button(node.node, 'BuyBtn', 0, -200, 280, 90, () => {
      void this.uiManager.showToast('购买成功');
    });
    const buyBg = buyBtn.node.addComponent(Sprite);
    buyBg.color = DEMO_COLORS.PRIMARY;
    UIBuilder.sprite(buyBtn.node, 'PriceIcon', SPRITES.ICON_COIN, -60, 0, 50, 50);
    const priceLabel = buyBtn.node.addComponent(Label);
    priceLabel.string = card.price;
    priceLabel.fontSize = FONT_SIZE.BODY;
    priceLabel.color = DEMO_COLORS.WHITE;
    priceLabel.isBold = true;
  }

  private buildPageDots(): void {
    const dots = UIBuilder.node(this.node, 'PageDots', 0, -480, 200, 40);
    for (let i = 0; i < 4; i++) {
      const dot = UIBuilder.solidSprite(dots, `Dot_${i}`, DEMO_COLORS.WHITE, (i - 1.5) * 40, 0, 24, 24);
      if (i > 0) {
        dot.color = DEMO_COLORS.TEXT_HINT;
      }
    }
  }
}