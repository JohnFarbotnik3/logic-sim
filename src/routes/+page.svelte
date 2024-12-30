<script>
	import Grid from "../components/Grid.svelte";
	import Button from "../components/Button.svelte";
	import Canvas from "../components/Canvas.svelte";
	import * as Panels from "../components/Panels/Panels.js";

	import { main, gameUI } from "../application/Main.js";

	main.init().then(() => {});

	const modes = [...Object.values(gameUI.MODES)];
	let currentMode = $state(modes[0]);
	$effect(() => {
		gameUI.setCurrentMode(currentMode);
	});

	const titles = new Map([
		[gameUI.MODES.SELECT		, gameUI.info_select],
		[gameUI.MODES.SET_VALUES	, gameUI.info_setval],
		[gameUI.MODES.PLACE_CELLS	, gameUI.info_place_cells],
		[gameUI.MODES.PLACE_LINKS	, gameUI.info_place_links],
		[gameUI.MODES.PLACE_BLOCKS	, gameUI.info_place_blocks],
	]);

	const panels = new Map([
		[gameUI.MODES.SELECT		, Panels.panel_select],
		[gameUI.MODES.SET_VALUES	, Panels.panel_cell_values],
		[gameUI.MODES.PLACE_CELLS	, Panels.panel_place_cells],
		[gameUI.MODES.PLACE_LINKS	, Panels.panel_place_links],
		[gameUI.MODES.PLACE_BLOCKS	, Panels.panel_place_blocks],
	]);

</script>



<div id="page">
	<Grid rows="auto 1fr">
		<div id="header">
			abc
		</div>
		<Grid cols="1fr">
			<Canvas class="first_column" id="canvas"></Canvas>
			<Grid class="first_column" cols="auto auto" style="width: fit-content;">
				<div id="sidebar">
					{#each modes as mode}
					<Button toggled={currentMode === mode} onclick={() => currentMode = mode} title={titles.get(mode)}>{mode}</Button>
					{/each}
				</div>
				<div id="panelarea">
					{#each modes as mode}
					<div class="sidepanel" style={currentMode === mode ? "" : "display: none;"}>
						{@render panels.get(mode)?.()}
					</div>
					{/each}
				</div>
			</Grid>
		</Grid>
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
	position: absolute;
}

/*
	IMPORTANT TRICK - REMEBER THIS TRICK!!!!!!!!!!
	this allows putting multiple elements in the same row.
*/
:global(.first_column) {
	grid-column: 1;
	grid-row: 1;
}

</style>
