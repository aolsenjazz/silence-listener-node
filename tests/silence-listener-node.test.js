import 'web-audio-test-api';

import { createSilenceListenerNode, polyfill } from '../src/index';

// Mock audioProcessingEvent (see ScriptProcessorEvent._processNext())
function audioProcessingEvent(nChannels, batchSize, inBuffer) {
	let outBuffers = [];

	for (let i = 0; i < nChannels; i++) {
		outBuffers.push(new Float32Array(batchSize));
	}

	return {
		inputBuffer: {
			getChannelData: (channel) => {
				return inBuffer;
			},
			numberOfChannels: nChannels,
			length: batchSize
		},
		outputBuffer: {
			getChannelData: (channel) => {
				return outBuffers[channel];
			},
			numberOfChannels: nChannels,
			length: batchSize
		}
	}
}

test('subscribeToSilence() adds a subscriber', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const node = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);
	node.subscribeToSilence(() => {});

	expect(node._subscriptions.size).toBe(1);
});

test('unsubscribeFromSilence() removes subscriber', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const node = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);
	let id = node.subscribeToSilence(() => {});
	node.unsubscribeFromSilence(id);

	expect(node._subscriptions.size).toBe(0);
});

test('get numberOfInputs defers to backend', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	expect(sln.numberOfInputs).toBe(sln._backend.node.numberOfInputs);
});

test('get numberOfOutputs defers to backend', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	expect(sln.numberOfOutputs).toBe(sln._backend.node.numberOfOutputs);
});

test('get channelCount defers to backend', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	expect(sln.channelCount).toBe(sln._backend.node.channelCount);
});

test('get channelCountMode defers to backend', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	expect(sln.channelCountMode).toBe(sln._backend.node.channelCountMode);
});

test('get channelInterpretation defers to backend', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	expect(sln.channelInterpretation).toBe(sln._backend.node.channelInterpretation);
});

test('set channelCount sets backend channelCount', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	sln.channelCount = 420;

	expect(sln._backend.node.channelCount).toBe(420);
});

test('set channelCountMode sets backend channelCountMode', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	sln.channelCountMode = 'max';

	expect(sln._backend.node.channelCountMode).toBe('max');
});

test('set channelInterpretation sets backend channelInterpretation', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	sln.channelInterpretation = 'discrete';

	expect(sln._backend.node.channelInterpretation).toBe('discrete');
});

test('get silent returns backend.silent value', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);
	
	sln._backend.silent = '420';

	expect(sln.silent).toBe('420');
});

test('get silence returns backend.silent value', async () => {
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);
	
	sln._backend.silent = '420';
	
	expect(sln.silence).toBe('420');
});

test('listeners are notified of silence state change', async (done) => {
	// **** this is assuming ScriptProcessorBackend ****
	const nIns = 2;
	const nOuts = 2;
	const nChannels = 2;

	const ctx = new AudioContext();
	const sln = await createSilenceListenerNode(ctx, nIns, nOuts, nChannels);

	sln.subscribeToSilence((silent, delta) => {
		expect(silent).toBe(true);
		done();
	});

	for (let i = 0; i < 100; i++) {
		sln._backend._processNext(audioProcessingEvent(nChannels, 512, new Float32Array(512)));
	}
});