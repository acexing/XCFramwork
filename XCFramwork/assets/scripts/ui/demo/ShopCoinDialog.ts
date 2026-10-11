import { _decorator } from 'cc';

import { DEMO_COLORS } from './DemoTheme';
import { SPRITES } from './UISprites';
import { ShopDialogBase, ShopEntry } from './ShopDialogBase';

const { ccclass } = _decorator;

@ccclass('ShopCoinDialog')
export class ShopCoinDialog extends ShopDialogBase {
  protected getShopTitle(): string {
    return 'COIN SHOP';
  }

  protected getShopEntries(): ShopEntry[] {
    return [
      {
        name: 'Pack1',
        icon: SPRITES.SHOP_ICON_COIN_01,
        count: '500',
        price: '10',
        priceIcon: SPRITES.ICON_GEM,
      },
      {
        name: 'Pack2',
        icon: SPRITES.SHOP_ICON_COIN_02,
        ringTint: DEMO_COLORS.SUCCESS,
        count: '2625',
        oldCount: '2500',
        bonus: '5%',
        best: true,
        price: '50',
        priceIcon: SPRITES.ICON_GEM,
      },
      {
        name: 'Pack3',
        icon: SPRITES.SHOP_ICON_COIN_03,
        count: '5500',
        oldCount: '5000',
        bonus: '10%',
        price: '100',
        priceIcon: SPRITES.ICON_GEM,
      },
      {
        name: 'Pack4',
        icon: SPRITES.SHOP_ICON_COIN_04,
        ringTint: DEMO_COLORS.PRIMARY,
        count: '12000',
        oldCount: '10000',
        bonus: '20%',
        price: '200',
        priceIcon: SPRITES.ICON_GEM,
      },
    ];
  }
}