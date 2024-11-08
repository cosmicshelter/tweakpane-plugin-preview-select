import {ClassName, Value, View, ViewProps} from '@tweakpane/core';

interface Config {
	value: Value<string | number>;
	viewProps: ViewProps;
	options: (string | number)[];
	params: {
		previewBaseUrl?: string;
		token?: string;
		height?: number;
		objectFit?: string;
		showPreview?: boolean;
	};
}

const className = ClassName('tmp');

export class PreviewSelectView implements View {
	private static openDropdowns: Set<PreviewSelectView> = new Set();

	public readonly element: HTMLElement;
	private value_: Value<string | number>;
	private params_: {
		previewBaseUrl?: string;
		token?: string;
		height?: number;
		objectFit?: string;
		showPreview?: boolean;
	};
	private previewContainer_: HTMLElement;
	private previewImage_: HTMLImageElement;
	private dropdown_: HTMLElement;
	private selectContainer_: HTMLElement;
	private optionsContainer_: HTMLElement;
	private selectedIndex_: number;

	constructor(doc: Document, config: Config) {
		this.params_ = config.params;
		this.value_ = config.value;

		if (!this.value_.rawValue && config.options.length > 0) {
			this.value_.setRawValue(config.options[0]);
		}
		this.selectedIndex_ = 0;
		this.element = this.createElement_(doc);
		config.viewProps.bindClassModifiers(this.element);

		this.previewContainer_ = this.createPreviewContainer_(doc);
		this.element.appendChild(this.previewContainer_);

		this.previewImage_ = this.createPreviewImage_(doc);
		this.previewContainer_.appendChild(this.previewImage_);

		this.selectContainer_ = this.createSelectContainer_(doc);
		this.element.appendChild(this.selectContainer_);

		this.dropdown_ = this.createDropdown_(doc);
		this.selectContainer_.appendChild(this.dropdown_);

		this.optionsContainer_ = this.createOptionsContainer_(doc);
		this.selectContainer_.appendChild(this.optionsContainer_);

		this.populateOptions_(doc, config.options);

		this.setupEventListeners_();
		this.refresh_();

		config.viewProps.handleDispose(() => {
			this.removeEventListeners_();
		});
	}

	private refresh_(): void {
		this.dropdown_.textContent = String(this.value_.rawValue);

		if (
			this.params_.showPreview &&
			this.value_.rawValue &&
			this.params_.previewBaseUrl
		) {
			this.previewContainer_.style.display = 'block';
			if (this.params_.token) {
				this.previewImage_.src =
					this.params_.previewBaseUrl +
					this.value_.rawValue +
					this.params_.token;
			} else {
				this.previewImage_.src =
					this.params_.previewBaseUrl + this.value_.rawValue;
			}
			this.previewImage_.alt = String(this.value_.rawValue);
		} else {
			this.previewContainer_.style.display = 'none';
		}
	}

	private createElement_(doc: Document): HTMLDivElement {
		const element = doc.createElement('div');
		element.classList.add(className('select-container'));
		return element;
	}

	private createPreviewContainer_(doc: Document): HTMLElement {
		const container = doc.createElement('div');
		container.classList.add(className('preview-container'));
		if (this.params_.height)
			container.style.height = `${this.params_.height}px`;
		return container;
	}

	private createPreviewImage_(doc: Document): HTMLImageElement {
		const image = doc.createElement('img');
		image.classList.add(className('preview-image'));
		image.style.position = 'absolute';
		image.style.pointerEvents = 'none';
		image.style.left = '0';
		image.style.top = '0';
		image.style.objectFit = this.params_.objectFit || 'cover';
		return image;
	}

	private createSelectContainer_(doc: Document): HTMLElement {
		const container = doc.createElement('div');
		container.classList.add(className('dropdown-container'));
		return container;
	}

	private createDropdown_(doc: Document): HTMLElement {
		const dropdown = doc.createElement('div');
		dropdown.classList.add(className('current-label'));

		const svgContainer = doc.createElement('div');
		svgContainer.classList.add(className('dropdown-arrow'));
		const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');

		const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', 'M5 7h6l-3 3 z');
		path.setAttribute('fill', '#333');

		svg.appendChild(path);
		svgContainer.appendChild(svg);
		this.selectContainer_.appendChild(svgContainer);

		return dropdown;
	}

	private createOptionsContainer_(doc: Document): HTMLElement {
		const container = doc.createElement('div');
		container.classList.add(className('options-container'));
		return container;
	}

	private populateOptions_(doc: Document, options: (string | number)[]): void {
		options.forEach((option, index) => {
			const optionElement = doc.createElement('div');
			optionElement.classList.add(className('option-item'));
			optionElement.textContent = String(option);
			optionElement.dataset.index = index.toString();
			this.optionsContainer_.appendChild(optionElement);

			optionElement.addEventListener('click', () => {
				this.value_.setRawValue(option);
				this.selectedIndex_ = index;
				this.closeDropdown();
				this.refresh_();
			});
			optionElement.addEventListener('mouseover', () => {
				this.value_.setRawValue(option);
			});
		});
	}

	private setupEventListeners_(): void {
		this.dropdown_.addEventListener('click', (event) => {
			event.stopPropagation();
			this.toggleDropdown_();
		});

		document.addEventListener('keydown', this.keydownHandler_);
		document.addEventListener('click', this.documentClickHandler_);
		this.value_.emitter.on('change', this.valueChangedHandler_);
	}

	private keydownHandler_ = (event: KeyboardEvent): void => {
		if (!this.optionsContainer_.classList.contains('tp-options-active')) return;

		const options = this.optionsContainer_.querySelectorAll(
			`.${className('option-item')}`,
		);

		switch (event.key) {
			case 'ArrowDown':
				this.selectedIndex_ = (this.selectedIndex_ + 1) % options.length;
				break;
			case 'ArrowUp':
				this.selectedIndex_ =
					(this.selectedIndex_ - 1 + options.length) % options.length;
				break;
			case 'Enter':
				if (this.selectedIndex_ >= 0 && this.selectedIndex_ < options.length) {
					this.closeDropdown();
				}
				return;
			default:
				return;
		}

		this.value_.setRawValue(options[this.selectedIndex_].textContent || '');
		this.refresh_();

		options.forEach((option, index) => {
			option.classList.toggle('selected', index === this.selectedIndex_);
		});

		this.scrollToSelectedOption();
	};

	private scrollToSelectedOption(): void {
		const options = this.optionsContainer_.querySelectorAll(
			`.${className('option-item')}`,
		);

		this.clearActiveOptionClass_(options);

		if (this.selectedIndex_ >= 0 && this.selectedIndex_ < options.length) {
			const selectedOption = options[this.selectedIndex_] as HTMLElement;
			this.updateActiveOptionClass_(selectedOption);
			selectedOption.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}

	private toggleDropdown_(): void {
		const isActive =
			this.optionsContainer_.classList.contains('tp-options-active');

		PreviewSelectView.openDropdowns.forEach((dropdown) => {
			if (dropdown !== this) {
				dropdown.closeDropdown();
			}
		});

		if (isActive) {
			this.closeDropdown();
		} else {
			this.openDropdown();
		}
	}

	private openDropdown(): void {
		this.optionsContainer_.classList.add('tp-options-active');
		this.scrollToSelectedOption();
		PreviewSelectView.openDropdowns.add(this);
	}

	private closeDropdown(): void {
		this.optionsContainer_.classList.remove('tp-options-active');

		PreviewSelectView.openDropdowns.delete(this);
	}

	private updateActiveOptionClass_(selectedOption: HTMLElement): void {
		selectedOption.classList.add('selected');
	}

	// Add a helper method to clear all active classes
	private clearActiveOptionClass_(options: NodeListOf<Element>): void {
		options.forEach((element) => {
			element.classList.remove('selected');
		});
	}

	private documentClickHandler_ = (event: MouseEvent): void => {
		if (!this.element.contains(event.target as Node)) {
			this.closeDropdown();
		}
	};

	private valueChangedHandler_ = (): void => {
		this.refresh_();
	};

	private removeEventListeners_(): void {
		document.removeEventListener('keydown', this.keydownHandler_);
		document.removeEventListener('click', this.documentClickHandler_);
		this.value_.emitter.off('change', this.valueChangedHandler_);
	}
}
