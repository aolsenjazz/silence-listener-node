import { randomString } from './util';

export class SilenceListenerNode {
	
	constructor(backend) {
		this._backend = backend;
		this._backend.setSilenceCallback(this.onSilenceStateChange.bind(this));

		this._subscriptions = new Map();

		this.lastStateChangeTime = Date.now();
	}

	onSilenceStateChange(silent) {
		let timeSinceLastStateChange = Date.now() - this.lastStateChangeTime;
		this.lastStateChangeTime = Date.now();

		this._subscriptions.forEach((value, key) => {
			value(silent, key);
		});
	}

	/**
	 * Begin receiving silence notifications
	 *
	 * @param { Function(isSilent, timeSinceLast) } cb Invoked whenever silence occurs
	 */
	subscribeToSilence(cb) {
		let id = randomString(7);
		this._subscriptions.set(id, cb);
		return id;
	}

	unsubscribeFromSilence(id) {
		this._subscriptions.delete(id);
	}

	/** Used in polyfill to ensure AudioNode.connect plays nicely with SilenceListenerNode */
	get _isSilenceListenerNode() { return true; }

	/** AudioNode-compliant getters. All defer to underlying AudioNode */
	get numberOfInputs()        { return this._backend.node.numberOfInputs; }
	get numberOfOutputs()       { return this._backend.node.numberOfOutputs; }
	get channelCount()          { return this._backend.node.channelCount; }
	get channelCountMode()      { return this._backend.node.channelCountMode; }
	get channelInterpretation() { return this._backend.node.channelInterpretation; }

	/** AudioNode-compliant setters. All defer to underlying AudioNode */
	set channelCount(channelCount)                   { this._backend.node.channelCount = channelCount; }
	set channelCountMode(channelCountMode)           { this._backend.node.channelCountMode = channelCountMode; }
	set channelInterpretation(channelInterpretation) { this._backend.node.channelInterpretation = channelInterpretation }

	/** Allow queryable state */
	get silent()  { return this._backend.silent; }
	get silence() { return this._backend.silent; }

}