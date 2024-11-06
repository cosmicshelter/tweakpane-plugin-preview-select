# Tweakpane preview select plugin

Plugin for previewing select inputs on hover for [Tweakpane](https://tweakpane.github.io/docs/).

# For plugin users

## Installation

```bash
npm install tweakpane
npm i tweakpane-plugin-preview-select
```

```js
import {Pane} from 'tweakpane';
import * as TweakpanePluginPreviewSelect from 'tweakpane-plugin-preview-select';

const pane = new Pane();
pane.registerPlugin(TweakpanePluginPreviewSelect);
```

## Usage

### Example with image preview

```js
const options = [
	'100', '200', '300'
]
const initialOption = {
	value: '100'
}
pane.addBinding(initialOption, 'value', {
	label: 'Image',
	view: 'preview-select',
	previewBaseUrl: 'https://placehold.co/',
	showPreview: true,
	objectFit: 'cover',
	height: 50,
	options,
}).on('change', (ev) => {
	console.log(ev.value);
});
```

### Example without image preview

```js
const options2 = [
	1, 2, 3
]
const initialOption2 = {
	value: 1
}

pane.addBinding(initialOption2, 'value', {
	label: 'Number',
	view: 'preview-select',
	options: options2,
}).on('change', (ev) => {
	console.log(ev.value);
});
```

## Todo

- Accept objects (currently supporting only arrays of strings or numbers)