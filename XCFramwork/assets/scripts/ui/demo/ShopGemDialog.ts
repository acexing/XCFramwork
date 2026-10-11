import { _decorator } from 'cc';

import { DEMO_COLORS } from './DemoTheme';
import { SPRITES } from './UISprites';
import { ShopDialogBase, ShopEntry } from './ShopDialogBase';

const { ccclass } = _decorator;

@ccclass('ShopGemDialog')
export class ShopGemDialog extends ShopDialogBase {
  protected getShopTitle(): string {
    return 'GEM SHOP';
  }

  protected getShopEntries(): ShopEntry[] {
    return [
      {
        name: 'Pack1',
        icon: SPRITES.SHOP_ICON_GEM_01,
        count: '18',
        price: '2.09',
      },
      {
        name: 'Pack2',
        icon: SPRITES.SHOP_ICON_GEM_02,
        ringTint: DEMO_COLORS.SUCCESS,
        count: '60',
        oldCount: '45',
        bonus: '33%',
        best: true,
        price: '5.49',
      },
      {
        name: 'Pack3',
        icon: SPRITES.SHOP_ICON_GEM_03,
        count: '130',
        oldCount: '90',
        bonus: '44%',
        price: '10.99',
      },
      {
        name: 'Pack4',
        icon: SPRITES.SHOP_ICON_GEM_04,
        ringTint: DEMO_COLORS.PRIMARY,
        count: '420',
        oldCount: '270',
        bonus: '56%',
        price: '32.99',
      },
    ];
  }
}