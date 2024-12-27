<script>
	import Grid from "../components/Grid.svelte";
	import Button from "../components/Button.svelte";
	import Canvas from "../components/Canvas.svelte";
	import * as Panels from "../components/Panels/Panels.js";

	import { main, gameUI } from "../application/Main.js";

	//main.init().then(() => {});

	const modes = [...Object.values(gameUI.MODES)];
	let currentMode = $state(modes[0]);
	$effect(() => {
		gameUI.setCurrentMode(currentMode);
	});

	const panels = new Map([
		[gameUI.MODES.SELECT	, Panels.panel_select		],
		[gameUI.MODES.SET_VALUES, Panels.panel_cell_values	],
	]);
	let currentPanel = $state(null);
	$effect(() => {
		currentPanel = panels.get(currentMode);
	});

</script>

<div id="page">
	<Grid rows="auto 1fr">
		<div id="header">
			abc
		</div>
		<div>
			<Canvas id="canvas" style="position: absolute;"></Canvas>
			<Grid cols="auto auto" style="position: absolute; width: fit-content;">
				<div id="sidebar">
					{#each modes as mode}
						<Button
							toggled={currentMode === mode}
							onclick={() => currentMode = mode}
						>{mode}</Button>
					{/each}
				</div>
				<div class="sidepanel">
					{@render currentPanel?.()}
				</div>
			</Grid>
		</div>
	</Grid>
</div>

{#if false}
<div id="container">
	<div id="header" class="pad outline"></div>
	<div id="middle">
		<div id="toolPanel" class="pad outline"></div>
		<div id="canvasWrapper" class="fit">
			<canvas id="canvas" width=800 height=600></canvas>
		</div>
	</div>
</div>
{/if}

<style>

#page {
	background: #000;
	position: absolute;
	width: 100vw;
	height: 100vh;
	top: 0px;
	left: 0px;
	color: #fff;
	font-family: monospace;
}

#sidebar {
	width: fit-content;
	height: fit-content;
}
.sidepanel {
	width: fit-content;
	height: fit-content;
	background: #000;
}

</style>
