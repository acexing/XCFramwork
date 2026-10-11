import { _decorator, Label, Sprite } from 'cc';
import { DEMO_COLORS, FONT_SIZE } from './DemoTheme';
import { SPRITES } from './UISprites';
import { UIBuilder } from './UIBuilder';
import { BaseDialog } from './BaseDialog';

const { ccclass } = _decorator;


const INPUT_BORDER = { left: 40, top: 40, right: 40, bottom: 40 };

@ccclass('LoginDialog')
export class LoginDialog extends BaseDialog {
  public onLoad(): void {
    this.buildDialogShell({
      panelWidth: 1060,
      panelHeight: 760,
      headerTitle: 'SIGN IN',
      headerIcon: SPRITES.CHARACTER_BOY,
    });
    this.buildForm();
  }

  private buildForm(): void {
    if (!this.panel) {
      return;
    }
    const emailInput = UIBuilder.sprite(
      this.panel,
      'InputEmail',
      SPRITES.INPUT_FIELD_FRAME_WHITE1,
      0,
      100,
      840,
      110,
      { border: INPUT_BORDER }
    );
    emailInput.color = DEMO_COLORS.WHITE;
    UIBuilder.sprite(emailInput.node, 'Icon', SPRITES.INPUT_FIELD_ICON_EMAIL, -360, 0, 70, 70);
    UIBuilder.label(emailInput.node, 'Placeholder', 'E-mail address', 30, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_DARK);

    const passwordInput = UIBuilder.sprite(
      this.panel,
      'InputPassword',
      SPRITES.INPUT_FIELD_FRAME_WHITE1,
      0,
      -40,
      840,
      110,
      { border: INPUT_BORDER }
    );
    passwordInput.color = DEMO_COLORS.PANEL_BG;
    UIBuilder.sprite(passwordInput.node, 'Icon', SPRITES.INPUT_FIELD_ICON_PASSWORD, -360, 0, 70, 70);
    UIBuilder.label(passwordInput.node, 'Placeholder', 'Password', 30, 0, FONT_SIZE.BODY, DEMO_COLORS.TEXT_HINT);

    const fbButton = UIBuilder.button(this.panel, 'BtnFacebook', 0, -180, 840, 110);
    const fbBg = fbButton.node.addComponent(Sprite);
    fbBg.color = DEMO_COLORS.FACEBOOK;
    UIBuilder.sprite(fbButton.node, 'Icon', SPRITES.ICON_SNS_FACEBOOK, -320, 0, 64, 64);
    UIBuilder.label(
      fbButton.node,
      'Label',
      'Sign in with facebook',
      40,
      0,
      FONT_SIZE.BODY,
      DEMO_COLORS.WHITE,
      true
    );

    const signInButton = UIBuilder.button(this.panel, 'BtnSignIn', 0, -300, 1060, 140, () => {
      this.closeSelf();
    });
    const signInBg = signInButton.node.addComponent(Sprite);
    signInBg.color = DEMO_COLORS.PRIMARY;
    const signInLabel = signInButton.node.addComponent(Label);
    signInLabel.string = 'SIGN IN';
    signInLabel.fontSize = FONT_SIZE.BUTTON;
    signInLabel.color = DEMO_COLORS.WHITE;
    signInLabel.isBold = true;

  }
}