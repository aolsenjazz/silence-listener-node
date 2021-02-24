/** Abstract class representing an Audio Backend. Either ScriptProcessorNode or AudioWorklet under the hood */
export class AbstractBackend {

	constructor() {
		this.silenceCallback = null;
	}

	/**
	 * Connect to the given destination. Destination should be an AudioNode.
	 *
	 * @param { AudioNode } destination The AudioNode to which audio is propagated
	 */
	connect(destination) {
		throw 'connect() must be implemented';
	}

	/** Disconnect from the currently-connected destination. */
	disconnect() {
		throw 'disconnect() must be implemented';
	}

	/**
	 * Set the callback for when audio enters/exits silence
	 * 
	 * @param { Function } cb Callback function with signature cb(silent)
	 */
	setSilenceCallback(cb) {
		this.silenceCallback = cb;
	}

}