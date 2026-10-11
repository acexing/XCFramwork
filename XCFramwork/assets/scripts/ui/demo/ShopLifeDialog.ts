import { _decorator, Label, Sprite } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { ShopDialogBase, ShopEntry } from './ShopDialogBase';

const { ccclass } = _decorator;

@ccclass('ShopLifeDialog')
export class ShopLifeDialog extends ShopDialogBase {
  protected getShopTitle(): string {
    return 'LIFE SHOP';
  }

  protected getShopEntries(): ShopEntry[] {
    return [
      {
        name: 'Pack1',
        icon: SPRITES.ICON_LIFE,
        ringTint: DEMO_COLORS.GOLD,
        count: '20',
        price: '32',
        priceIcon: SPRITES.ICON_GEM,
      },
      {
        name: 'Pack2',
        icon: SPRITES.ICON_LIFE,
        ringTint: DEMO_COLORS.GOLD,
        count: '5',
        price: '10',
        priceIcon: SPRITES.ICON_GEM,
      },
    ];
  }

  protected buildShopFooter(): void {
    if (!this.panel) {
      return;
    }
    const askBtn = UIBuilder.button(this.panel, 'BtnAskFriends', 0, -360, 900, 100, () => {
      this.closeSelf();
    });
    const askBg = askBtn.node.addComponent(Sprite);
    askBg.color = DEMO_COLORS.SUCCESS;
    const askLabel = askBtn.node.addComponent(Label);
    askLabel.string = 'Ask Friends for Help';
    askLabel.fontSize = FONT_SIZE.BODY;
    askLabel.color = DEMO_COLORS.WHITE;
    askLabel.isBold = true;
  }
}