export interface UIViewOpenedPayload {
  viewId: string;
  type: string;
}

export interface UIViewClosedPayload {
  viewId: string;
}

export interface UILanguageChangedPayload {
  language: string;
}

export interface SceneChangedPayload {
  sceneName: string;
}
export interface HotUpdateStateChangedPayload {
  state: string;
  isForceUpdate: boolean;
  remoteVersion: string;
  localVersion: string;
  updateNotes: string;
}

export interface HotUpdateProgressPayload {
  state: string;
  downloadedBytes: number;
  totalBytes: number;
  fileIndex: number;
  totalFiles: number;
  currentFile: string;
  speedBytesPerSec: number;
}
