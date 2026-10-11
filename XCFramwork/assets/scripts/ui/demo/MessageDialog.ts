import { _decorator, Color, Label, Node, Sprite } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface MessageEntry {
  name: string;
  rewardIcon: string;
  rewardRing: number[];
  avatar?: string;
  avatarDim?: boolean;
  title: string;
  content: string;
  actionText: string;
  actionColor: 'primary' | 'success';
}

const MESSAGE_ENTRIES: MessageEntry[] = [
  {
    name: 'Weekend',
    rewardIcon: SPRITES.ICON_GEM,
    rewardRing: [240, 240, 240],
    title: 'Weekend Event',
    content: "Here's a 20 gem! Good luck!",
    actionText: 'Accept',
    actionColor: 'primary',
  },
  {
    name: 'Brown',
    rewardIcon: SPRITES.ICON_LIFE,
    rewardRing: [255, 204, 0],
    avatar: SPRITES.CHARACTER_BOY,
    title: 'Brown',
    content: "Here's a 1 life! Good luck!",
    actionText: 'Accept',
    actionColor: 'primary',
  },
  {
    name: 'Erica',
    rewardIcon: SPRITES.ICON_180_KEY,
    rewardRing: [170, 102, 255],
    avatarDim: true,
    title: 'Erica',
    content: 'I need to unlock the next episode.',
    actionText: 'Send',
    actionColor: 'success',
  },
  {
    name: 'Jennie',
    rewardIcon: SPRITES.ICON_COIN,
    rewardRing: [0, 170, 136],
    avatar: SPRITES.CHARACTER_GIRL,
    title: 'Jennie',
    content: "Here's a 200 coin! Good luck!",
    actionText: 'Accept',
    actionColor: 'primary',
  },
];

const CARD_BORDER = { left: 30, top: 30, right: 30, bottom: 30 };

@ccclass('MessageDialog')
export class MessageDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1640,
      panelHeight: 940,
      headerTitle: 'MESSAGES',
      headerIcon: SPRITES.TITLE_ICON_MESSAGE,
    });
    this.buildBadge();
    this.buildMessageList();
  }

  private buildBadge(): void {
    if (!this.panel) {
      return;
    }
    const badge = UIBuilder.sprite(this.panel, 'Badge', SPRITES.NOTIFY_ORANGE, -190, 0, 80, 80);
    badge.color = DEMO_COLORS.ACCENT_ORANGE;
    UIBuilder.label(badge.node, 'Text', '3', 0, 0, FONT_SIZE.SMALL, DEMO_COLORS.WHITE, true);
  }

  private buildMessageList(): void {
    if (!this.panel) {
      return;
    }
    const list = UIBuilder.node(this.panel, 'MessageList', 0, -80, 1520, 720);
    for (let i = 0; i < MESSAGE_ENTRIES.length; i++) {
      const entry = MESSAGE_ENTRIES[i];
      const y = 270 - i * 180;
      this.buildMessageRow(list, `Row_${entry.name}`, 0, y, entry);
    }
  }

  private buildMessageRow(parent: Node, name: string, x: number, y: number, entry: MessageEntry): void {
    const row = UIBuilder.sprite(parent, name, SPRITES.LIST_FRAME_00, x, y, 1500, 160, {
      border: CARD_BORDER,
    });
    row.color = DEMO_COLORS.WHITE;

    const ringColor = new Color(entry.rewardRing[0], entry.rewardRing[1], entry.rewardRing[2], 255);
    UIBuilder.solidSprite(row.node, 'RewardRing', ringColor, -620, 0, 120, 120);
    UIBuilder.sprite(row.node, 'RewardIcon', entry.rewardIcon, -620, 0, 90, 90);

    if (entry.avatar) {
      UIBuilder.sprite(row.node, 'Avatar', entry.avatar, -440, 0, 110, 140);
    } else if (entry.avatarDim) {
      const dimAvatar = UIBuilder.sprite(row.node, 'Avatar', SPRITES.ICON_180_AVATAR_GIRL, -440, 0, 110, 140);
      dimAvatar.color = DEMO_COLORS.TEXT_HINT;
    }

    UIBuilder.label(row.node, 'Title', entry.title, -180, 35, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
    UIBuilder.label(row.node, 'Content', entry.content, -180, -25, FONT_SIZE.SMALL, DEMO_COLORS.TEXT_HINT);

    const actionBtn = UIBuilder.button(row.node, 'ActionBtn', 560, 0, 220, 80, () => {
      this.closeSelf();
    });
    const actionBg = actionBtn.node.addComponent(Sprite);
    actionBg.color = entry.actionColor === 'success' ? DEMO_COLORS.SUCCESS : DEMO_COLORS.PRIMARY;
    const actionLabel = actionBtn.node.addComponent(Label);
    actionLabel.string = entry.actionText;
    actionLabel.fontSize = FONT_SIZE.BODY;
    actionLabel.color = DEMO_COLORS.WHITE;
    actionLabel.isBold = true;
  }
}