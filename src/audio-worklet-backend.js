import { AbstractBackend } from './abstract-backend';

/**
 * Loads the AudioWorkletProcessor, initializes it, then resolves with a new instance of AudioWorkletBackend
 * 
 * @param { AudioContext } context         The parent AudioContext
 * @param { Number }       nChannels       The number of input and output channels
 * @param { String }       pathToWorklet   The location of the AudioWorklet file. Default is 
 *                                         '/audio-feeder.worklet.js'
 */
export function createWorkletBackend(context, nIns, nOuts, nChannels, silenceThreshold, pathToWorklet) {
	let _silenceThreshold = silenceThreshold;
	let _nChannels = [];
	for (let i = 0; i < nOuts; i++) {
		_nChannels.push(nChannels);
	}

	// define this here so that window is accessible (SSR-safe)
	class WorkletNode extends AudioWorkletNode {
		constructor(context) {
			super(context, 'FeederNode', {
				numberOfInputs: nIns, 
				numberOfOutputs: nOuts,
				outputChannelCount: _nChannels
			});
		}
	}

	return new Promise((resolve, reject) => {
		context.audioWorklet.addModule(pathToWorklet)
			.then(() => {
				let workletNode = new WorkletNode(context);
				workletNode.port.postMessage({
					command: 'init', 
					silenceThreshold: _silenceThreshold
				});

				let backend = new AudioWorkletBackend(workletNode);
				resolve(backend);
			});
	});
}

/** Audio backend which processes audio on the Audio Thread */
class AudioWorkletBackend extends AbstractBackend {

	/**
	 * Constructor.
	 * 
	 * @param { AudioNode }    audioNode    The initialized AudioWorkletProcessor
	 */
	constructor(audioNode) {
		super();

		this.audioNode = audioNode;

		audioNode.port.onmessage = this._onMessage.bind(this);
	}

	/**
	 * Loads + intializes the AudioWorkletProcessor, then connects it to the provided destination AudioNode
	 * 
	 * @param {AudioNode} destination The node to which FeederNode will connect
	 */
	connect(destination) {
		this.audioNode.connect(destination);
	}

	/**
	 * Disconnect from the connected AudioNode
	 */
	disconnect() {
		this.audioNode.disconnect();
	}

	/**
	 * Called whenever a message from the AudioWorkletProcessor is received
	 * 
	 * @param {Event} e https://developer.mozilla.org/en-US/docs/Web/API/MessagePort
	 */
	_onMessage(e) {
		if (e.data.command === 'stateChange') {
			this.silenceCallback(e.data.silent);
		} else {
			throw `command ${e.data.command} unrecognized`;
		}
	}
}