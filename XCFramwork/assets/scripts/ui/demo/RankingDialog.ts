import { _decorator, Node } from 'cc';

import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;

interface RankEntry {
  name: string;
  avatar: string;
  score: string;
  stars: number;
  medal?: string;
  rankNum?: number;
}

const RANK_ENTRIES: RankEntry[] = [
  { name: 'Player 1', avatar: SPRITES.CHARACTER_BOY, score: '890,491', stars: 3, medal: SPRITES.ICON_MEDAL_GOLD },
  { name: 'Player 2', avatar: SPRITES.CHARACTER_GIRL, score: '812,030', stars: 3, medal: SPRITES.ICON_MEDAL_SILVER },
  { name: 'Player 3', avatar: SPRITES.CHARACTER_BOY, score: '765,120', stars: 2, medal: SPRITES.ICON_MEDAL_BRONZE },
  { name: 'Player 4', avatar: SPRITES.CHARACTER_GIRL, score: '743,900', stars: 2, rankNum: 4 },
  { name: 'Player 5', avatar: SPRITES.CHARACTER_BOY, score: '720,455', stars: 2, rankNum: 5 },
  { name: 'Player 6', avatar: SPRITES.CHARACTER_GIRL, score: '698,220', stars: 1, rankNum: 6 },
];

const ROW_BORDER = { left: 40, top: 40, right: 40, bottom: 40 };

@ccclass('RankingDialog')
export class RankingDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1640,
      panelHeight: 940,
      headerTitle: 'RANKING',
      headerIcon: SPRITES.TITLE_ICON_RANKING,
    });
    this.buildRankList();
  }

  private buildRankList(): void {
    if (!this.panel) {
      return;
    }
    const list = UIBuilder.node(this.panel, 'RankList', 0, -60, 1520, 740);
    for (let i = 0; i < RANK_ENTRIES.length; i++) {
      const entry = RANK_ENTRIES[i];
      const y = 310 - i * 120;
      this.buildRankRow(list, `Row_${entry.name}`, 0, y, entry);
    }
  }

  private buildRankRow(parent: Node, name: string, x: number, y: number, entry: RankEntry): void {
    const row = UIBuilder.sprite(parent, name, SPRITES.LIST_FRAME_01_N, x, y, 1500, 110, {
      border: ROW_BORDER,
    });
    row.color = DEMO_COLORS.PANEL_BG;

    if (entry.medal) {
      UIBuilder.sprite(row.node, 'Medal', entry.medal, -650, 0, 80, 80);
    } else {
      UIBuilder.label(row.node, 'RankNum', String(entry.rankNum ?? 0), -650, 0, FONT_SIZE.HEADER, DEMO_COLORS.TEXT_HINT, true);
    }

    UIBuilder.sprite(row.node, 'Avatar', entry.avatar, -500, 0, 80, 110);

    UIBuilder.label(row.node, 'Name', entry.name, -320, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
    UIBuilder.label(row.node, 'Score', entry.score, 200, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_GRAY, true);

    const starRow = UIBuilder.node(row.node, 'Stars', 540, 0, 180, 50);
    for (let i = 0; i < 3; i++) {
      const earned = i < entry.stars;
      UIBuilder.sprite(
        starRow,
        `Star_${i}`,
        earned ? SPRITES.STAR_GRADE_00_ON : SPRITES.STAR_GRADE_00_OFF,
        (i - 1) * 55,
        0,
        44,
        44
      );
    }
  }
}