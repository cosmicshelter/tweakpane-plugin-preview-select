import { ClassName, Value, View, ViewProps } from '@tweakpane/core';

interface Config {
    value: Value<string | number>;
    viewProps: ViewProps;
    options: (string | number)[];
    params: { previewBaseUrl?: string, height?: number, objectFit?: string, showPreview?: boolean };
}

const className = ClassName('tmp');

export class PreviewSelectView implements View {
    // Static Set to keep track of open dropdown instances
    private static openDropdowns: Set<PreviewSelectView> = new Set();

    public readonly element: HTMLElement;
    private value_: Value<string | number>;
    private params_: { previewBaseUrl?: string, height?: number, objectFit?: string, showPreview?: boolean };
    private previewContainer_: HTMLElement;
    private previewImage_: HTMLImageElement;
    private dropdown_: HTMLElement;
    private selectContainer_: HTMLElement;
    private optionsContainer_: HTMLElement;

    constructor(doc: Document, config: Config) {
        this.params_ = config.params;
        this.value_ = config.value;

        if (!this.value_.rawValue && config.options.length > 0) {
            this.value_.setRawValue(config.options[0]);
        }

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

        if (this.params_.showPreview && this.value_.rawValue && this.params_.previewBaseUrl) {
            this.previewContainer_.style.display = 'block';
            this.previewImage_.src = this.params_.previewBaseUrl + this.value_.rawValue;
            this.previewImage_.alt = String(this.value_.rawValue);
        } else {
            this.previewContainer_.style.display = 'none';
        }
    }

    private createElement_(doc: Document): HTMLDivElement {
        const element = doc.createElement('div');
        element.classList.add(className());
        return element;
    }

    private createPreviewContainer_(doc: Document): HTMLElement {
        const container = doc.createElement('div');
        container.classList.add(className('preview-container'));
        if (this.params_.height) container.style.height = `${this.params_.height}px`;
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
        container.classList.add(className('select-container'));
        return container;
    }

    private createDropdown_(doc: Document): HTMLElement {
        const dropdown = doc.createElement('div');
        dropdown.classList.add(className('current-label'));

        const svgContainer = doc.createElement('div');
        svgContainer.classList.add(className('dropdown-arrow'));
        const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");

        const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M5 7h6l-3 3 z");
        path.setAttribute("fill", "#333");

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
        options.forEach((option) => {
            const optionElement = doc.createElement('div');
            optionElement.classList.add(className('option-item'));
            optionElement.textContent = String(option);
            this.optionsContainer_.appendChild(optionElement);

            optionElement.addEventListener('click', () => {
                this.value_.setRawValue(option);
                this.closeDropdown();
                this.refresh_();
            });

            optionElement.addEventListener('mouseover', () => {
                if (this.params_.showPreview && this.params_.previewBaseUrl) {
                    this.previewImage_.src = this.params_.previewBaseUrl + option;
                    this.previewImage_.alt = String(option);
                }
                this.value_.setRawValue(option);
            });
        });
    }

    private setupEventListeners_(): void {
        this.dropdown_.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggleDropdown_();
        });

        document.addEventListener('click', this.documentClickHandler_);
        this.value_.emitter.on('change', this.valueChangedHandler_);
    }

    private toggleDropdown_(): void {
        const isActive = this.optionsContainer_.classList.contains('tp-options-active');

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
        PreviewSelectView.openDropdowns.add(this);
    }

    private closeDropdown(): void {
        this.optionsContainer_.classList.remove('tp-options-active');
        PreviewSelectView.openDropdowns.delete(this);
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
        document.removeEventListener('click', this.documentClickHandler_);
        this.value_.emitter.off('change', this.valueChangedHandler_);
    }
}
