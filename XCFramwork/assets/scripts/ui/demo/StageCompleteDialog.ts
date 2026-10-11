import { _decorator } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface ResultRow {
  name: string;
  label: string;
  value: string;
  icon?: string;
}

const RESULT_ROWS: ResultRow[] = [
  { name: 'Score', label: 'SCORE', value: '890,491' },
  { name: 'Time', label: 'TIME', value: '02:56' },
  { name: 'Gold', label: 'GOLD', value: '500', icon: SPRITES.ICON_COIN },
];

@ccclass('StageCompleteDialog')
export class StageCompleteDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1150,
      panelHeight: 860,
      headerTitle: '',
      closeable: false,
    });
    this.buildStars();
    this.buildRibbon();
    this.buildDataPanel();
    this.buildButtons();
  }

  private buildStars(): void {
    if (!this.panel) {
      return;
    }
    const stars = UIBuilder.node(this.panel, 'Stars', 0, 300, 640, 220);
    const starPaths = [SPRITES.STAR_GRADE_01_ON_1, SPRITES.STAR_GRADE_01_ON_3, SPRITES.STAR_GRADE_01_OFF];
    const sizes = [160, 200, 160];
    for (let i = 0; i < 3; i++) {
      UIBuilder.sprite(stars, `Star_${i}`, starPaths[i], (i - 1) * 200, i === 1 ? 20 : 0, sizes[i], sizes[i] + 20);
    }
  }

  private buildRibbon(): void {
    if (!this.panel) {
      return;
    }
    const ribbon = UIBuilder.sprite(this.panel, 'Ribbon', SPRITES.LABEL_RIBBON_01, 0, 120, 560, 290);
    ribbon.color = DEMO_COLORS.RIBBON;
    UIBuilder.label(ribbon.node, 'Text', 'STAGE CLEAR!', 0, 0, FONT_SIZE.HEADER, DEMO_COLORS.WHITE, true);
  }

  private buildDataPanel(): void {
    if (!this.panel) {
      return;
    }
    const dataPanel = UIBuilder.sprite(this.panel, 'DataPanel', SPRITES.TABLE_FRAME_01, 0, -60, 980, 340);
    dataPanel.color = DEMO_COLORS.PANEL_BG;
    for (let i = 0; i < RESULT_ROWS.length; i++) {
      const row = RESULT_ROWS[i];
      const y = 110 - i * 110;
      const rowNode = UIBuilder.node(dataPanel.node, `Row_${row.name}`, 0, y, 900, 90);
      UIBuilder.label(rowNode, 'Key', row.label, -280, 0, FONT_SIZE.SMALL, DEMO_COLORS.TEXT_GRAY, true);
      const icon = row.icon
        ? UIBuilder.sprite(rowNode, 'ValueIcon', row.icon, 140, 0, 60, 60)
        : null;
      const valueX = icon ? 260 : 220;
      UIBuilder.label(rowNode, 'Value', row.value, valueX, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
    }
  }

  private buildButtons(): void {
    if (!this.panel) {
      return;
    }
    const uiManager = ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);

    const homeBtn = UIBuilder.button(this.panel, 'BtnHome', -330, -330, 200, 200, () => {
      this.closeSelf();
      void uiManager.open('MainMenu');
    });
    UIBuilder.sprite(homeBtn.node, 'Bg', SPRITES.BTN_OVAL_BLUE, 0, 0, 200, 200);
    UIBuilder.sprite(homeBtn.node, 'Icon', SPRITES.ICON_HOME, 0, 0, 110, 110);

    const restartBtn = UIBuilder.button(this.panel, 'BtnRestart', 0, -330, 200, 200, () => {
      uiManager.showToast('重新挑战演示');
    });
    UIBuilder.sprite(restartBtn.node, 'Bg', SPRITES.BTN_OVAL_BLUE, 0, 0, 200, 200);
    UIBuilder.sprite(restartBtn.node, 'Icon', SPRITES.ICON_RESTART, 0, 0, 110, 110);

    const nextBtn = UIBuilder.button(this.panel, 'BtnNext', 330, -330, 200, 200, () => {
      this.closeSelf();
    });
    UIBuilder.sprite(nextBtn.node, 'Bg', SPRITES.BTN_OVAL_BLUE, 0, 0, 200, 200);
    UIBuilder.sprite(nextBtn.node, 'Icon', SPRITES.ICON_RESUME, 0, 0, 110, 110);
  }
}