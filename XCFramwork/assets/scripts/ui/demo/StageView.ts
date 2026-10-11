import { _decorator, Button, Node } from 'cc';
import { BaseView } from '../common/BaseView';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IUIManager } from '../../core/interfaces/IUIManager';
import { ServiceRegistry } from '../../app/ServiceRegistry';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';

const { ccclass } = _decorator;

const GRID_COLS = 6;
const GRID_ROWS = 3;
const CELL_W = 300;
const CELL_H = 250;
const GRID_ORIGIN_X = -800;
const GRID_ORIGIN_Y = 240;
const UNLOCKED_MAX = 10;
const CURRENT_STAGE = 4;

interface StageStatus {
  type: 'completed' | 'current' | 'normal' | 'locked';
  stars?: number;
}

@ccclass('StageView')
export class StageView extends BaseView {
  public onLoad(): void {
    UIBuilder.pageBackground(this.node);
    this.buildTopBar();
    this.buildStageGrid();
    this.buildPageControls();
  }

  private get uiManager(): IUIManager {
    return ServiceRegistry.get<IUIManager>(SERVICE_TOKENS.UI_MANAGER);
  }

  private openView(viewId: string): void {
    void this.uiManager.open(viewId);
  }

  private stageStatus(stage: number): StageStatus {
    if (stage > UNLOCKED_MAX) {
      return { type: 'locked' };
    }
    if (stage === CURRENT_STAGE) {
      return { type: 'current' };
    }
    if (stage <= 3) {
      return { type: 'completed', stars: stage };
    }
    return { type: 'normal' };
  }

  private buildTopBar(): void {
    UIBuilder.iconButton(
      this.node,
      'BtnBack',
      SPRITES.BTN_BLACK_BACK,
      -880,
      450,
      130,
      () => this.closeSelf()
    );

    this.buildStatusBar('StatusLife', -640, SPRITES.STATUS_ICON_LIFE, '10/30');
    this.buildStatusBar('StatusCoin', -380, SPRITES.STATUS_ICON_COIN, '176,300', 'ShopCoinDialog');
    this.buildStatusBar('StatusGem', -120, SPRITES.STATUS_ICON_GEM, '120', 'ShopGemDialog');

    const starBar = UIBuilder.node(this.node, 'StatusStar', 140, 450, 260, 90);
    UIBuilder.sprite(starBar, 'Icon', SPRITES.STATUS_ICON_STAR, -70, 0, 70, 70);
    UIBuilder.label(starBar, 'Text', '6/360', 60, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
  }

  private buildStatusBar(
    name: string,
    x: number,
    iconPath: string,
    text: string,
    openTarget?: string
  ): void {
    const bar = UIBuilder.node(this.node, name, x, 450, 240, 90);
    UIBuilder.sprite(bar, 'Frame', SPRITES.STATUS_FRAME, 0, 0, 240, 110);
    UIBuilder.sprite(bar, 'Icon', iconPath, -70, 0, 64, 64);
    UIBuilder.label(bar, 'Text', text, 10, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK, true);
    const plusBtn = UIBuilder.sprite(bar, 'BtnPlus', SPRITES.STATUS_BTN_N, 90, 0, 64, 64);
    const button = plusBtn.node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    plusBtn.node.on(Button.EventType.CLICK, () => {
      if (openTarget) {
        this.openView(openTarget);
      }
    }, this);
  }

  private buildStageGrid(): void {
    const grid = UIBuilder.node(this.node, 'StageGrid', 0, -40, 1900, 800);
    let stage = 1;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = GRID_ORIGIN_X + col * CELL_W;
        const y = GRID_ORIGIN_Y - row * CELL_H;
        this.buildStageCell(grid, `Stage_${stage}`, x, y, stage);
        stage++;
      }
    }
  }

  private buildStageCell(parent: Node, name: string, x: number, y: number, stage: number): void {
    const status = this.stageStatus(stage);
    const cell = UIBuilder.node(parent, name, x, y, CELL_W, CELL_H);
    const framePath =
      status.type === 'locked'
        ? SPRITES.STAGE_FRAME_WHITE_D
        : status.type === 'current'
          ? SPRITES.STAGE_FRAME_WHITE_N2
          : status.type === 'completed'
            ? SPRITES.STAGE_FRAME_WHITE_S1
            : SPRITES.STAGE_FRAME_WHITE_N1;

    if (status.type === 'current') {
      const clickCell = UIBuilder.button(cell, 'Frame', 0, 0, CELL_W, CELL_H, () => {
        this.openView('StageStartDialog');
      });
      UIBuilder.sprite(clickCell.node, 'Bg', framePath, 0, 0, 240, 240);
      UIBuilder.label(clickCell.node, 'Num', String(stage), 0, 20, FONT_SIZE.HEADER, DEMO_COLORS.TEXT_DARK, true);
      return;
    }

    if (status.type === 'locked') {
      const frame = UIBuilder.sprite(cell, 'Frame', framePath, 0, 0, 240, 240);
      frame.color = DEMO_COLORS.LOCKED;
      UIBuilder.sprite(cell, 'Lock', SPRITES.ICON_180_LOCK, 0, 0, 100, 100);
      return;
    }

    const frame = UIBuilder.sprite(cell, 'Frame', framePath, 0, 0, 240, 240);
    if (status.type === 'completed') {
      frame.color = DEMO_COLORS.PRIMARY;
    }
    const numColor = status.type === 'completed' ? DEMO_COLORS.WHITE : DEMO_COLORS.TEXT_HINT;
    UIBuilder.label(cell, 'Num', String(stage), 0, 20, FONT_SIZE.HEADER, numColor, true);
    if (status.stars) {
      const starRow = UIBuilder.node(cell, 'Stars', 0, -70, 180, 50);
      for (let i = 0; i < 3; i++) {
        const earned = i < status.stars;
        UIBuilder.sprite(
          starRow,
          `Star_${i}`,
          earned ? SPRITES.STAR_GRADE_00_ON : SPRITES.STAR_GRADE_00_OFF,
          (i - 1) * 60,
          0,
          50,
          50
        );
      }
    }
  }

  private buildPageControls(): void {
    UIBuilder.iconButton(this.node, 'BtnPagePrev', SPRITES.PAGE_NAVI_PREV_N, -880, 0, 100);
    UIBuilder.iconButton(this.node, 'BtnPageNext', SPRITES.PAGE_NAVI_NEXT_N, 880, 0, 100);

    const dots = UIBuilder.node(this.node, 'PageDots', 0, -480, 200, 40);
    for (let i = 0; i < 4; i++) {
      const dot = UIBuilder.solidSprite(dots, `Dot_${i}`, DEMO_COLORS.WHITE, (i - 1.5) * 40, 0, 24, 24);
      if (i > 0) {
        dot.color = DEMO_COLORS.TEXT_HINT;
      }
    }
  }
}