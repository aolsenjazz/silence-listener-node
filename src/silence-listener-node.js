import { randomString } from "./util";

export class SilenceListenerNode {
	constructor(backend) {
		this._backend = backend;
		this._backend.setSilenceCallback(this.onSilenceStateChange.bind(this));

		this._subscriptions = new Map();

		this.lastStateChangeTime = Date.now();
	}

	/**
	 * Invoked by the backend whenever the audio becomes or unbecomes silent
	 *
	 * @param { boolean } silent
	 */
	onSilenceStateChange(silent) {
		let timeSinceLastStateChange = Date.now() - this.lastStateChangeTime;
		this.lastStateChangeTime = Date.now();

		this._subscriptions.forEach((value) => {
			value(silent, timeSinceLastStateChange);
		});
	}

	/**
	 * Connects the backend to the given destination AudioNode
	 *
	 * @param {AudioNode} destination The node to which SilenceListenerNode will connect
	 */
	connect(node) {
		this._backend.connect(node);
	}

	/**
	 * Disconnect from the connected AudioNode
	 */
	disconnect() {
		this._backend.disconnect();
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

	/**
	 * Stop receiving silence events for given ID.
	 *
	 * @param { String } id Identifier for callback subscription
	 */
	unsubscribeFromSilence(id) {
		this._subscriptions.delete(id);
	}

	/** Used in polyfill to ensure AudioNode.connect plays nicely with SilenceListenerNode */
	get _isSilenceListenerNode() {
		return true;
	}

	/** AudioNode-compliant getters. All defer to underlying AudioNode */
	get numberOfInputs() {
		return this._backend.audioNode.numberOfInputs;
	}
	get numberOfOutputs() {
		return this._backend.audioNode.numberOfOutputs;
	}
	get channelCount() {
		return this._backend.audioNode.channelCount;
	}
	get channelCountMode() {
		return this._backend.audioNode.channelCountMode;
	}
	get channelInterpretation() {
		return this._backend.audioNode.channelInterpretation;
	}

	/** AudioNode-compliant setters. All defer to underlying AudioNode */
	set channelCount(channelCount) {
		this._backend.audioNode.channelCount = channelCount;
	}
	set channelCountMode(channelCountMode) {
		this._backend.audioNode.channelCountMode = channelCountMode;
	}
	set channelInterpretation(channelInterpretation) {
		this._backend.audioNode.channelInterpretation = channelInterpretation;
	}

	/** Allow queryable state */
	get silent() {
		return this._backend.silent;
	}
	get silence() {
		return this._backend.silent;
	}
}
