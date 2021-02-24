import 'web-audio-test-api';
import { polyfill, createSilenceListenerNode } from '../src/index';
import { ScriptProcessorBackend } from '../src/script-processor-backend';

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

test('validate throws no AudioContext', async () => {
	let ctx = null;
	let nInputs = 1;
	let nOutputs = 1;
	let nChannels = 2;
	let batchSize = 1024;
	let silenceThreshold = 3;

	await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels)
		.catch(e => {
			expect(e).toBe('must provide a valid AudioContext');
		});
});

test('validate throws nInputs != nOutputs', async () => {
	let ctx = new AudioContext();
	let nInputs = 2;
	let nOutputs = 1;
	let nChannels = 2;
	let batchSize = 1024;
	let silenceThreshold = 3;

	await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels)
		.catch(e => {
			expect(e).toBe('SilenceListenerNode only support nInputs === nOutputs');
		});
});

test('validate throws nInputs < 1', async () => {
	let ctx = new AudioContext();
	let nInputs = 0;
	let nOutputs = 0;
	let nChannels = 2;
	let batchSize = 1024;
	let silenceThreshold = 3;

	await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels)
		.catch(e => {
			expect(e).toBe('nInputs must be >= 1');
		});
});

test('validate throws nChannels < 1', async () => {
	let ctx = new AudioContext();
	let nInputs = 1;
	let nOutputs = 1;
	let nChannels = 0;
	let batchSize = 1024;
	let silenceThreshold = 3;

	await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels)
		.catch(e => {
			expect(e).toBe('nChannels must be >= 1');
		});
});

test('validate throws bad batch size', async () => {
	let ctx = new AudioContext();
	let nInputs = 1;
	let nOutputs = 1;
	let nChannels = 2;
	let batchSize = 1025;
	let silenceThreshold = 3;

	await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels, {batchSize: batchSize, silenceThreshold: silenceThreshold})
		.catch(e => {
			expect(e).toBe('batch size must be one of [256, 512, 1024, 2048, 4096, 8192, 16384]');
		});
});

test('createSilenceListenerNode uses scriptProcessorBackend when worklet not avail', async () => {
	let ctx = new AudioContext();
	let nInputs = 1;
	let nOutputs = 1;
	let nChannels = 2;
	let batchSize = 1024;
	let silenceThreshold = 3;

	let sln = await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels);

	expect(sln._backend instanceof ScriptProcessorBackend).toBe(true);
});

test('createSilenceListenerNode uses workletBackend when worklet avail', async () => {
	let ctx = new AudioContext();
	let nInputs = 1;
	let nOutputs = 1;
	let nChannels = 2;
	let batchSize = 1024;
	let silenceThreshold = 3;

	global.AudioWorklet = {}; // make the env think that AudioWorklet exists

	let sln = await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels)

	expect(sln._backend.constructor.name).toBe('AudioWorkletBackend');
});

test('polyfill allows connecting to silenceListenerNode using AudioNode API', async () => {
	let ctx = new AudioContext();
	let nInputs = 1;
	let nOutputs = 1;
	let nChannels = 2;
	let batchSize = 1024;
	let silenceThreshold = 3;

	global.AudioWorklet = undefined; // make sure we're using ScriptProcessorBackend

	polyfill();

	let sln = await createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels);
	let gain = ctx.createGain();

	gain.connect(sln);
});

test('polyfill doesnt get in the way of other nodes', () => {
	let ctx = new AudioContext();

	let gain1 = ctx.createGain();
	let gain2 = ctx.createGain();

	gain1.connect(gain2);
});