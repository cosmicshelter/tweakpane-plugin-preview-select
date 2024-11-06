import {
	Controller,
	Value,
	ViewProps,

} from '@tweakpane/core';
import { PreviewSelectView } from './view.js';

import {PluginPreviewSelectParams} from './plugin.js';


interface Config {
	value: Value<string | number>;
	options: (string | number)[];
	params: PluginPreviewSelectParams;
	viewProps: ViewProps;
}

export class PreviewSelectController implements Controller<PreviewSelectView> {
	public readonly value: Value<string | number>;
	public readonly view: PreviewSelectView;
	public readonly viewProps: ViewProps;
	public readonly params: PluginPreviewSelectParams;
	public readonly options: (string | number)[];

	constructor(doc: Document, config: Config) {
		this.value = config.value;
		this.viewProps = config.viewProps;
		this.params = config.params;
		this.options = config.options;

		this.view = new PreviewSelectView(doc, {
			value: this.value,
			viewProps: this.viewProps,
			options: this.options,
			params: this.params,
		});
	}
}
