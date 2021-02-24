const BUFFER_SIZE = 128;

/** AudioWorkletProcessor loaded by audio-worklet-backend to do the audio-thread processing */
export default class WorkletProcessor extends AudioWorkletProcessor {

	constructor() {
		super();

		this.port.onmessage = this._onMessage.bind(this);

		this.silent = false;
		this.silentRuns = 0;
		this.silenceThreshold = Math.floor(44100 / BUFFER_SIZE); // arbitrary default 1 second(ish)
	}

	/**
	 * Called whenever the AudioWorkletProcessor has data to process/playback
	 *
	 * @param {Array} inputs      An array containing Float32Arrays
	 * @param {Array} outputs     An array containing this.nChannels Float32Arrays
	 * @param {Object} parameters Object containing audio parameters. unused
	 */
	process(inputs, outputs, parameters) {
		let silent = true;

		// copy ins to outs (gross)
		for (let inputNum = 0; inputNum < inputs.length; inputNum++) {
			let input = inputs[inputNum];
			// copy channels
			for (let channelNum = 0; channelNum < input.length; channelNum++) {
				let channel = input[channelNum];
				// copy samples
				for (let sampleNum = 0; sampleNum < channel.length; sampleNum++) {
					outputs[inputNum][channelNum][sampleNum] = channel[sampleNum];
					if (channel[sampleNum] !== 0) silent = false;
				}
			}
		}

		if (this.silent && !silent) {
			// moving from silent state to non-silent state
			this.port.postMessage({ command: 'stateChange', silent: silent });
			this.silentRuns = 0;
			this.silent = false;
		} else if (!this.silent && silent) {
			// increment # of silent runs, notify once it hits threshold
			this.silentRuns++;
			if (this.silentRuns === this.silenceThreshold) {
				this.port.postMessage({ command: 'stateChange', silent: silent });
				this.silent = true;
			}
		}

		return true;
	}

	/**
	 * Called whenever the AudioWorkletProcessor received a message from the main thread. Use to initialize
	 * values and receive audio data.
	 *
	 * @param {Event} e https://developer.mozilla.org/en-US/docs/Web/API/MessagePort
	 */
	_onMessage(e) {
		switch (e.data.command) {
			case 'init':
				this.silenceThreshold = e.data.silenceThreshold;
				break;
			default:
				throw Error(`unknown command ${e.data.command}`);
		}
	}
}

registerProcessor('SilenceListenerNode', WorkletProcessor);