/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Modal, Notice, Setting } from 'obsidian'

import { CodenaryContent } from '../main'
import CustomLoadingComponent from './loading_component'
import CodenaryContentPlugin from '../main'

export class SubmitConfirmModal extends Modal {

	constructor(
		readonly plugin: CodenaryContentPlugin,
		readonly postData: CodenaryContent,
		readonly callback: (variables: CodenaryContent) => void,
	) {
		super(plugin.app)
		this.initializePostOptions()
	}

	// postOptions 초기화
	private initializePostOptions() {

	}

	validateRequiredFields() {
		const requiredFields: Array<keyof CodenaryContent> = [ 'title', 'tags' ]
		for (const field of requiredFields) {
			if (!this.postData[field]) {
				new Notice(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
				return false
			}
		}

		return true
	}

	async handleSubmit() {
		if (this.validateRequiredFields()) {
			this.callback(this.postData)
			this.close()
		}
	}

	createUI(contentEl: HTMLElement) {
		new Setting(contentEl)
			.setName('Your Codenary Account Token')
			.setDesc('마이페이지에서 생성한 토큰 입력')
			.addText(text => text
				.setPlaceholder('Enter user token')
				.setValue(this.plugin.settings.userToken)
				.onChange(async (value) => {
					this.plugin.settings.userToken = value
					await this.plugin.saveSettings()
				}))

		// buttons
		new Setting(contentEl)
			.addButton(btn => {
				btn.setButtonText('Cancel')
				btn.onClick(() => this.close())
			})
			.addButton(btn => {
				btn.setCta()
				btn.setButtonText('Publish')
				btn.onClick(() => this.handleSubmit())
			})

		new Setting(contentEl)
			.setName('Folder to store attachments in')
			.setDesc('Where the attachments will be stored.')
			.addText(text => text
				.setPlaceholder('Enter folder name')
				.setValue(this.plugin.settings.attachmentsFolder)
				.onChange(async (value) => {
					this.plugin.settings.attachmentsFolder = value
					await this.plugin.saveSettings()
				}))
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.classList?.add('steem-plugin')
		contentEl.createEl('h2', { text: 'Publish to steemit' })
		const loading = CustomLoadingComponent(contentEl)
		this.createUI(contentEl)
		loading.remove()
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
