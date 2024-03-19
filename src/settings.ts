import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import CodenaryContentPlugin from './main'

export interface CodenaryContentPluginSettings {
	attachmentsFolder: string;
	contentFolder: string;
	userToken?: string
}

export class CodenaryContentSetting implements CodenaryContentPluginSettings {
	attachmentsFolder: string
	contentFolder: string
	userToken: string

	constructor() {
		this.attachmentsFolder = 'attachments'
		this.contentFolder = 'codenary'
		this.userToken = ''
	}

}

export class CodenaryContentSettingTab extends PluginSettingTab {
	plugin: CodenaryContentPlugin

	constructor(app: App, plugin: CodenaryContentPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	async saveSettings(name: keyof CodenaryContentPluginSettings, value: string) {
		if (this.plugin.settings && this.plugin.settings[name] !== value) {
		  this.plugin.settings[name] = value
		  await this.plugin.saveSettings()
		}
	  }

	display(): void {
		this.containerEl.empty()
		this.containerEl.createEl('h1', {
			text: 'Settings for Codenary Content plugin',
		})
		this.containerEl.createEl('h2', {
			text: 'Path Settings',
		})
		this.addContentFolderSetting()
		this.addAttachmentsFolderSetting()
		this.containerEl.createEl('h2', {
			text: 'User Settings',
		})
		this.addUserTokenSetting()
	}

	private addUserTokenSetting() {
		new Setting(this.containerEl)
			.setName('Your Codenary Account Token')
			.setDesc('마이페이지에서 생성한 토큰 입력')
			.addText(text => text
				.setPlaceholder('Enter user token')
				.setValue(this.plugin.settings?.userToken || '')
				.onChange(async (value) => {
					this.saveSettings('userToken', value)
				}))
	}

	private addAttachmentsFolderSetting() {
		new Setting(this.containerEl)
			.setName('Folder to store attachments in')
			.setDesc('Where the attachments will be stored.')
			.addText(text => text
				.setPlaceholder('Enter folder name')
				.setValue(this.plugin.settings?.attachmentsFolder || 'attachments')
				.onChange(async (value) => {
					this.saveSettings('attachmentsFolder', value)
				}))
	}

	private addContentFolderSetting() {
		new Setting(this.containerEl)
			.setName('Folder to store content in')
			.setDesc('Where the contents will be stored.')
			.addText(text => text
				.setPlaceholder('Enter folder name')
				.setValue(this.plugin.settings?.contentFolder || 'codenary')
				.onChange(async (value) => {
					this.saveSettings('contentFolder', value)
				}))
	}

}
