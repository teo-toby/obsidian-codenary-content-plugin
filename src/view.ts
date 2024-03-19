import { ItemView, Workspace, WorkspaceLeaf } from 'obsidian'

export const VIEW_TYPE_EXAMPLE = 'example-view'

export class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf)
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE
	}

	getDisplayText() {
		return 'Example view'
	}

	async onOpen() {
		const container = this.containerEl.children[1]
		container.empty()

		const result = await fetch('http://localhost:8000/techblogs?page=1')
		const blogs = await result.json()
		for (const blog of blogs) {
			container.createEl('h4', { text: blog.title })
		}

	}

	async onClose() {
		// Nothing to clean up.
	}
}
