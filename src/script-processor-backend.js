import { AbstractBackend } from './abstract-backend';

/** Backend which processes audio data using ScriptProcessorNode */
export class ScriptProcessorBackend extends AbstractBackend {

	constructor(context, batchSize, nInputs, nOutputs, silenceThreshold) {
		super();

		this.audioNode = context.createScriptProcessor(batchSize, nInputs, nOutputs);
		this.audioNode.onaudioprocess = this._processNext.bind(this);

		this.silent = false;
		this.silentRuns = 0;
		this.silenceThreshold = silenceThreshold;
	}

	/**
	 * Connects the ScriptProcessorNode to the given destination AudioNode
	 * 
	 * @param {AudioNode} destination The node to which SilenceListenerNode will connect
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
	 * Called whenever the ScriptProcessor wants to consume more audio. Copies input channels to output
	 * channels and tracks silence, notifying when appropriate
	 *
	 * @param {AudioProcessingEvent} https://developer.mozilla.org/en-US/docs/Web/API/AudioProcessingEvent
	 */
	_processNext(audioProcessingEvent) {
		let silent = true;
		let inBuffer  = audioProcessingEvent.inputBuffer;
		let outBuffer = audioProcessingEvent.outputBuffer;

		for (let channel = 0; channel < outBuffer.numberOfChannels; channel++) {
			let inData  = inBuffer.getChannelData(channel);
			let outData = outBuffer.getChannelData(channel);

			for (let i = 0; i < inBuffer.length; i++) {
				outData[i] = inData[i];
				if (outData[i] !== 0) silent = false;
			}
		}
		
		if (this.silent && !silent) {
			// moving from silent state to non-silent state
			this.silenceCallback(false);
			this.silent = false;
			this.silentRuns = 0;
		} else if (!this.silent && silent) {
			// increment # of silent runs, notify once it hits threshold
			this.silentRuns++;
			if (this.silentRuns === this.silenceThreshold) {
				this.silenceCallback(true);
				this.silent = true;
			}
		}
	}
}