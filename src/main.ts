import { Plugin } from 'obsidian';
import { CodenaryContentSetting, CodenaryContentPluginSettings, CodenaryContentSettingTab } from './settings';
import { convertToChirpy, moveToContentFolder } from './jekyll/chirpy';

export default class CodenaryContentPlugin extends Plugin {
  settings: CodenaryContentPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'move-content-folder',
      name: 'Move content to contents folder',
      checkCallback: (checking: boolean) => {
        if (checking) {
            return true;
          }
		if (this.app.workspace.activeEditor && this.app.workspace.activeEditor.editor) {
			moveToContentFolder(this, this.app.workspace.activeEditor.editor)
		}
      },
    });

    this.addSettingTab(new CodenaryContentSettingTab(this.app, this));

  }

  onunload() {

  }

  async loadSettings() {
    this.settings = Object.assign(new CodenaryContentSetting(), await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
