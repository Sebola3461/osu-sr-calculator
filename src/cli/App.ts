import { AppConsole } from "./AppConsole";
import { Updater } from "./Updater";
import { LegacyIpcManager } from "../ipc/LegacyIpcManager";

export class App {
  public console: AppConsole;
  public ipc: LegacyIpcManager.Client;
  public updater: Updater;

  constructor() {
    this.console = new AppConsole(this);
    this.console.printTitle();

    this.updater = new Updater(this);
    this.ipc = new LegacyIpcManager.Client(this);

    this.ipc.listen();

    this.updater.checkForUpdates();
  }
}
