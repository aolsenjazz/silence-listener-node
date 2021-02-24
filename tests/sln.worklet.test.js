import 'web-audio-test-api';

// Mock AudioWorkletProcessor
class MockAudioWorkletProcessor {
	constructor() {
		this.port = {
			onmessage: () => {},
			postMessage: () => {},
		}
	}
}
global.AudioWorkletProcessor = MockAudioWorkletProcessor;
global.registerProcessor = () => {}

test('_onMessage init correctly sets silenceThreshold', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();
	let event = {
		data: {
			command: 'init',
			silenceThreshold: 'yolo'
		}
	}

	awp._onMessage(event);

	expect(awp.silenceThreshold).toBe('yolo');
});

test('_onMessage bad command throws', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();
	let event = {
		data: {
			command: 'bad',
		}
	}

	expect(() => {
		awp._onMessage(event);
	}).toThrow('unknown command bad');
});

test('process copies ins to outs (1 mono in, 1 mono out)', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();

	let inData = new Float32Array(128);
	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	let ins = [
		[
			inData
		]
	];
	
	let outs = [
		[
			new Float32Array(128)
		]
	];

	awp.process(ins, outs);

	expect(JSON.stringify(ins)).toBe(JSON.stringify(outs));
});

test('process copies ins to outs (2 mono in, 2 mono out)', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();

	let inData = new Float32Array(128);
	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	let ins = [
		[
			inData
		],
		[
			inData
		]
	];
	
	let outs = [
		[
			new Float32Array(128)
		],
		[
			new Float32Array(128)
		]
	];

	awp.process(ins, outs);

	expect(JSON.stringify(ins)).toBe(JSON.stringify(outs));
});

test('process copies ins to outs (1 stereo in, 1 stereo out)', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();

	let inData = new Float32Array(128);
	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	let ins = [
		[
			inData,
			inData
		]
	];
	
	let outs = [
		[
			new Float32Array(128),
			new Float32Array(128)
		]
	];

	awp.process(ins, outs);

	expect(JSON.stringify(ins)).toBe(JSON.stringify(outs));
});

test('processing # of silent buffers < threshold does not trigger state change', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();

	let ins = [
		[
			new Float32Array(128),
			new Float32Array(128)
		]
	];
	
	let outs = [
		[
			new Float32Array(128),
			new Float32Array(128)
		]
	];

	awp.process(ins, outs);

	expect(awp.silent).toBe(false);
});

test('processing # silent buffers === threshold triggers state change', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();

	let ins = [
		[
			new Float32Array(128),
			new Float32Array(128)
		]
	];
	
	let outs = [
		[
			new Float32Array(128),
			new Float32Array(128)
		]
	];

	for (let i = 0; i < awp.silenceThreshold; i++) {
		awp.process(ins, outs);
	}

	expect(awp.silent).toBe(true);
});

test('processing non-silent buffer while silent triggers state change', () => {
	const WorkletProcessor = require('../src/sln.worklet.js');
	let awp = new WorkletProcessor.default();
	awp.silent = true;

	let inData = new Float32Array(128);
	for (let i = 0; i < inData.length; i++) {
		inData[i] = i;
	}

	let ins = [
		[
			inData,
			inData
		]
	];
	
	let outs = [
		[
			new Float32Array(128),
			new Float32Array(128)
		]
	];

	awp.process(ins, outs);

	expect(awp.silent).toBe(false);
});