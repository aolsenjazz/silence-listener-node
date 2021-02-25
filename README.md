# silence-listener-node

![AppVeyor](https://img.shields.io/appveyor/build/aolsenjazz/silence-listener-node)    [![Coverage Status](https://coveralls.io/repos/github/aolsenjazz/silence-listener-node/badge.svg?branch=main)](https://coveralls.io/github/aolsenjazz/silence-listener-node?branch=main) [![Maintainability](https://api.codeclimate.com/v1/badges/1b47d3d0a92f4def2455/maintainability)](https://codeclimate.com/github/aolsenjazz/silence-listener-node/maintainability) ![Depfu](https://img.shields.io/depfu/aolsenjazz/silence-listener-node)

SilenceListenerNode is a [pseudo](https://github.com/WebAudio/web-audio-api/issues/251)-[AudioNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode) which invokes a callback function whenever a stream of audio becomes or unbecomes silent. Uses [AudioWorklet](https://developers.google.com/web/updates/2017/12/audio-worklet) when available, falling back to [ScriptProcessorNode](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode) when Worklets are not available. 

## Installation

Install using NPM:
```bash
npm i @alexanderolsen/silence-listener-node
```

## Setup
To utilize AudioWorklet functionality, you **must** copy the `sln.worklet.js` file in */node_modules/@alexanderolsen/silence-listener-node/dist/* to where the library can find it. The default location for this file is at the server root (*/sln.worklet.js*). This location can be changed using the options dict passed into `createSilenceListenerNode()`:

```javascript
createSilenceListenerNode(context, nChannels, { 
	pathToWorklet: '/some/path/to/sln.worklet.js', // default '/sln.worklet.js'
});
```
See **Configuration** for more instructions on using the `options` dict.

## Usage

### In modules:
```javascript
import { createSilenceListenerNode } from '@alexanderolsen/silence-listener-node'; 

let context   = new AudioContext();
let nChannels = 2;
let options   = {}; // see **Configuration**
let buffSource = context.createBufferSource();

createSilenceListenerNode(context, nChannels, options)
	.then((silenceListenerNode) => {
		buffSource.connect(silenceListenerNode);
		silenceListenerNode.connect(context.destination);
		buffSource.start();
	});
```
or
```javascript
const createSilenceListenerNode = require('@alexanderolsen/silence-listener-node').createSilenceListenerNode; 

(async function() {
	let context   = new AudioContext();
	let nChannels = 2;
	let options   = {}; // see **Configuration**
	
	let buffSource = context.createBufferSource();
	let silenceListenerNode = await createSilenceListenerNode(context, nChannels, options);
	
	buffSource.connect(silenceListenerNode);
	silenceListenerNode.connect(context.destination);
	
	buffSource.start();
})();
```

### In HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@alexanderolsen/silence-listener-node"></script>
<script>
	var context   = new AudioContext();
	var nChannels = 2;
	var options   = {}; // see **Configuration**
	let buffSource = context.createBufferSource();

	SilenceListenerNode.createSilenceListenerNode(context, nChannels, options)
		.then((silenceListenerNode) => {
			buffSource.connect(silenceListenerNode);
			silenceListenerNode.connect(context.destination);
			buffSource.start();
		});
</script>
```
Or use the silence-listener-node.js file in the *dist* folder:
```html
<script src="silence-listener-node.js"></script>
```

## Configuration

When creating a SilenceListenerNode instance, you have number of options available:

```javascript
let context   = new AudioContext();
let nChannels = 2;

// entries are defaults
let options = {
	nInputs:   1,   // The number of inputs connected to this node. Probably 1
 	nOutputs:  1,   // The number of outputs connected to this node. Probably 1
	batchSize: 512, // Stuck at 128 for `AudioWorklet`s. Can be powers of 2 where 256 < batchSize < 16384
	
	silenceThreshold: Math.floor(44100 / batchSize), // This is the number of silent batches which must
                                                     // occur before silence callbacks are invoked.
 	pathToWorklet: '/sln.worklet.js' //The path to the worklet file
}

createSilenceListenerNode(context, nChannels, options).then((silenceListenerNode) => { ... });
```

#### `nInputs`
The number of `AudioNode`s connected to this instance of SilenceListenerNode. Default 1.

#### `nOutputs`
The nubmer of outputs `AudioNode`s this instance of SilenceLisnerNode is connected to. Default 1.

#### `batchSize`
Modifies the batch size processed by `ScriptProcessorNode`. This does not affect `AudioWorklet`s as they're stuck at 128. If using ScriptProcessorNode, must be one of the following: `[256, 512, 1024, 2048, 4096, 8192, 16384]`.

#### `silenceThreshold`
The number of silent batches which must occur before the audio stream will be flagged as silent. Default is (roughly) one second worth of audio.

#### `pathToWorklet`
The location of your *sln.worklet.js* file. Default is at server root.

## API Reference

Once you've created the SilenceListenerNode using `createSilenceListener()` or `SilenceListenerNode.createSilenceListener()`, the returned object exposes:

### `connect`
```javascript
/**
 * Connects SilenceListenerNode to the specific destination AudioNode
 *
 * @param {AudioNode} destination The node to connect to
 */
connect(destination) { ... }
```

### `disconnect`
```javascript
/** Disconnects from the currently-connected AudioNode */
disconnect() { ... }
```

### `subscribeToSilence`
```javascript
/**
 * Begin receiving silence notifications
 *
 * @param  { Function(isSilent, timeSinceLast) } callback Invoked whenever audio becomes or unbecomes silent
 * @return { String } id of the subscription. use with unsubscribeFromSilence(id) to stop receiving notifications
 */
subscribeToSilence(callback) { ... }
```

### `unsubscribeFromSilence`
```javascript
/**
 * Stop receiving silence events for given ID.
 * 
 * @param { String } id Identifier for callback subscription
 */
unsubscribeFromSilence(id) { ... }
```

### `getters`
```javascript
get silent()  { ... }
get silence() { ... } // for simplicity

get numberOfInputs() { ... }
get numberOfOutputs() { ... }
get channelCount() { ... }
get channelCountMode() { ... }
get channelInterpretation() { ... }

// e.g. let isSilent = silenceListenerNode.silent;
```

### `setters`
```javascript
set channelCount(channelCount) { ... }
set channelCountMode(channelCountMode) { ... }
set channelInterpretation(channelInterpretation) { ... }

// e.g. silenceListenerNode.channelInterpretation = 'speakers';
```

## Examples

Run any server ([http-server](https://www.npmjs.com/package/http-server), etc) from the project directory:
```bash
cd silence-listener-node
http-server
```
and visit *localhost:8080/examples/basic* or *localhost:8080/examples/react* in a browser. Examples **must be** hosted from the root directory, as they need to access the files in *dist*.

## Building From Source

```bash
git clone https://github.com/aolsenjazz/silence-listener-node
cd silence-listener-node
npm run watch
```

Production files are placed in the *dist* directory.

## Uncaught (in promise) DOMException: The user aborted a request.
This super unhelpful error message occurs when SilenceListenerNode is unable to find your sln.worklet.js. To fix this, make sure your `options.pathToWorklet` is set correctly and that the file is actually reachable at that location.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Licenses are available in `LICENSE.md`.