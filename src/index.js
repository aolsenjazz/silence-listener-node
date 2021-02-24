import { ScriptProcessorBackend } from './script-processor-backend';
import { createWorkletBackend } from './audio-worklet-backend';

import { SilenceListenerNode } from './silence-listener-node';

export function polyfill() {
	if (AudioNode.prototype._isPolyfilled) return;

	AudioNode.prototype._isPolyfilled = true;
	AudioNode.prototype._connect = AudioNode.prototype.connect;
	AudioNode.prototype.connect = function () {
		var args = Array.prototype.slice.call(arguments);
		if (args[0]._isSilenceListenerNode)
			args[0] = args[0]._backend.node;
		
		this._connect.apply(this, args);
	};
}

export async function createSilenceListenerNode(context, nInputs, nOutputs, nChannels, options={}) {
	let batchSize = options.batchSize || 512;
	let silenceThreshold = options.silenceThreshold || Math.floor(44100 / batchSize);
	let pathToWorklet = options.pathToWorklet || '/sln.worklet.js';

	validate(context, nInputs, nOutputs, nChannels, batchSize, silenceThreshold);

	polyfill();

	let backend;
	if (window.AudioWorklet !== undefined) backend = await createWorkletBackend(context, nInputs, nOutputs, nChannels, silenceThreshold, pathToWorklet);
	else backend = new ScriptProcessorBackend(context, batchSize, nInputs, nOutputs, silenceThreshold);

	return new SilenceListenerNode(backend);
}

function validate(context, nInputs, nOutputs, nChannels, batchSize) {
	if (!context) throw 'must provide a valid AudioContext';
	if (nInputs != nOutputs) throw 'SilenceListenerNode only support nInputs === nOutputs';
	if (nInputs < 1) throw 'nInputs must be >= 1';
	if (nChannels < 1) throw 'nChannels must be >= 1';
	if (![256, 512, 1024, 2048, 4096, 8192, 16384].includes(batchSize)) throw 'batch size must be one of [256, 512, 1024, 2048, 4096, 8192, 16384]';
}