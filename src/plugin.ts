import {
	BaseInputParams,
	BindingTarget,
	createPlugin,
	InputBindingPlugin,
	parseRecord,
} from '@tweakpane/core';

import {PreviewSelectController} from './controller.js';

export interface PluginPreviewSelectParams extends BaseInputParams {
	view: 'preview-select';
	previewBaseUrl?: string;
	token?: string;
	height?: number;
	objectFit?: string;
	showPreview?: boolean;
	options: (string | number)[];
}

export const PluginPreviewSelect: InputBindingPlugin<
	string | number,
	string | number,
	PluginPreviewSelectParams
> = createPlugin({
	id: 'preview-select-input',

	type: 'input',

	accept(exValue: unknown, params: Record<string, unknown>) {
		if (!isValidValue(exValue)) {
			return null;
		}

		const result = parseParams(params);
		if (!result) {
			return null;
		}

		return {
			initialValue: exValue,
			params: result,
		};
	},

	binding: {
		reader(_args) {
			return (exValue: unknown): string | number =>
				isValidValue(exValue) ? exValue : '';
		},

		writer(_args) {
			return (target: BindingTarget, inValue) => {
				target.write(inValue);
			};
		},
	},

	controller(args) {
		return new PreviewSelectController(args.document, {
			value: args.value,
			viewProps: args.viewProps,
			options: args.params.options,
			params: args.params,
		});
	},
});

// Helper functions

function isValidValue(value: unknown): value is string | number {
	return typeof value === 'string' || typeof value === 'number';
}

function parseParams(params: Record<string, unknown>) {
	return parseRecord<PluginPreviewSelectParams>(params, (p) => ({
		view: p.required.constant('preview-select'),
		previewBaseUrl: p.optional.string,
		token: p.optional.string,
		objectFit: p.optional.string,
		showPreview: p.optional.boolean,
		height: p.optional.number,
		options: parseOptions(params, p),
	}));
}

function parseOptions(params: Record<string, unknown>, p: any) {
	const options = params.options as (string | number)[] | undefined;
	if (options && typeof options[0] === 'string') {
		return p.required.array(p.required.string);
	} else if (options && typeof options[0] === 'number') {
		return p.required.array(p.required.number);
	}
	return p.required.array(p.required.string); // Default to string array
}
