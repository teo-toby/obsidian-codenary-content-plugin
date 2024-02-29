import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import O2Plugin from './main';
import CodenaryContentPlugin from './main';

export interface CodenaryContentPluginSettings {
  attachmentsFolder: string;
  contentFolder: string;
  userToken: string
}

export class CodenaryContentSetting implements CodenaryContentPluginSettings {
  attachmentsFolder: string;
  contentFolder: string;
  userToken: string


  constructor() {
    this.attachmentsFolder = 'attachments';
    this.contentFolder = 'contents';
	this.userToken = ''
  }


}

export class CodenaryContentSettingTab extends PluginSettingTab {
  plugin: CodenaryContentPlugin;

  constructor(app: App, plugin: CodenaryContentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();
    this.containerEl.createEl('h1', {
      text: 'Settings for Codenary Content plugin',
    });
    this.containerEl.createEl('h2', {
      text: 'Path Settings',
    });
    this.addContentFolderSetting();
    this.addAttachmentsFolderSetting();
    this.containerEl.createEl('h2', {
      text: 'User Settings',
    });
    this.addUserTokenSetting();
  }


  private addUserTokenSetting() {
    new Setting(this.containerEl)
      .setName('Your Codenary Account Token')
      .setDesc('마이페이지에서 생성한 토큰 입력')
      .addText(text => text
        .setPlaceholder('Enter user token')
        .setValue(this.plugin.settings.userToken)
        .onChange(async (value) => {
          this.plugin.settings.userToken = value;
          await this.plugin.saveSettings();
        }));
  }


  private addAttachmentsFolderSetting() {
    new Setting(this.containerEl)
      .setName('Folder to store attachments in')
      .setDesc('Where the attachments will be stored.')
      .addText(text => text
        .setPlaceholder('Enter folder name')
        .setValue(this.plugin.settings.attachmentsFolder)
        .onChange(async (value) => {
          this.plugin.settings.attachmentsFolder = value;
          await this.plugin.saveSettings();
        }));
  }

  private addContentFolderSetting() {
    new Setting(this.containerEl)
      .setName('Folder to store content in')
      .setDesc('Where the contents will be stored.')
      .addText(text => text
        .setPlaceholder('Enter folder name')
        .setValue(this.plugin.settings.contentFolder)
        .onChange(async (value) => {
          this.plugin.settings.contentFolder = value;
          await this.plugin.saveSettings();
        }));
  }

}
