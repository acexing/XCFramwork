import { _decorator, Label, Node, Sprite } from 'cc';
import { Color } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

export interface ShopEntry {
  name: string;
  icon: string;
  ringTint?: Color;
  count: string;
  oldCount?: string;
  bonus?: string;
  best?: boolean;
  price: string;
  priceIcon?: string;
}

const ROW_BORDER = { left: 40, top: 40, right: 40, bottom: 40 };

@ccclass('ShopDialogBase')
export abstract class ShopDialogBase extends BaseDialog {
  protected abstract getShopTitle(): string;
  protected abstract getShopEntries(): ShopEntry[];
  protected buildShopFooter(): void {}

  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1640,
      panelHeight: 940,
      headerTitle: this.getShopTitle(),
      headerIcon: SPRITES.TITLE_ICON_SHOP,
    });
    this.buildShopList();
    this.buildShopFooter();
  }

  private buildShopList(): void {
    if (!this.panel) {
      return;
    }
    UIBuilder.sprite(this.panel, 'Divider', SPRITES.IMAGE_LINE_DOT, 0, 300, 1460, 20, {
      tiled: true,
    });
    const entries = this.getShopEntries();
    const list = UIBuilder.node(this.panel, 'ShopList', 0, -30, 1520, entries.length * 200);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const y = (entries.length - 1) * 100 - i * 200;
      this.buildShopRow(list, `Row_${entry.name}`, 0, y, entry);
    }
  }

  private buildShopRow(parent: Node, name: string, x: number, y: number, entry: ShopEntry): void {
    const row = UIBuilder.sprite(parent, name, SPRITES.LIST_FRAME_01_N, x, y, 1500, 190, {
      border: ROW_BORDER,
    });
    row.color = DEMO_COLORS.PANEL_BG;

    if (entry.best) {
      const bestBubble = UIBuilder.sprite(row.node, 'BestBubble', SPRITES.LABEL_SPEECH_BUBBLE_00, -700, 70, 200, 140);
      bestBubble.color = DEMO_COLORS.ACCENT_ORANGE;
      UIBuilder.label(bestBubble.node, 'Text', 'BEST', 0, 20, FONT_SIZE.SMALL, DEMO_COLORS.WHITE, true);
    }

    const ring = UIBuilder.sprite(row.node, 'Ring', SPRITES.BTN_OVAL_WHITE, -640, 0, 150, 150);
    if (entry.ringTint) {
      ring.color = entry.ringTint;
    }
    UIBuilder.sprite(row.node, 'Icon', entry.icon, -640, 0, 120, 120);

    const countY = entry.bonus ? 20 : 0;
    if (entry.oldCount) {
      UIBuilder.label(row.node, 'OldCount', entry.oldCount, -330, countY, FONT_SIZE.BODY, DEMO_COLORS.TEXT_HINT);
    }
    const countX = entry.oldCount ? -160 : -280;
    UIBuilder.label(row.node, 'Count', entry.count, countX, countY, FONT_SIZE.SUB_HEADER, DEMO_COLORS.TEXT_DARK, true);

    if (entry.bonus) {
      const bonusTag = UIBuilder.sprite(row.node, 'BonusTag', SPRITES.LABEL_ZIGZAG, -300, -50, 300, 90);
      bonusTag.color = DEMO_COLORS.RIBBON;
      UIBuilder.label(bonusTag.node, 'Text', `BONUS ${entry.bonus}`, 0, 0, FONT_SIZE.SMALL, DEMO_COLORS.WHITE, true);
    }

    const buyBtn = UIBuilder.button(row.node, 'BuyBtn', 560, 0, 300, 90, () => {
      void ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER).showToast('购买成功');
    });
    const buyBg = buyBtn.node.addComponent(Sprite);
    buyBg.color = DEMO_COLORS.PRIMARY;
    if (entry.priceIcon) {
      UIBuilder.sprite(buyBtn.node, 'PriceIcon', entry.priceIcon, -70, 0, 50, 50);
      const priceLabel = buyBtn.node.addComponent(Label);
      priceLabel.string = entry.price;
      priceLabel.fontSize = FONT_SIZE.BODY;
      priceLabel.color = DEMO_COLORS.WHITE;
      priceLabel.isBold = true;
    } else {
      const priceLabel = buyBtn.node.addComponent(Label);
      priceLabel.string = `$ ${entry.price}`;
      priceLabel.fontSize = FONT_SIZE.BODY;
      priceLabel.color = DEMO_COLORS.WHITE;
      priceLabel.isBold = true;
    }
  }
}