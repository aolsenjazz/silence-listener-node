import 'web-audio-test-api';

import { ScriptProcessorBackend } from '../src/script-processor-backend';
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

beforeAll(() => {
	// run the polyfill just in case
	polyfill();
});

test('connect() calls node.connect()', async () => {
	const batchSize = 512;
	const nIns = 2;
	const nOuts = 2;

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts);
	const destination = await createSilenceListenerNode(ctx, nIns, nOuts, batchSize);
	const spy = jest.spyOn(spb.audioNode, 'connect');

	spb.connect(destination);

	expect(spy).toHaveBeenCalledTimes(1);
});

test('disconnect() calls node.disconnect()', () => {
	const batchSize = 512;
	const nIns = 2;
	const nOuts = 2;

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts);
	const spy = jest.spyOn(spb.audioNode, 'disconnect');


	spb.disconnect();

	expect(spy).toHaveBeenCalledTimes(1);
});

test('processing # of silent buffers < threshold does not trigger state change', () => {
	const batchSize = 512;
	const nIns = 2;
	const nOuts = 2;
	const silenceThreshold = 3;
	const inData = new Float32Array(batchSize);

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts, silenceThreshold);
	spb.setSilenceCallback(() => {});
	const spy = jest.spyOn(spb, 'silenceCallback');
	
	spb._processNext(audioProcessingEvent(nOuts, batchSize, inData));

	expect(spy).toHaveBeenCalledTimes(0);
});

test('processing # silent buffers === threshold triggers state change', () => {
	const batchSize = 512;
	const nIns = 2;
	const nOuts = 2;
	const silenceThreshold = 3;
	const inData = new Float32Array(batchSize);

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts, silenceThreshold);
	spb.setSilenceCallback(() => {});
	const spy = jest.spyOn(spb, 'silenceCallback');
	
	for (let i = 0; i < silenceThreshold; i++) {
		spb._processNext(audioProcessingEvent(nOuts, batchSize, inData));
	}

	expect(spy).toHaveBeenCalledTimes(1);
});

test('processing non-silent buffer while silent triggers state change', () => {
	const batchSize = 512;
	const nIns = 2;
	const nOuts = 2;
	const silenceThreshold = 3;
	const inData = new Float32Array(batchSize);

	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts, silenceThreshold);
	spb.setSilenceCallback(() => {});
	spb.silent = true;
	const spy = jest.spyOn(spb, 'silenceCallback');
	
	spb._processNext(audioProcessingEvent(nOuts, batchSize, inData));

	expect(spy).toHaveBeenCalledTimes(1);
});

test('_processNext copies in data to out correctly mono', () => {
	const batchSize = 512;
	const nIns = 1;
	const nOuts = 1;
	const silenceThreshold = 3;
	const inData = new Float32Array(batchSize);
	const ape = audioProcessingEvent(nOuts, batchSize, inData);

	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts, silenceThreshold);
	
	spb._processNext(ape);

	expect(JSON.stringify(ape.outputBuffer.getChannelData(0))).toBe(JSON.stringify(ape.inputBuffer.getChannelData(0)));
});

test('_processNext copies in data to out correctly stereo', () => {
	const batchSize = 512;
	const nIns = 2;
	const nOuts = 2;
	const silenceThreshold = 3;
	const inData = new Float32Array(batchSize);
	const ape = audioProcessingEvent(nOuts, batchSize, inData);

	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	const ctx = new AudioContext();
	const spb = new ScriptProcessorBackend(ctx, batchSize, nIns, nOuts, silenceThreshold);
	
	spb._processNext(ape);

	expect(JSON.stringify(ape.outputBuffer.getChannelData(0))).toBe(JSON.stringify(ape.inputBuffer.getChannelData(0)));
	expect(JSON.stringify(ape.outputBuffer.getChannelData(1))).toBe(JSON.stringify(ape.inputBuffer.getChannelData(1)));
});

