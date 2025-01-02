<script>
	import Grid from "../components/Grid.svelte";
	import Button from "../components/Button.svelte";
	import Canvas from "../components/Canvas.svelte";
	import Popup from "../components/Popup.svelte";
	import * as Panels from "../components/Panels/Panels.js";
	import { main } from "../application/Main.js";

	// mode stuff.
	let modes			= $state([]);
	let titles			= $state(new Map());
	let panels			= $state(new Map());
	let currentPanel	= $state(null);
	let currentMode		= $state(null);// TODO: add styling to indicate currentMode.
	function onModeChange(mode) {
		currentMode = mode;
	}
	function onclickSetPanelMode(mode) {
		currentPanel = (currentPanel === mode) ? null : mode;
		main.gameUI.setCurrentMode(mode);
	}

	// popup stuff.
	let popup_link_deletion_props = $state(null);
	let popup_link_deletion_visible = $state(false);
	function popup_show_callback_link_deletion(props) {
		popup_link_deletion_props = props;
		popup_link_deletion_visible = true;
	}
	function popup_hide_callback_link_deletion() {
		popup_link_deletion_visible = false;
	}

	// init.
	main.init().then(() => {
		const gameUI = main.gameUI;

		modes = [...Object.values(gameUI.MODES)];
		gameUI.setCurrentMode_callback = onModeChange;
		gameUI.setCurrentMode(gameUI.MODES.SELECT);
		currentPanel = null;

		gameUI.popup_show_callback_link_deletion = popup_show_callback_link_deletion;
		gameUI.popup_hide_callback_link_deletion = popup_hide_callback_link_deletion;

		titles = new Map([
			[gameUI.MODES.SELECT		, gameUI.info_select],
			[gameUI.MODES.SET_VALUES	, gameUI.info_setval],
			[gameUI.MODES.PLACE_CELLS	, gameUI.info_place_cells],
			[gameUI.MODES.PLACE_LINKS	, gameUI.info_place_links],
			[gameUI.MODES.PLACE_BLOCKS	, gameUI.info_place_blocks],
		]);

		panels = new Map([
			[gameUI.MODES.SELECT		, Panels.panel_select],
			[gameUI.MODES.SET_VALUES	, Panels.panel_cell_values],
			[gameUI.MODES.PLACE_CELLS	, Panels.panel_place_cells],
			[gameUI.MODES.PLACE_LINKS	, Panels.panel_place_links],
			[gameUI.MODES.PLACE_BLOCKS	, Panels.panel_place_blocks],
		]);

		// update templatelist.
		main.gameUI.update_template_list();
	});

</script>

<div id="page">
	<Grid rows="auto 1fr">
		<div id="header">
			abc
		</div>
		<Grid cols="1fr">
			<Canvas class="first_column" id="canvas"></Canvas>
			<Grid class="first_column" cols="auto auto" style="width: fit-content; height: fit-content;">
				<Grid id="sidebar" cols="auto">
					{#each modes as mode}
					<Button toggled={currentPanel === mode} onclick={() => onclickSetPanelMode(mode)} title={titles.get(mode)}>{mode}</Button>
					{/each}
				</Grid>
				<div id="panelarea">
					{#each modes as mode}
					<div class="sidepanel" style={currentPanel === mode ? "" : "display: none;"}>
						{@render panels.get(mode)?.()}
					</div>
					{/each}
				</div>
			</Grid>
		</Grid>
	</Grid>
	<div style={popup_link_deletion_visible ? "" : "visibility:hidden;"}>
		<Popup {...popup_link_deletion_props}></Popup>
	</div>
</div>

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
	position: absolute;
	background: #0007;
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
