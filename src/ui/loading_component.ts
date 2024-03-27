const CustomLoadingComponent = (contentEl: HTMLElement) => {
	return contentEl.createDiv({
		text: 'Waiting...',
		cls: 'loading',
	})
}

export default CustomLoadingComponent
