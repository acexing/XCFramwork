import { _decorator, Button, Label, Node, Sprite } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface SettingRow {
  name: string;
  icon: string;
  label: string;
  kind: 'slider' | 'toggle' | 'button';
  sliderRatio?: number;
  sliderHandle?: 'blue' | 'gray';
  buttonText?: string;
  buttonColor?: 'primary' | 'success';
}

const SETTING_ROWS: SettingRow[] = [
  { name: 'Sfx', icon: SPRITES.ICON_SOUND, label: 'SFX', kind: 'slider', sliderRatio: 0.7, sliderHandle: 'blue' },
  { name: 'Bgm', icon: SPRITES.ICON_MUSIC, label: 'BGM', kind: 'slider', sliderRatio: 0.1, sliderHandle: 'gray' },
  { name: 'Push', icon: SPRITES.ICON_BELL, label: 'Push', kind: 'toggle' },
  {
    name: 'HowTo',
    icon: SPRITES.ICON_HAND,
    label: 'How to play',
    kind: 'button',
    buttonText: 'Tutorial',
    buttonColor: 'success',
  },
  {
    name: 'Notice',
    icon: SPRITES.ICON_NOTICE,
    label: 'Notice',
    kind: 'button',
    buttonText: 'View',
    buttonColor: 'primary',
  },
];

@ccclass('SettingsDialog')
export class SettingsDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1250,
      panelHeight: 800,
      headerTitle: 'SETTINGS',
      headerIcon: SPRITES.TITLE_ICON_SETTING,
    });
    this.buildSettingRows();
  }

  private buildSettingRows(): void {
    if (!this.panel) {
      return;
    }
    for (let i = 0; i < SETTING_ROWS.length; i++) {
      const row = SETTING_ROWS[i];
      const y = 280 - i * 130;
      const rowNode = UIBuilder.node(this.panel, `Row_${row.name}`, 0, y, 1150, 100);
      this.buildRowContent(rowNode, row);
    }
    UIBuilder.sprite(this.panel, 'Divider', SPRITES.IMAGE_LINE_DOT, 0, 15, 1100, 20, {
      tiled: true,
    });
  }

  private buildRowContent(rowNode: Node, row: SettingRow): void {
    UIBuilder.sprite(rowNode, 'Icon', row.icon, -500, 0, 60, 60);
    UIBuilder.label(rowNode, 'Label', row.label, -340, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_GRAY);

    if (row.kind === 'slider') {
      this.buildSlider(rowNode, row.sliderRatio ?? 0.5, row.sliderHandle === 'blue');
      return;
    }
    if (row.kind === 'toggle') {
      this.buildToggle(rowNode);
      return;
    }
    this.buildActionButton(rowNode, row);
  }

  private buildSlider(rowNode: Node, ratio: number, blue: boolean): void {
    const slider = UIBuilder.node(rowNode, 'Slider', 210, 0, 560, 40);
    const frame = UIBuilder.sprite(slider, 'Track', SPRITES.SLIDER_03_FRAME, 0, 0, 560, 60);
    frame.color = DEMO_COLORS.WHITE;
    const fillWidth = Math.max(30, 560 * ratio);
    UIBuilder.solidSprite(slider, 'Fill', DEMO_COLORS.PRIMARY, -280 + fillWidth / 2, 0, fillWidth, 24);
    const handle = UIBuilder.sprite(
      slider,
      'Handle',
      blue ? SPRITES.SLIDER_01_HANDLE_BLUE : SPRITES.SLIDER_01_HANDLE_GRAY,
      -280 + fillWidth,
      0,
      70,
      70
    );
    handle.node.addComponent(Button);
  }

  private buildToggle(rowNode: Node): void {
    const toggleNode = UIBuilder.node(rowNode, 'Toggle', 460, 0, 200, 100);
    const frame = UIBuilder.sprite(toggleNode, 'Frame', SPRITES.TOGGLE_SWITCH_FRAME_ON, 0, 0, 200, 190);
    frame.color = DEMO_COLORS.PRIMARY;
    UIBuilder.sprite(toggleNode, 'Handle', SPRITES.TOGGLE_SWITCH_HANDLE, 55, 0, 80, 80);
    UIBuilder.sprite(toggleNode, 'Check', SPRITES.TOGGLE_CHECK_ON, -55, 0, 60, 60);
    toggleNode.addComponent(Button);
  }

  private buildActionButton(rowNode: Node, row: SettingRow): void {
    const btn = UIBuilder.button(rowNode, 'ActionBtn', 460, 0, 300, 80);
    const bg = btn.node.addComponent(Sprite);
    bg.color = row.buttonColor === 'success' ? DEMO_COLORS.SUCCESS : DEMO_COLORS.PRIMARY;
    const label = btn.node.addComponent(Label);
    label.string = row.buttonText ?? '';
    label.fontSize = FONT_SIZE.BODY;
    label.color = DEMO_COLORS.WHITE;
    label.isBold = true;

  }
}