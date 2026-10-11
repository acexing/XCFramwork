import { _decorator, Color, Label, Node, Sprite } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface MissionEntry {
  name: string;
  icon: string;
  iconBg: number[];
  title: string;
  current: number;
  total: number;
  rewardText: string;
  rewardIcon?: string;
  clearable?: boolean;
}

const MISSION_ENTRIES: MissionEntry[] = [
  {
    name: 'ReachLevel',
    icon: SPRITES.ICON_180_STAR1,
    iconBg: [102, 187, 106],
    title: 'Reach Level 20',
    current: 14,
    total: 20,
    rewardText: '200',
    rewardIcon: SPRITES.ICON_COIN,
  },
  {
    name: 'NewRecord',
    icon: SPRITES.ICON_180_MEDAL,
    iconBg: [239, 83, 80],
    title: 'New record achieved 3 times',
    current: 1,
    total: 3,
    rewardText: '5',
    rewardIcon: SPRITES.ICON_LIFE,
  },
  {
    name: 'InviteFriends',
    icon: SPRITES.ICON_180_AVATAR_BOY,
    iconBg: [66, 165, 245],
    title: 'Invite Friends 10',
    current: 10,
    total: 10,
    rewardText: 'CLEAR!',
    clearable: true,
  },
  {
    name: 'KillMonster',
    icon: SPRITES.ICON_180_MONSTER,
    iconBg: [255, 202, 40],
    title: 'Kill the monster 200',
    current: 42,
    total: 200,
    rewardText: '5',
    rewardIcon: SPRITES.ICON_GEM,
  },
];

const ROW_BORDER = { left: 40, top: 40, right: 40, bottom: 40 };

@ccclass('MissionDialog')
export class MissionDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1640,
      panelHeight: 900,
      headerTitle: 'MISSION',
      headerIcon: SPRITES.ICON_MEDAL_GOLD,
    });
    this.buildMissionList();
  }

  private buildMissionList(): void {
    if (!this.panel) {
      return;
    }
    UIBuilder.sprite(this.panel, 'Divider', SPRITES.IMAGE_LINE_DOT, 0, 280, 1460, 20, {
      tiled: true,
    });
    const list = UIBuilder.node(this.panel, 'MissionList', 0, -20, 1520, 760);
    for (let i = 0; i < MISSION_ENTRIES.length; i++) {
      const entry = MISSION_ENTRIES[i];
      const y = 300 - i * 190;
      this.buildMissionRow(list, `Row_${entry.name}`, 0, y, entry);
    }
  }

  private buildMissionRow(parent: Node, name: string, x: number, y: number, entry: MissionEntry): void {
    const row = UIBuilder.sprite(parent, name, SPRITES.LIST_FRAME_01_N, x, y, 1500, 170, {
      border: ROW_BORDER,
    });
    row.color = DEMO_COLORS.PANEL_BG;

    UIBuilder.solidSprite(row.node, 'IconBg', new Color(entry.iconBg[0], entry.iconBg[1], entry.iconBg[2], 255), -650, 0, 130, 130);
    UIBuilder.sprite(row.node, 'Icon', entry.icon, -650, 0, 110, 110);

    UIBuilder.label(row.node, 'Title', entry.title, -260, 30, FONT_SIZE.BODY, DEMO_COLORS.TEXT_GRAY);

    const ratio = entry.total > 0 ? entry.current / entry.total : 0;
    const progressColor = ratio >= 1 ? DEMO_COLORS.SUCCESS : DEMO_COLORS.PRIMARY;
    const fillWidth = Math.max(24, 400 * ratio);
    const progress = UIBuilder.node(row.node, 'Progress', -260, -30, 400, 24);
    UIBuilder.solidSprite(progress, 'Track', DEMO_COLORS.LOCKED, 0, 0, 400, 24);
    UIBuilder.solidSprite(progress, 'Fill', progressColor, -200 + fillWidth / 2, 0, fillWidth, 24);
    UIBuilder.label(row.node, 'ProgressText', `${entry.current}/${entry.total}`, 190, -30, FONT_SIZE.SMALL, progressColor, true);

    const rewardBtn = UIBuilder.button(row.node, 'RewardBtn', 560, 0, 280, 90, () => {
      this.closeSelf();
    });
    const rewardBg = rewardBtn.node.addComponent(Sprite);
    rewardBg.color = entry.clearable ? DEMO_COLORS.SUCCESS : DEMO_COLORS.PRIMARY;
    if (entry.rewardIcon) {
      UIBuilder.sprite(rewardBtn.node, 'RewardIcon', entry.rewardIcon, -60, 0, 54, 54);
    }
    const rewardLabel = rewardBtn.node.addComponent(Label);
    rewardLabel.string = entry.rewardText;
    rewardLabel.fontSize = FONT_SIZE.BODY;
    rewardLabel.color = DEMO_COLORS.WHITE;
    rewardLabel.isBold = true;
  }
}