import { ScriptProcessorBackend } from './script-processor-backend';
import { createWorkletBackend } from './audio-worklet-backend';

import { SilenceListenerNode } from './silence-listener-node';

/**
 * polyfill() make it possible to connect to SilenceListenerNode in an AudioNode-complient way,
 * e.g. GainNode.connect(SilenceListenerNode). More (useful) info can be found here:
 * https://github.com/GoogleChromeLabs/web-audio-samples/wiki/CompositeAudioNode
 */
export function polyfill() {
	if (AudioNode.prototype._isPolyfilled) return;

	AudioNode.prototype._isPolyfilled = true;
	AudioNode.prototype._connect = AudioNode.prototype.connect;
	AudioNode.prototype.connect = function () {
		var args = Array.prototype.slice.call(arguments);
		if (args[0]._isSilenceListenerNode === true) {
			args[0] = args[0]._backend.audioNode;
		}
		
		this._connect.apply(this, args);
	};
}

/**
 * Loads the AudioWorklet (if necessary) and create the SilenceListenerNode. The `options` object has
 * the following format:
 *
 * options: {
 *     nInputs:          { Number } The number of inputs connected to this node. Probably 1
 *     nOutputs:         { Number } The number of outputs connected to this node. Probably 1
 *     batchSize:        { Number } default 512. Number of samples (per channel) processed per batch. Only in-use
 *                                  when using ScriptProcessorBackend
 *     silenceThreshold: { Number } default Math.floor(44100 / batchSize). This is the number of silent batches
 *                                  which must occur before silence callbacks are invoked.
 *     pathToWorklet:    { String } default '/sln.worklet.js'. The path to the worklet file
 * }
 *
 * @param { AudioContext } context Parent AudioContext
 * @param { Number } nChannels The number of channels per input/outputs
 * @param { Object } options See above
 * 
 * @return { Promise } resolves with a new instance of SilenceListenerNode
 */
export async function createSilenceListenerNode(context, nChannels, options={}) {
	let nInputs = options.nInputs || 1;
	let nOutputs = options.nOutputs || 1;
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

/**
 * Validates data passed to createSilenceListenerNode(). Throws if bad data provided
 * 
 * @param { AudioContext } context Parent AudioContext
 * @param { Number } nInputs The number of inputs connected to this node. Probably 1
 * @param { Number } nOutputs The number of outputs connected to this node. Probably 1
 * @param { Number } nChannels The number of channels per input/outputs
 * @param { Number } batchSize Number of samples (per channel) processed per batch. Only in-use 
 *                   when using ScriptProcessorBackend
 * 
 */
function validate(context, nInputs, nOutputs, nChannels, batchSize) {
	if (!context) throw 'must provide a valid AudioContext';
	if (nInputs != nOutputs) throw 'SilenceListenerNode only support nInputs === nOutputs';
	if (nInputs < 1) throw 'nInputs must be >= 1';
	if (nChannels < 1) throw 'nChannels must be >= 1';
	if (![256, 512, 1024, 2048, 4096, 8192, 16384].includes(batchSize)) throw 'batch size must be one of [256, 512, 1024, 2048, 4096, 8192, 16384]';
}