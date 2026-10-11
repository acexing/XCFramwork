import {
  _decorator,
  Component,
  Node,
  Label,
  Button,
  Slider,
  Toggle,
  UITransform,
  Canvas,
  Camera,
  Layout,
  Sprite,
  Color,
  view,
  Overflow,
  HorizontalTextAlignment,
  VerticalTextAlignment,
} from 'cc';
import { ExampleEventBus } from './EventBusExample';
import { ExampleUIManager } from './UIManagerExample';
import { ExampleSaveService } from './SaveServiceExample';
import { ExampleAudioManager } from './AudioManagerExample';
import { ExampleLocalization } from './LocalizationExample';
import { ExampleTimerManager } from './TimerManagerExample';
import { ExamplePoolManager } from './PoolManagerExample';

const { ccclass } = _decorator;

const TAB_NAMES = [
  'EventBus',
  'UIManager',
  'SaveService',
  'AudioManager',
  'Localization',
  'TimerManager',
  'PoolManager',
];

const TAB_COLORS = [
  new Color(60, 120, 200, 255),
  new Color(80, 160, 80, 255),
  new Color(200, 120, 60, 255),
  new Color(160, 80, 160, 255),
  new Color(60, 160, 160, 255),
  new Color(200, 60, 100, 255),
  new Color(120, 120, 200, 255),
];

const EXAMPLE_NODE_NAMES = [
  'ExampleEventBus',
  'ExampleUIManager',
  'ExampleSaveService',
  'ExampleAudioManager',
  'ExampleLocalization',
  'ExampleTimerManager',
  'ExamplePoolManager',
];

@ccclass('ExampleSceneSetup')
export class ExampleSceneSetup extends Component {
  private tabButtons: Button[] = [];
  private panels: Node[] = [];
  private currentTab: number = 0;
  private resultLabel: Label | null = null;
  private canvasNode: Node | null = null;

  onLoad(): void {
    this.createScene();
  }

  private createScene(): void {
    this.canvasNode = this.findOrCreateCanvas();
    this.createCamera(this.canvasNode);
    this.createBackground(this.canvasNode);
    this.createTitle(this.canvasNode);
    this.createTabBar(this.canvasNode);
    this.createPanels(this.canvasNode);
    this.createResultArea(this.canvasNode);
    this.showTab(0);
  }

  private findOrCreateCanvas(): Node {
    const existing = this.node.scene.getChildByName('Canvas');
    if (existing) {
      return existing;
    }
    const canvasNode = new Node('Canvas');
    canvasNode.addComponent(Canvas);
    canvasNode.addComponent(UITransform).setContentSize(view.getVisibleSize());
    this.node.addChild(canvasNode);
    return canvasNode;
  }

  private createCamera(canvasNode: Node): void {
    if (canvasNode.getChildByName('Camera')) {
      return;
    }
    const cameraNode = new Node('Camera');
    cameraNode.addComponent(Camera);
    cameraNode.setPosition(0, 0, -1000);
    canvasNode.addChild(cameraNode);
  }

  private createBackground(canvasNode: Node): void {
    const bgNode = new Node('Background');
    const uiTransform = bgNode.addComponent(UITransform);
    uiTransform.setContentSize(view.getVisibleSize());
    const sprite = bgNode.addComponent(Sprite);
    sprite.color = new Color(30, 30, 35, 255);
    bgNode.setPosition(0, 0, 0);
    canvasNode.addChild(bgNode);
  }

  private createTitle(canvasNode: Node): void {
    const titleNode = new Node('Title');
    const uiTransform = titleNode.addComponent(UITransform);
    uiTransform.setContentSize(800, 60);
    uiTransform.setAnchorPoint(0.5, 1);
    titleNode.setPosition(0, view.getVisibleSize().height / 2 - 10, 0);

    const label = titleNode.addComponent(Label);
    label.string = 'XCFramwork 示例演示';
    label.fontSize = 36;
    label.color = new Color(255, 255, 255, 255);
    label.overflow = Overflow.NONE;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;

    canvasNode.addChild(titleNode);
  }

  private createTabBar(canvasNode: Node): void {
    const tabBarNode = new Node('TabBar');
    const uiTransform = tabBarNode.addComponent(UITransform);
    uiTransform.setContentSize(900, 50);
    uiTransform.setAnchorPoint(0.5, 1);
    tabBarNode.setPosition(0, view.getVisibleSize().height / 2 - 80, 0);

    const layout = tabBarNode.addComponent(Layout);
    layout.type = Layout.Type.HORIZONTAL;
    layout.spacingX = 8;
    layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
    layout.resizeMode = Layout.ResizeMode.NONE;

    for (let i = 0; i < TAB_NAMES.length; i++) {
      const tabNode = this.createTabButton(TAB_NAMES[i], TAB_COLORS[i], i);
      tabBarNode.addChild(tabNode);
      this.tabButtons.push(tabNode.getComponent(Button)!);
    }

    canvasNode.addChild(tabBarNode);
  }

  private createTabButton(name: string, color: Color, index: number): Node {
    const btnNode = new Node(`Tab_${name}`);
    const uiTransform = btnNode.addComponent(UITransform);
    uiTransform.setContentSize(120, 40);

    const sprite = btnNode.addComponent(Sprite);
    sprite.color = color;

    const label = btnNode.addComponent(Label);
    label.string = name;
    label.fontSize = 18;
    label.color = new Color(255, 255, 255, 255);
    label.overflow = Overflow.NONE;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;

    const button = btnNode.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.9;

    btnNode.on(Button.EventType.CLICK, () => this.showTab(index), this);

    return btnNode;
  }

  private createPanels(canvasNode: Node): void {
    const visibleSize = view.getVisibleSize();
    const panelY = visibleSize.height / 2 - 140;
    const panelHeight = visibleSize.height - 140 - 120;

    for (let i = 0; i < TAB_NAMES.length; i++) {
      const panelNode = new Node(`Panel_${TAB_NAMES[i]}`);
      const uiTransform = panelNode.addComponent(UITransform);
      uiTransform.setContentSize(visibleSize.width - 40, panelHeight);
      uiTransform.setAnchorPoint(0.5, 1);
      panelNode.setPosition(0, panelY, 0);
      panelNode.active = false;

      this.buildPanelContent(panelNode, i);
      canvasNode.addChild(panelNode);
      this.panels.push(panelNode);
    }
  }

  private buildPanelContent(panelNode: Node, index: number): void {
    switch (index) {
      case 0:
        this.buildEventBusPanel(panelNode);
        break;
      case 1:
        this.buildUIManagerPanel(panelNode);
        break;
      case 2:
        this.buildSaveServicePanel(panelNode);
        break;
      case 3:
        this.buildAudioManagerPanel(panelNode);
        break;
      case 4:
        this.buildLocalizationPanel(panelNode);
        break;
      case 5:
        this.buildTimerManagerPanel(panelNode);
        break;
      case 6:
        this.buildPoolManagerPanel(panelNode);
        break;
    }
  }

  private findExampleNode(panelNode: Node, index: number): Node | null {
    if (!this.canvasNode) {
      return null;
    }
    const nodeName = EXAMPLE_NODE_NAMES[index];
    const existingNode = this.canvasNode.getChildByName(nodeName);
    if (existingNode) {
      panelNode.addChild(existingNode);
      existingNode.active = true;
      return existingNode;
    }
    return null;
  }

  private createButton(
    parent: Node,
    name: string,
    text: string,
    x: number,
    y: number,
    width: number = 160,
    height: number = 50
  ): Button {
    const btnNode = new Node(name);
    const uiTransform = btnNode.addComponent(UITransform);
    uiTransform.setContentSize(width, height);
    btnNode.setPosition(x, y, 0);

    const sprite = btnNode.addComponent(Sprite);
    sprite.color = new Color(70, 70, 80, 255);

    const label = btnNode.addComponent(Label);
    label.string = text;
    label.fontSize = 20;
    label.color = new Color(255, 255, 255, 255);
    label.overflow = Overflow.NONE;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;

    const button = btnNode.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.9;

    parent.addChild(btnNode);
    return button;
  }

  private createLabel(
    parent: Node,
    name: string,
    text: string,
    x: number,
    y: number,
    width: number = 400,
    height: number = 40,
    fontSize: number = 20
  ): Label {
    const labelNode = new Node(name);
    const uiTransform = labelNode.addComponent(UITransform);
    uiTransform.setContentSize(width, height);
    labelNode.setPosition(x, y, 0);

    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = new Color(200, 200, 210, 255);
    label.overflow = Overflow.CLAMP;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;

    parent.addChild(labelNode);
    return label;
  }

  private createSlider(
    parent: Node,
    name: string,
    x: number,
    y: number,
    width: number = 200
  ): Slider {
    const sliderNode = new Node(name);
    const uiTransform = sliderNode.addComponent(UITransform);
    uiTransform.setContentSize(width, 20);
    sliderNode.setPosition(x, y, 0);

    const slider = sliderNode.addComponent(Slider);
    slider.direction = Slider.Direction.Horizontal;

    const handleNode = new Node('Handle');
    const handleTransform = handleNode.addComponent(UITransform);
    handleTransform.setContentSize(30, 30);
    const handleSprite = handleNode.addComponent(Sprite);
    handleSprite.color = new Color(100, 180, 255, 255);
    sliderNode.addChild(handleNode);
    slider.handle = handleSprite;

    parent.addChild(sliderNode);
    return slider;
  }

  private createToggle(parent: Node, name: string, text: string, x: number, y: number): Toggle {
    const toggleNode = new Node(name);
    const uiTransform = toggleNode.addComponent(UITransform);
    uiTransform.setContentSize(200, 40);
    toggleNode.setPosition(x, y, 0);

    const toggle = toggleNode.addComponent(Toggle);

    const checkNode = new Node('Checkmark');
    const checkTransform = checkNode.addComponent(UITransform);
    checkTransform.setContentSize(30, 30);
    const checkSprite = checkNode.addComponent(Sprite);
    checkSprite.color = new Color(100, 180, 100, 255);
    toggleNode.addChild(checkNode);
    toggle.checkMark = checkSprite;

    const labelNode = new Node('Label');
    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(150, 40);
    labelNode.setPosition(40, 0, 0);
    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = 18;
    label.color = new Color(200, 200, 210, 255);
    toggleNode.addChild(labelNode);

    parent.addChild(toggleNode);
    return toggle;
  }

  private buildEventBusPanel(panelNode: Node): void {
    const resultLabel = this.createLabel(
      panelNode,
      'ResultLabel',
      '事件日志区域',
      0,
      -80,
      800,
      200,
      16
    );

    const testButton = this.createButton(panelNode, 'TestButton', '触发事件', 0, 20);

    const exampleNode = this.findExampleNode(panelNode, 0);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExampleEventBus);
      if (comp) {
        comp.resultLabel = resultLabel;
        comp.testButton = testButton;
      }
    }
  }

  private buildUIManagerPanel(panelNode: Node): void {
    const resultLabel = this.createLabel(
      panelNode,
      'ResultLabel',
      'UIManager 操作结果',
      0,
      -80,
      800,
      200,
      16
    );

    const openConfirmButton = this.createButton(
      panelNode,
      'OpenConfirmButton',
      '打开确认弹窗',
      -180,
      20
    );
    const openToastButton = this.createButton(panelNode, 'OpenToastButton', '打开提示弹窗', 0, 20);
    const closeAllButton = this.createButton(panelNode, 'CloseAllButton', '关闭所有弹窗', 180, 20);

    const exampleNode = this.findExampleNode(panelNode, 1);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExampleUIManager);
      if (comp) {
        comp.resultLabel = resultLabel;
        comp.openConfirmButton = openConfirmButton;
        comp.openToastButton = openToastButton;
        comp.closeAllButton = closeAllButton;
      }
    }
  }

  private buildSaveServicePanel(panelNode: Node): void {
    const resultLabel = this.createLabel(
      panelNode,
      'ResultLabel',
      '存档操作结果',
      0,
      -80,
      800,
      200,
      16
    );

    const saveButton = this.createButton(panelNode, 'SaveButton', '保存存档', -180, 20);
    const loadButton = this.createButton(panelNode, 'LoadButton', '读取存档', 0, 20);
    const deleteButton = this.createButton(panelNode, 'DeleteButton', '删除存档', 180, 20);

    const exampleNode = this.findExampleNode(panelNode, 2);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExampleSaveService);
      if (comp) {
        comp.resultLabel = resultLabel;
        comp.saveButton = saveButton;
        comp.loadButton = loadButton;
        comp.deleteButton = deleteButton;
      }
    }
  }

  private buildAudioManagerPanel(panelNode: Node): void {
    const statusLabel = this.createLabel(
      panelNode,
      'StatusLabel',
      '音频状态',
      0,
      -120,
      800,
      200,
      16
    );

    const playMusicButton = this.createButton(panelNode, 'PlayMusicButton', '播放音乐', -240, 40);
    const stopMusicButton = this.createButton(panelNode, 'StopMusicButton', '停止音乐', -80, 40);
    const playSfxButton = this.createButton(panelNode, 'PlaySfxButton', '播放音效', 80, 40);

    this.createLabel(panelNode, 'MasterVolLabel', '主音量', -240, -10, 100, 30, 14);
    const masterVolumeSlider = this.createSlider(panelNode, 'MasterVolumeSlider', -160, -10);

    this.createLabel(panelNode, 'MusicVolLabel', '音乐音量', -240, -50, 100, 30, 14);
    const musicVolumeSlider = this.createSlider(panelNode, 'MusicVolumeSlider', -160, -50);

    this.createLabel(panelNode, 'SfxVolLabel', '音效音量', -240, -90, 100, 30, 14);
    const sfxVolumeSlider = this.createSlider(panelNode, 'SfxVolumeSlider', -160, -90);

    const exampleNode = this.findExampleNode(panelNode, 3);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExampleAudioManager);
      if (comp) {
        comp.statusLabel = statusLabel;
        comp.playMusicButton = playMusicButton;
        comp.stopMusicButton = stopMusicButton;
        comp.playSfxButton = playSfxButton;
        comp.masterVolumeSlider = masterVolumeSlider;
        comp.musicVolumeSlider = musicVolumeSlider;
        comp.sfxVolumeSlider = sfxVolumeSlider;
      }
    }
  }

  private buildLocalizationPanel(panelNode: Node): void {
    const textLabel = this.createLabel(panelNode, 'TextLabel', '本地化文本', 0, 20, 800, 40, 20);
    const numberLabel = this.createLabel(
      panelNode,
      'NumberLabel',
      '数字格式化',
      0,
      -20,
      800,
      40,
      20
    );
    const dateLabel = this.createLabel(panelNode, 'DateLabel', '日期格式化', 0, -60, 800, 40, 20);

    const languageToggle = this.createToggle(
      panelNode,
      'LanguageToggle',
      '切换语言(中/英)',
      -100,
      -110
    );

    const refreshButton = this.createButton(
      panelNode,
      'RefreshButton',
      '刷新文本',
      100,
      -110,
      120,
      40
    );

    const exampleNode = this.findExampleNode(panelNode, 4);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExampleLocalization);
      if (comp) {
        comp.textLabel = textLabel;
        comp.numberLabel = numberLabel;
        comp.dateLabel = dateLabel;
        comp.languageToggle = languageToggle;
        comp.refreshButton = refreshButton;
      }
    }
  }

  private buildTimerManagerPanel(panelNode: Node): void {
    const statusLabel = this.createLabel(
      panelNode,
      'StatusLabel',
      '定时器状态',
      0,
      -80,
      800,
      200,
      16
    );

    const delayButton = this.createButton(panelNode, 'DelayButton', '延迟3秒', -240, 20);
    const intervalButton = this.createButton(panelNode, 'IntervalButton', '循环1秒', -80, 20);
    const countdownButton = this.createButton(panelNode, 'CountdownButton', '倒计时10秒', 80, 20);
    const cancelButton = this.createButton(panelNode, 'CancelButton', '取消全部', 240, 20);

    const exampleNode = this.findExampleNode(panelNode, 5);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExampleTimerManager);
      if (comp) {
        comp.statusLabel = statusLabel;
        comp.delayButton = delayButton;
        comp.intervalButton = intervalButton;
        comp.countdownButton = countdownButton;
        comp.cancelButton = cancelButton;
      }
    }
  }

  private buildPoolManagerPanel(panelNode: Node): void {
    const statusLabel = this.createLabel(
      panelNode,
      'StatusLabel',
      '对象池状态',
      0,
      -80,
      800,
      200,
      16
    );

    const registerButton = this.createButton(panelNode, 'RegisterButton', '注册对象池', -240, 20);
    const getButton = this.createButton(panelNode, 'GetButton', '获取对象', -80, 20);
    const releaseButton = this.createButton(panelNode, 'ReleaseButton', '释放对象', 80, 20);
    const infoButton = this.createButton(panelNode, 'InfoButton', '显示池信息', 240, 20);

    const exampleNode = this.findExampleNode(panelNode, 6);
    if (exampleNode) {
      const comp = exampleNode.getComponent(ExamplePoolManager);
      if (comp) {
        comp.statusLabel = statusLabel;
        comp.registerButton = registerButton;
        comp.getButton = getButton;
        comp.releaseButton = releaseButton;
        comp.infoButton = infoButton;
      }
    }
  }

  private createResultArea(canvasNode: Node): void {
    const visibleSize = view.getVisibleSize();
    const resultNode = new Node('ResultArea');
    const uiTransform = resultNode.addComponent(UITransform);
    uiTransform.setContentSize(visibleSize.width - 40, 100);
    uiTransform.setAnchorPoint(0.5, 0);
    resultNode.setPosition(0, -visibleSize.height / 2 + 10, 0);

    const bgSprite = resultNode.addComponent(Sprite);
    bgSprite.color = new Color(40, 40, 50, 200);

    const label = resultNode.addComponent(Label);
    label.string = '通用日志输出区域';
    label.fontSize = 16;
    label.color = new Color(180, 180, 190, 255);
    label.overflow = Overflow.CLAMP;
    label.horizontalAlign = HorizontalTextAlignment.LEFT;
    label.verticalAlign = VerticalTextAlignment.TOP;

    canvasNode.addChild(resultNode);
    this.resultLabel = label;
  }

  private showTab(index: number): void {
    this.currentTab = index;

    for (let i = 0; i < this.panels.length; i++) {
      this.panels[i].active = i === index;
    }

    for (let i = 0; i < this.tabButtons.length; i++) {
      const sprite = this.tabButtons[i].node.getComponent(Sprite);
      if (sprite) {
        if (i === index) {
          sprite.color = TAB_COLORS[i];
        } else {
          sprite.color = new Color(50, 50, 60, 255);
        }
      }
    }

    if (this.resultLabel) {
      this.resultLabel.string = `当前示例: ${TAB_NAMES[index]}`;
    }
  }
}
