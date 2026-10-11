import {
  Node,
  Label,
  director,
  input,
  Input,
  EventKeyboard,
  KeyCode,
  UITransform,
  Layout,
  Widget,
  Color,
  view,
} from 'cc';
import { DEBUG } from 'cc/env';
import { IDebugPanel, DebugSection } from '../core/interfaces/IDebugPanel';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'DebugPanel';
const PANEL_Z_INDEX = 9999;
const STATS_UPDATE_INTERVAL_MS = 1000;

export class DebugPanel implements IDebugPanel {
  private logger: ILogger;
  private panelNode: Node | null = null;
  private visible: boolean = false;
  private sections = new Map<string, DebugSection>();
  private statsLabel: Label | null = null;
  private lastStatsUpdate: number = 0;
  private getStatsFn: (() => string) | null = null;

  constructor(logger: ILogger) {
    this.logger = logger;
    if (DEBUG) {
      this.registerKeyboardShortcut();
    }
  }

  show(): void {
    if (this.visible) {
      return;
    }
    this.visible = true;
    if (!this.panelNode) {
      this.createPanel();
    }
    if (this.panelNode) {
      this.panelNode.active = true;
    }
    this.logger.debug(LOGGER_TAG, 'DebugPanel 显示');
  }

  hide(): void {
    if (!this.visible) {
      return;
    }
    this.visible = false;
    if (this.panelNode) {
      this.panelNode.active = false;
    }
    this.logger.debug(LOGGER_TAG, 'DebugPanel 隐藏');
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  registerSection(name: string, section: DebugSection): void {
    this.sections.set(name, section);
    if (this.panelNode && this.visible) {
      this.renderSections();
    }
  }

  setStatsProvider(fn: () => string): void {
    this.getStatsFn = fn;
  }

  update(): void {
    if (!this.visible || !this.statsLabel) {
      return;
    }
    const now = Date.now();
    if (now - this.lastStatsUpdate >= STATS_UPDATE_INTERVAL_MS) {
      this.lastStatsUpdate = now;
      if (this.getStatsFn) {
        this.statsLabel.string = this.getStatsFn();
      }
    }
  }

  private createPanel(): void {
    const scene = director.getScene();
    if (!scene) {
      this.logger.error(LOGGER_TAG, '无活动场景，无法创建 DebugPanel');
      return;
    }
    const canvas = scene.getChildByName('Canvas') ?? scene;

    this.panelNode = new Node('DebugPanel');
    canvas.addChild(this.panelNode);
    this.panelNode.setSiblingIndex(PANEL_Z_INDEX);

    const transform = this.panelNode.addComponent(UITransform);
    transform.setContentSize(view.getVisibleSize().width, view.getVisibleSize().height);

    const widget = this.panelNode.addComponent(Widget);
    widget.isAlignTop = true;
    widget.isAlignLeft = true;
    widget.top = 10;
    widget.left = 10;

    const statsNode = new Node('StatsLabel');
    this.panelNode.addChild(statsNode);
    this.statsLabel = statsNode.addComponent(Label);
    this.statsLabel.fontSize = 14;
    this.statsLabel.color = new Color(0, 255, 0, 255);
    this.statsLabel.string = 'DebugPanel';

    const statsTransform = statsNode.addComponent(UITransform);
    statsTransform.setContentSize(400, 200);

    this.renderSections();
  }

  private renderSections(): void {
    if (!this.panelNode) {
      return;
    }
    for (const [name, section] of Array.from(this.sections.entries())) {
      const sectionNode = this.panelNode.getChildByName(`Section_${name}`);
      if (!sectionNode) {
        const newSectionNode = new Node(`Section_${name}`);
        this.panelNode.addChild(newSectionNode);
        section.render(newSectionNode);
      }
    }
  }

  private registerKeyboardShortcut(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private onKeyDown(event: EventKeyboard): void {
    if (event.keyCode === KeyCode.F1) {
      this.toggle();
    }
  }

  destroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    if (this.panelNode) {
      this.panelNode.destroy();
      this.panelNode = null;
    }
    this.visible = false;
  }
}
