/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Modal, Notice, Setting } from 'obsidian'

import { CodenaryContent } from '../types'
import CustomLoadingComponent from './loading_component'
import CodenaryContentPlugin from '../main'

export class SubmitConfirmModal extends Modal {

	constructor(
		readonly plugin: CodenaryContentPlugin,
		readonly postData: CodenaryContent,
		readonly callback: (variables: CodenaryContent) => void,
	) {
		super(plugin.app)
	}

	validateRequiredFields() {
		const requiredFields: Array<keyof CodenaryContent> = [ 'title', 'text' ]
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
			.addButton(btn => {
				btn.setButtonText('취소')
				btn.onClick(() => this.close())
			})
			.addButton(btn => {
				btn.setCta()
				btn.setButtonText('등록')
				btn.onClick(() => this.handleSubmit())
			})
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.createEl('h2', { text: '코드너리에 등록하기' })
		const loading = CustomLoadingComponent(contentEl)
		this.createUI(contentEl)
		loading.remove()
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
