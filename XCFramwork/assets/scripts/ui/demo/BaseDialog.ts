import { BlockInputEvents, Button, Color, Node, Sprite, tween, Vec3 } from 'cc';
import { BaseView } from '../common/BaseView';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';

export interface DialogShellOptions {
  panelWidth: number;
  panelHeight: number;
  headerTitle?: string;
  headerIcon?: string;
  panelSprite?: string;
  ribbonTitle?: string;
  useMask?: boolean;
  maskAlpha?: number;
  closeable?: boolean;
}

const POPUP_BORDER = { left: 60, top: 60, right: 60, bottom: 60 };
const LIST_FRAME_BORDER = { left: 40, top: 40, right: 40, bottom: 40 };

export abstract class BaseDialog extends BaseView {
  protected maskNode: Node | null = null;
  protected panel: Node | null = null;

  protected buildDialogShell(options: DialogShellOptions): void {
    if (options.useMask !== false) {
      const alpha = options.maskAlpha ?? 128;
      const maskSprite = UIBuilder.solidSprite(
        this.node,
        'Mask',
        new Color(0, 0, 0, alpha),
        0,
        0,
        1920,
        1080
      );
      this.maskNode = maskSprite.node;
      this.maskNode.addComponent(BlockInputEvents);
    }

    const panelSprite = UIBuilder.sprite(
      this.node,
      'Panel',
      options.panelSprite ?? SPRITES.POPUP_01,
      0,
      0,
      options.panelWidth,
      options.panelHeight,
      { border: options.panelSprite ? LIST_FRAME_BORDER : POPUP_BORDER }
    );
    this.panel = panelSprite.node;

    if (options.ribbonTitle) {
      this.buildRibbonTitle(options.ribbonTitle, options.closeable !== false);
    } else {
      this.buildHeader(options.headerTitle ?? '', options.headerIcon, options.closeable !== false);
    }

    if (this.panel) {
      const to = new Vec3(1, 1, 1);
      this.panel.setScale(0.85, 0.85, 1);
      tween(this.panel).to(0.15, { scale: to }).start();
    }
  }

  private buildHeader(title: string, iconPath: string | undefined, closeable: boolean): void {
    if (!this.panel) {
      return;
    }
    if (iconPath) {
      UIBuilder.sprite(this.panel, 'HeaderIcon', iconPath, -520, 0, 110, 100);
    }
    UIBuilder.label(this.panel, 'Title', title, -360, 0, 52, DEMO_COLORS.TEXT_DARK, true);
    if (closeable) {
      this.attachCloseButton(this.panel, 'BtnClose', 620, 0);
    }
  }

  private buildRibbonTitle(title: string, closeable: boolean): void {
    if (!this.panel) {
      return;
    }
    const ribbonGroup = UIBuilder.node(this.panel, 'RibbonGroup', 0, 200, 700, 200);
    const wingL = UIBuilder.sprite(ribbonGroup, 'WingL', SPRITES.LABEL_ZIGZAG, -400, 0, 90, 110);
    wingL.color = DEMO_COLORS.RIBBON_WING;
    const wingR = UIBuilder.sprite(ribbonGroup, 'WingR', SPRITES.LABEL_ZIGZAG, 400, 0, 90, 110);
    wingR.color = DEMO_COLORS.RIBBON_WING;
    UIBuilder.sprite(ribbonGroup, 'RibbonMain', SPRITES.LABEL_RIBBON_00_M, 0, 0, 520, 160);
    UIBuilder.label(ribbonGroup, 'Title', title, 0, 0, 56, DEMO_COLORS.WHITE, true);
    if (closeable) {
      this.attachCloseButton(this.panel, 'BtnClose', 620, 420);
    }
  }

  private attachCloseButton(panel: Node, name: string, x: number, y: number): Sprite {
    const closeSprite = UIBuilder.sprite(panel, name, SPRITES.BTN_BLACK_CLOSE, x, y, 96, 96);
    const button = closeSprite.node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.9;
    closeSprite.node.on(Button.EventType.CLICK, this.onCloseClick, this);
    return closeSprite;
  }

  protected onCloseClick(): void {
    this.closeSelf();
  }

  protected openView(viewId: string): void {
    void ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER).open(viewId);
  }

  protected tintSprite(sprite: Sprite, color: Color): void {
    sprite.color = color;
  }
}