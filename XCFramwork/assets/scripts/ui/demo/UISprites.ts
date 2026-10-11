import { Rect, Sprite, SpriteFrame } from 'cc';
import { SERVICE_TOKENS } from '../../core/interfaces/ServiceTokens';
import { IAssetService } from '../../core/interfaces/IAssetService';
import { ServiceRegistry } from '../../app/ServiceRegistry';

const SPRITE_ROOT = 'UI/ResourceData/Sprites';

const spr = (relativePath: string): string => `${SPRITE_ROOT}/${relativePath}`;

export const SPRITES = {
  BG_PAGE: spr('Demo/Demo_Background/Background_00'),
  BG_DIMED: spr('Demo/Demo_Background/Background_Dimed'),
  IMAGE_LINE_DOT: spr('Demo/Demo_Image/Image_Line_Dot'),

  BTN_BLACK_BACK: spr('Demo/Demo_Button/btn_black_back'),
  BTN_BLACK_CLOSE: spr('Demo/Demo_Button/btn_black_close'),
  BTN_BLACK_PAUSE: spr('Demo/Demo_Button/btn_black_pause'),
  BTN_START: spr('Demo/Demo_Button/btn_start'),
  PAUSE_BTN_RESTART: spr('Demo/Demo_Button/pause_btn_restart'),
  PAUSE_BTN_RESUME: spr('Demo/Demo_Button/pause_btn_resume'),
  PAUSE_BTN_EXIT: spr('Demo/Demo_Button/pause_btn_exit'),
  PAGE_NAVI_PREV_N: spr('Demo/Demo_Button/btn_page_prev_n'),
  PAGE_NAVI_NEXT_N: spr('Demo/Demo_Button/btn_page_next_n'),

  ICON_BELL: spr('Demo/Demo_Icon/Icon_Bell'),
  ICON_CHECK: spr('Demo/Demo_Icon/Icon_Check'),
  ICON_COIN: spr('Demo/Demo_Icon/Icon_Coin0'),
  ICON_DOLLAR: spr('Demo/Demo_Icon/Icon_Dollar'),
  ICON_GEM: spr('Demo/Demo_Icon/Icon_Gem'),
  ICON_HAND: spr('Demo/Demo_Icon/Icon_Hand'),
  ICON_HOME: spr('Demo/Demo_Icon/Icon_Home'),
  ICON_LIFE: spr('Demo/Demo_Icon/Icon_Life0'),
  ICON_LOCK: spr('Demo/Demo_Icon/Icon_Lock'),
  ICON_MEDAL_GOLD: spr('Demo/Demo_Icon/Icon_Medal_Gold'),
  ICON_MEDAL_SILVER: spr('Demo/Demo_Icon/Icon_Medal_Silver'),
  ICON_MEDAL_BRONZE: spr('Demo/Demo_Icon/Icon_Medal_bronze'),
  ICON_MOVIE: spr('Demo/Demo_Icon/Icon_Movie'),
  ICON_MUSIC: spr('Demo/Demo_Icon/Icon_Music'),
  ICON_NOTICE: spr('Demo/Demo_Icon/Icon_Notice'),
  ICON_RESTART: spr('Demo/Demo_Icon/Icon_Restart'),
  ICON_RESUME: spr('Demo/Demo_Icon/Icon_Resume'),
  ICON_SNS_FACEBOOK: spr('Demo/Demo_Icon/Icon_Sns_Facebook0'),
  ICON_SNS_GOOGLE: spr('Demo/Demo_Icon/Icon_Sns_Google'),
  ICON_SNS_TWITTER: spr('Demo/Demo_Icon/Icon_Sns_Twitter'),
  ICON_SOUND: spr('Demo/Demo_Icon/Icon_Sound'),
  ICON_STAR: spr('Demo/Demo_Icon/Icon_Star'),
  ICON_TIMER: spr('Demo/Demo_Icon/Icon_Timer'),
  ICON_USER: spr('Demo/Demo_Icon/Icon_User'),
  CHARACTER_BOY: spr('Demo/Demo_Icon/Character00_Boy'),
  CHARACTER_GIRL: spr('Demo/Demo_Icon/Character00_Girl'),
  SHOP_ICON_COIN_01: spr('Demo/Demo_Icon/ShopIcon_Coin01'),
  SHOP_ICON_COIN_02: spr('Demo/Demo_Icon/ShopIcon_Coin02'),
  SHOP_ICON_COIN_03: spr('Demo/Demo_Icon/ShopIcon_Coin03'),
  SHOP_ICON_COIN_04: spr('Demo/Demo_Icon/ShopIcon_Coin04'),
  SHOP_ICON_GEM_01: spr('Demo/Demo_Icon/ShopIcon_Gem01'),
  SHOP_ICON_GEM_02: spr('Demo/Demo_Icon/ShopIcon_Gem02'),
  SHOP_ICON_GEM_03: spr('Demo/Demo_Icon/ShopIcon_Gem03'),
  SHOP_ICON_GEM_04: spr('Demo/Demo_Icon/ShopIcon_Gem04'),
  STAR_GRADE_00_ON: spr('Demo/Demo_Icon/StarGrade00_On'),
  STAR_GRADE_00_OFF: spr('Demo/Demo_Icon/StarGrade00_Off'),
  STAR_GRADE_01_ON_1: spr('Demo/Demo_Icon/StarGrade01_On1'),
  STAR_GRADE_01_ON_2: spr('Demo/Demo_Icon/StarGrade01_On2'),
  STAR_GRADE_01_ON_3: spr('Demo/Demo_Icon/StarGrade01_On3'),
  STAR_GRADE_01_OFF: spr('Demo/Demo_Icon/StarGrade01_Off'),
  STAR_GRADE_02_ON_1: spr('Demo/Demo_Icon/StarGrade02_On1'),
  STAR_GRADE_02_ON_2: spr('Demo/Demo_Icon/StarGrade02_On2'),
  STAR_GRADE_02_ON_3: spr('Demo/Demo_Icon/StarGrade02_On3'),
  STAR_GRADE_02_OFF: spr('Demo/Demo_Icon/StarGrade02_Off'),
  TITLE_ICON_MESSAGE: spr('Demo/Demo_Icon/TitleIcon_Message'),
  TITLE_ICON_MISSION: spr('Demo/Demo_Icon/TitleIcon_Mission'),
  TITLE_ICON_RANKING: spr('Demo/Demo_Icon/TitleIcon_Ranking'),
  TITLE_ICON_SETTING: spr('Demo/Demo_Icon/TitleIcon_Setting'),
  TITLE_ICON_SHOP: spr('Demo/Demo_Icon/TitleIcon_Shop'),

  BTN_OVAL_BLUE: spr('Components/Button/Btn_Oval00_Blue'),
  BTN_OVAL_CHARCOAL: spr('Components/Button/Btn_Oval00_Charcoal'),
  BTN_OVAL_WHITE: spr('Components/Button/Btn_Oval00_White'),
  BTN_OVAL01_WHITE1: spr('Components/Button/Btn_Oval01_White1'),
  BTN_CIRCLE_108: spr('Components/Button/Btn_Circle_108'),

  POPUP_00: spr('Components/Popup/Popup00'),
  POPUP_01: spr('Components/Popup/Popup01'),
  POPUP_02: spr('Components/Popup/Popup02'),
  POPUP_00_BUTTON_N: spr('Components/Popup/Popup00_Button_n'),
  POPUP_00_BUTTON_S: spr('Components/Popup/Popup00_Button_s'),
  POPUP_00_BUTTON_WHITE: spr('Components/Popup/Popup00_Button_white'),
  POPUP_01_BUTTON_01_N: spr('Components/Popup/Popup01_Button01_n'),
  POPUP_01_BUTTON_01_S: spr('Components/Popup/Popup01_Button01_s'),
  POPUP_01_BUTTON_01_WHITE: spr('Components/Popup/Popup01_Button01_white'),

  LIST_FRAME_00: spr('Components/Frame/ListFrame00'),
  LIST_FRAME_01_N: spr('Components/Frame/ListFrame01_n'),
  LIST_FRAME_01_D: spr('Components/Frame/ListFrame01_d'),
  LIST_FRAME_01_D_WHITE: spr('Components/Frame/ListFrame01_d_white'),
  TABLE_FRAME_00: spr('Components/Frame/TableFrame00'),
  TABLE_FRAME_01: spr('Components/Frame/TableFrame01'),
  STAGE_FRAME_WHITE_N1: spr('Components/Frame/StageFrame_White_n1'),
  STAGE_FRAME_WHITE_N2: spr('Components/Frame/StageFrame_White_n2'),
  STAGE_FRAME_WHITE_S1: spr('Components/Frame/StageFrame_White_s1'),
  STAGE_FRAME_WHITE_D: spr('Components/Frame/StageFrame_White_d'),
  PANEL_FRAME_TOPBAR: spr('Components/Frame/PanelFrame_TopBar'),

  ICON_180_AVATAR_BOY: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_avatar_boy'),
  ICON_180_AVATAR_GIRL: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_avatar_girl'),
  ICON_180_BOMB: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_bomb'),
  ICON_180_CHEST: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_chest'),
  ICON_180_COIN: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_coin'),
  ICON_180_GEM: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_gem'),
  ICON_180_KEY: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_key'),
  ICON_180_LIFE: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_life'),
  ICON_180_LOCK: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_lock'),
  ICON_180_LOCK_DIM: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_lock_dim'),
  ICON_180_MEDAL: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_medal'),
  ICON_180_MESSAGE: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_message'),
  ICON_180_MONSTER: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_monster'),
  ICON_180_SHIELD_BLUE: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_shield_blue'),
  ICON_180_SHIELD_RED: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_shield_red'),
  ICON_180_STAR1: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_star1'),
  ICON_180_STAR2: spr('Components/ItemIcons/ItemIcon_Circle_180/icon_180_star2'),

  SLIDER_03_FRAME: spr('Components/Slider/Slider03_Frame'),
  SLIDER_03_FILL: spr('Components/Slider/Slider03_Fill'),
  SLIDER_03_FILL_AREA: spr('Components/Slider/Slider03_FillArea'),
  SLIDER_01_HANDLE_BLUE: spr('Components/Slider/Slider01_Handle_Blue'),
  SLIDER_01_HANDLE_GRAY: spr('Components/Slider/Slider01_Handle_Gray'),
  SLIDER_ICON_FRAME: spr('Components/Slider/Slider_IconType_IconFrame'),
  SLIDER_ICON_BOMB: spr('Components/Slider/Slider_IconType_Icon_Bomb'),
  SLIDER_ICON_PLUS_TIME: spr('Components/Slider/Slider_IconType_Icon_PlusTime'),
  SLIDER_ICON_POTION: spr('Components/Slider/Slider_IconType_Icon_Potion'),
  SLIDER_ICON_SHIELD: spr('Components/Slider/Slider_IconType_Icon_Shield'),

  INPUT_FIELD_FRAME_S: spr('Components/UI_Etc/InputField_Frame_s'),
  INPUT_FIELD_FRAME_WHITE1: spr('Components/UI_Etc/InputField_Frame_white1'),
  INPUT_FIELD_ICON_EMAIL: spr('Components/UI_Etc/InputField_Icon_Email_n'),
  INPUT_FIELD_ICON_PASSWORD: spr('Components/UI_Etc/InputField_Icon_Password_n'),
  LABEL_RIBBON_00_L: spr('Components/UI_Etc/Label_Ribbon00_l'),
  LABEL_RIBBON_00_M: spr('Components/UI_Etc/Label_Ribbon00_m'),
  LABEL_RIBBON_00_S: spr('Components/UI_Etc/Label_Ribbon00_s'),
  LABEL_RIBBON_01: spr('Components/UI_Etc/Label_Ribbon01'),
  LABEL_SPEECH_BUBBLE_00: spr('Components/UI_Etc/Label_SpeechBubble00'),
  LABEL_SPEECH_BUBBLE_01: spr('Components/UI_Etc/Label_SpeechBubble01'),
  LABEL_TAG: spr('Components/UI_Etc/Label_Tag'),
  LABEL_ZIGZAG: spr('Components/UI_Etc/Label_Zigzag'),
  NOTIFY_BLUE: spr('Components/UI_Etc/Notify_Blue'),
  NOTIFY_ORANGE: spr('Components/UI_Etc/Notify_Orange'),
  NOTIFY_WHITE1: spr('Components/UI_Etc/Notify_White1'),
  PAGE_NAVI_ON: spr('Components/UI_Etc/PageNavi_On'),
  PAGE_NAVI_OFF: spr('Components/UI_Etc/PageNavi_Off'),
  STATUS_FRAME: spr('Components/UI_Etc/Status_Frame'),
  STATUS_BTN_N: spr('Components/UI_Etc/Status_Btn_n'),
  STATUS_BTN_S: spr('Components/UI_Etc/Status_Btn_s'),
  STATUS_ICON_COIN: spr('Components/UI_Etc/Status_Icon_Coin'),
  STATUS_ICON_GEM: spr('Components/UI_Etc/Status_Icon_Gem'),
  STATUS_ICON_LIFE: spr('Components/UI_Etc/Status_Icon_Life'),
  STATUS_ICON_STAR: spr('Components/UI_Etc/Status_Icon_Star'),
  TOGGLE_SWITCH_FRAME_ON: spr('Components/UI_Etc/Toggle_Switch_Frame_on'),
  TOGGLE_SWITCH_FRAME_OFF: spr('Components/UI_Etc/Toggle_Switch_Frame_off'),
  TOGGLE_SWITCH_HANDLE: spr('Components/UI_Etc/Toggle_Switch_Handle'),
  TOGGLE_CHECK_ON: spr('Components/UI_Etc/Toggle_Check_On1'),
} as const;

export interface SpriteBorder {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function bindSprite(target: Sprite, path: string, border?: SpriteBorder): void {
  let assetService: IAssetService;
  try {
    assetService = ServiceRegistry.get<IAssetService>(SERVICE_TOKENS.ASSET_SERVICE);
  } catch {
    return;
  }
  void assetService
    .loadSpriteFrame('resources', path)
    .then((frame: SpriteFrame) => {
      if (!target.isValid) {
        return;
      }
      if (border) {
        (frame as unknown as { border: Rect }).border = new Rect(border.left, border.bottom, border.right, border.top);
        target.type = Sprite.Type.SLICED;
      }
      target.spriteFrame = frame;
    })
    .catch(() => undefined);
}