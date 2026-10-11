import { _decorator } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface PauseButton {
  name: string;
  icon: string;
  label: string;
  action: 'restart' | 'resume' | 'exit';
}

const PAUSE_BUTTONS: PauseButton[] = [
  { name: 'Restart', icon: SPRITES.PAUSE_BTN_RESTART, label: 'RESTART', action: 'restart' },
  { name: 'Resume', icon: SPRITES.PAUSE_BTN_RESUME, label: 'RESUME', action: 'resume' },
  { name: 'Exit', icon: SPRITES.PAUSE_BTN_EXIT, label: 'EXIT', action: 'exit' },
];

@ccclass('PauseDialog')
export class PauseDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1000,
      panelHeight: 620,
      panelSprite: SPRITES.POPUP_02,
      ribbonTitle: 'PAUSE',
    });
    this.buildButtons();
  }

  private buildButtons(): void {
    if (!this.panel) {
      return;
    }
    const row = UIBuilder.node(this.panel, 'Buttons', 0, -60, 900, 300);
    for (let i = 0; i < PAUSE_BUTTONS.length; i++) {
      const config = PAUSE_BUTTONS[i];
      const item = UIBuilder.node(row, `Item_${config.name}`, (i - 1) * 300, 0, 240, 300);
      const btn = UIBuilder.button(item, `Btn_${config.name}`, 0, 30, 220, 220, () => {
        this.handleAction(config.action);
      });
      UIBuilder.sprite(btn.node, 'Icon', config.icon, 0, 0, 220, 220);
      UIBuilder.label(item, 'Label', config.label, 0, -110, FONT_SIZE.SMALL, DEMO_COLORS.TEXT_DARK, true);
    }
  }

  private handleAction(action: 'restart' | 'resume' | 'exit'): void {
    if (action === 'exit') {
      this.closeSelf();
      void ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER).open('MainMenu');
      return;
    }
    this.closeSelf();
  }
}