declare module "html5-qrcode" {
  export class Html5Qrcode {
    constructor(elementId: string, config?: unknown);

    start(
      cameraConfig: { facingMode: "environment" | "user" } | string,
      config: { fps?: number; qrbox?: { width: number; height: number } },
      successCallback: (decodedText: string, decodedResult?: unknown) => void,
      errorCallback?: (errorMessage: string, error?: unknown) => void
    ): Promise<void>;

    stop(): Promise<void>;
    clear(): Promise<void>;
  }
}
