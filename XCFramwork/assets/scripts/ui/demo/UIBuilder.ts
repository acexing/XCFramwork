import {
  Button,
  Color,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Layout,
  Node,
  Overflow,
  Sprite,

  UITransform,
  VerticalTextAlignment,
  Widget,
  view,
} from 'cc';
import { DEMO_COLORS } from './DemoTheme';
import { bindSprite, SPRITES, SpriteBorder } from './UISprites';

export interface SpriteOptions {
  color?: Color;
  border?: SpriteBorder;
  tiled?: boolean;
}

export class UIBuilder {
  static node(
    parent: Node,
    name: string,
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    anchorX = 0.5,
    anchorY = 0.5
  ): Node {
    const node = new Node(name);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(anchorX, anchorY);
    node.setPosition(x, y, 0);
    parent.addChild(node);
    return node;
  }

  static solidSprite(
    parent: Node,
    name: string,
    color: Color,
    x = 0,
    y = 0,
    width = 100,
    height = 100
  ): Sprite {
    const node = this.node(parent, name, x, y, width, height);
    const sprite = node.addComponent(Sprite);
    sprite.color = color;
    return sprite;
  }

  static sprite(
    parent: Node,
    name: string,
    path: string,
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    options?: SpriteOptions
  ): Sprite {
    const node = this.node(parent, name, x, y, width, height);
    const sprite = node.addComponent(Sprite);
    sprite.color = options?.color ?? DEMO_COLORS.WHITE;
    if (options?.tiled) {
      sprite.type = Sprite.Type.TILED;
    }
    bindSprite(sprite, path, options?.border);
    return sprite;
  }

  static panelSprite(
    parent: Node,
    name: string,
    x = 0,
    y = 0,
    width = 200,
    height = 200,
    border?: SpriteBorder
  ): Sprite {
    return this.sprite(parent, name, SPRITES.POPUP_01, x, y, width, height, { border });
  }

  static roundedRect(
    parent: Node,
    name: string,
    color: Color,
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    radius = 24
  ): Node {
    const node = this.node(parent, name, x, y, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    return node;
  }

  static label(
    parent: Node,
    name: string,
    text: string,
    x = 0,
    y = 0,
    fontSize = 32,
    color: Color = DEMO_COLORS.TEXT_DARK,
    bold = false
  ): Label {
    const node = this.node(parent, name, x, y, 400, fontSize + 10);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
    label.color = color;
    label.isBold = bold;
    label.overflow = Overflow.NONE;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    return label;
  }

  static button(
    parent: Node,
    name: string,
    x = 0,
    y = 0,
    width = 200,
    height = 80,
    onClick?: () => void
  ): Button {
    const node = this.node(parent, name, x, y, width, height);
    const button = node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.9;
    if (onClick) {
      node.on(Button.EventType.CLICK, onClick, node);
    }
    return button;
  }

  static iconButton(
    parent: Node,
    name: string,
    iconPath: string,
    x = 0,
    y = 0,
    size = 140,
    onClick?: () => void
  ): Button {
    const button = this.button(parent, name, x, y, size, size, onClick);
    this.sprite(button.node, 'Icon', iconPath, 0, 0, size, size);
    return button;
  }

  static hLayout(node: Node, spacingX = 0): Layout {
    const layout = node.addComponent(Layout);
    layout.type = Layout.Type.HORIZONTAL;
    layout.resizeMode = Layout.ResizeMode.NONE;
    layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
    layout.spacingX = spacingX;
    return layout;
  }

  static vLayout(node: Node, spacingY = 0): Layout {
    const layout = node.addComponent(Layout);
    layout.type = Layout.Type.VERTICAL;
    layout.resizeMode = Layout.ResizeMode.NONE;
    layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
    layout.spacingY = spacingY;
    return layout;
  }

  static fullscreenWidget(node: Node): Widget {
    const widget = node.addComponent(Widget);
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.isAlignTop = true;
    widget.isAlignBottom = true;
    widget.left = 0;
    widget.right = 0;
    widget.top = 0;
    widget.bottom = 0;
    return widget;
  }

  static fullscreenNode(parent: Node, name: string): Node {
    const size = view.getVisibleSize();
    return this.node(parent, name, 0, 0, size.width, size.height);
  }

  static pageBackground(parent: Node, name = 'Background'): Sprite {
    return this.sprite(parent, name, SPRITES.BG_PAGE, 0, 0, 1920, 1080, {
      tiled: true,
      border: { left: 24, top: 24, right: 24, bottom: 24 },
    });
  }
}