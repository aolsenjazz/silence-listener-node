import 'web-audio-test-api';

import { createWorkletBackend } from '../src/audio-worklet-backend';

class AudioWorkletNode {
	connect(destination) {

	}

	disconnect() {

	}

	addModule(path) {
		this.path = path;
	}

	port = {
		postMessage: (data) => {
			if (data.command === 'init') {
				this.initialized = true;
			}
		},

		// gets overridden
		onmessage: (data) => {}
	}
}
global.AudioWorkletNode = AudioWorkletNode;

AudioContext.prototype.audioWorklet = {};
AudioContext.prototype.audioWorklet.addModule = async (path) => {}

test('createWorkletBackend runs initializer', (done) => {
	const ctx = new AudioContext();
	const nIns = 1;
	const nOuts = 1;
	const nChannels = 2;
	const silenceThreshold = 40;

	createWorkletBackend(ctx, nIns, nOuts, nChannels, silenceThreshold)
		.then(worklet => {
			expect(worklet.audioNode.initialized).toBe(true);
			done();
		});
});

test('connect() propagates to underlying worklet', (done) => {
	const ctx = new AudioContext();
	const nIns = 1;
	const nOuts = 1;
	const nChannels = 2;
	const silenceThreshold = 40;

	createWorkletBackend(ctx, nIns, nOuts, nChannels, silenceThreshold)
		.then(worklet => {
			const spy = jest.spyOn(worklet.audioNode, 'connect');
			const gain = ctx.createGain();

			worklet.connect(gain);

			expect(spy).toHaveBeenCalledTimes(1);

			done();
		});
});

test('disconnect() propagates to underlying worklet', (done) => {
	const ctx = new AudioContext();
	const nIns = 1;
	const nOuts = 1;
	const nChannels = 2;
	const silenceThreshold = 40;

	createWorkletBackend(ctx, nIns, nOuts, nChannels, silenceThreshold)
		.then(worklet => {
			const spy = jest.spyOn(worklet.audioNode, 'disconnect');

			worklet.disconnect();

			expect(spy).toHaveBeenCalledTimes(1);
			
			done();
		});
});

test('receiving stateChange command calls callback', (done) => {
	const ctx = new AudioContext();
	const nIns = 1;
	const nOuts = 1;
	const nChannels = 2;
	const silenceThreshold = 40;

	createWorkletBackend(ctx, nIns, nOuts, nChannels, silenceThreshold)
		.then(worklet => {
			worklet.setSilenceCallback(() => {});
			const spy = jest.spyOn(worklet, 'silenceCallback');

			worklet._onMessage({
				data: {
					command: 'stateChange',
					silent: true
				}
			})

			expect(spy).toHaveBeenCalledTimes(1);

			done();
		});
});

test('receiving unknown command throws', (done) => {
	const ctx = new AudioContext();
	const nIns = 1;
	const nOuts = 1;
	const nChannels = 2;
	const silenceThreshold = 40;

	createWorkletBackend(ctx, nIns, nOuts, nChannels, silenceThreshold)
		.then(worklet => {
			expect(() => {
				worklet._onMessage({
					data: {
						command: 'bad'
					}
				})
			}).toThrow();

			done();
		});
});