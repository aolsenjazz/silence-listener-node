import React from 'react';
import ReactDOM from 'react-dom';

import { createSilenceListenerNode } from '../../../dist/silence-listener-node.js';
// or
// const createSilenceListenerNode = require('../../../dist/silence-listener-node.js').createSilenceListenerNode;

import { useState, useEffect, useCallback } from 'react';

function App() {
	const [msg, setMsg] = useState('State: not playing');

	const [nInputs, setNInputs]     = useState(1);
	const [nOutputs, setNOutputs]   = useState(1);
	const [nChannels, setNChannels] = useState(1);
	const [nSeconds, setNSeconds]   = useState(8);
	
	const play = useCallback(() => {
		// init the audiocontext
		var AudioCtx = window.AudioContext || window.webkitAudioContext;
		var ctx = new AudioCtx({sampleRate: 44100});

		// Create (mono) audio data, alternating 1 second white noise, 1 second silence
		var data = ctx.createBuffer(1, ctx.sampleRate * nSeconds, ctx.sampleRate);
		var idx = 0;
		for (var i = 0; i < nSeconds; i++) {
			let silence = i % 2 !== 0;
			for (var j = 0; j < ctx.sampleRate; j++) {
				data.getChannelData(0)[idx++] = silence ? 0 : Math.random()
			}
		}
		var source = ctx.createBufferSource();
		source.buffer = data;

		// create the SilenceListenerNode
		createSilenceListenerNode(ctx, nInputs, nOutputs, nChannels, {
			pathToWorklet: '/dist/sln.worklet.js',
			silenceThreshold: 1 // one batch of samples
		}).then(sln => {
			// set the callback
			sln.subscribeToSilence((silent, delta) => {
				setMsg('State: ' + (silent ? 'silent' : 'not silent'));
			});

			// Hook it all up and play
			source.connect(sln);
			sln.connect(ctx.destination);
			source.start();
			setMsg('State: not silent');
		});
	});
	
	return (
		<div className="App">
			<div>
				<h1>SilenceListenerNode React Example</h1>
				<button onClick={play}>Play</button>
				<p>{msg}</p>
			</div>
		</div>
	);
}

ReactDOM.render(<App />, document.getElementById('root'));