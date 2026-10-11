export const BUNDLE_NAMES = {
  CORE: 'core',
  UI_COMMON: 'ui_common',
  GAMEPLAY_BASE: 'gameplay_base',
  RESOURCES: 'resources',
} as const;

export const CORE_ASSET_PATHS = {
  PREFAB_LOADING_MASK: 'prefabs/ui/common/LoadingMask',
  PREFAB_CONFIRM_DIALOG: 'prefabs/ui/common/ConfirmDialog',
  PREFAB_TOAST_MESSAGE: 'prefabs/ui/common/ToastMessage',
  CONFIG_VIEWS: 'config/views',
} as const;

export const UI_COMMON_ASSET_PATHS = {
  PREFAB_MAIN_MENU: 'prefabs/ui/screens/MainMenu',
  PREFAB_SETTINGS_DIALOG: 'prefabs/ui/dialogs/SettingsDialog',
} as const;

export const GAMEPLAY_BASE_ASSET_PATHS = {
  CONFIG_ITEMS: 'config/items',
  CONFIG_LEVELS: 'config/levels',
} as const;

export const AUDIO_PATHS = {
  MUSIC_MAIN_MENU: 'audio/music/main_menu',
  MUSIC_GAMEPLAY: 'audio/music/gameplay',
  SFX_BUTTON_CLICK: 'audio/sfx/button_click',
  SFX_BUTTON_CONFIRM: 'audio/sfx/button_confirm',
  SFX_BUTTON_CANCEL: 'audio/sfx/button_cancel',
  SFX_PAGE_TURN: 'audio/sfx/page_turn',
} as const;
