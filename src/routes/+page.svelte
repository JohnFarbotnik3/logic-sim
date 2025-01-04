<script>
	import {
		Grid,
		FlexCol,
		FlexRow,
		FlexFit,
		FlexGrow,
		Button,
		Canvas,
		Popup,
		Tooltip,
	} from "../components/exports";
	import * as Prefab from "../components_prefab/exports";
	import { main } from "../application/Main.js";

	// mode stuff.
	let modes			= $state([]);
	let titles			= $state(new Map());
	let panels			= $state(new Map());
	let currentPanel	= $state(null);
	let currentMode		= $state(null);
	function onModeChange(mode) {
		currentMode = mode;
	}
	function onclickSetPanelMode(mode) {
		currentPanel = (currentPanel === mode) ? null : mode;
		main.gameUI.setCurrentMode(mode);
	}

	// popup stuff.
	let popup_props = $state(null);
	let popup_visible = $state(false);
	function show_popup_callback(props) {
		popup_props = props;
		popup_visible = true;
	}
	function hide_popup_callback() {
		popup_visible = false;
	}

	// tooltip stuff.
	let tooltip_props = $state(null);
	let tooltip_visible = $state(false);
	function show_tooltip_callback(props) {
		tooltip_props = props;
		tooltip_visible = true;
	}
	function hide_tooltip_callback() {
		tooltip_visible = false;
	}

	// init.
	main.init().then(() => {
		const gameUI = main.gameUI;

		modes = [...Object.values(gameUI.MODES)];
		gameUI.setCurrentMode_callback = onModeChange;
		gameUI.setCurrentMode(gameUI.MODES.SELECT);
		currentPanel = null;

		gameUI.show_popup_callback = show_popup_callback;
		gameUI.hide_popup_callback = hide_popup_callback;
		gameUI.show_tooltip_callback = show_tooltip_callback;
		gameUI.hide_tooltip_callback = hide_tooltip_callback;

		titles = new Map([
			[gameUI.MODES.FILE			, gameUI.info_file_export],
			[gameUI.MODES.SELECT		, gameUI.info_select],
			[gameUI.MODES.SET_VALUES	, gameUI.info_setval],
			[gameUI.MODES.PLACE_CELLS	, gameUI.info_place_cells],
			[gameUI.MODES.PLACE_LINKS	, gameUI.info_place_links],
			[gameUI.MODES.PLACE_BLOCKS	, gameUI.info_place_blocks],
			[gameUI.MODES.ROOT_BLOCK	, gameUI.info_root_template],
		]);

		panels = new Map([
			[gameUI.MODES.FILE			, Prefab.panel_file_export],
			[gameUI.MODES.SELECT		, Prefab.panel_select],
			[gameUI.MODES.SET_VALUES	, Prefab.panel_cell_values],
			[gameUI.MODES.PLACE_CELLS	, Prefab.panel_place_cells],
			[gameUI.MODES.PLACE_LINKS	, Prefab.panel_place_links],
			[gameUI.MODES.PLACE_BLOCKS	, Prefab.panel_place_blocks],
			[gameUI.MODES.ROOT_BLOCK	, Prefab.panel_root_template],
		]);

		// update UI.
		gameUI.update_template_list();
		gameUI.root_template_reset_inputs();
	});

</script>

<div id="page">
	<FlexCol>
		<FlexFit id="header">
			{@render Prefab.header_play_settings?.()}
		</FlexFit>
		<FlexGrow id="middle">
			<Grid cols="1fr">
				<Canvas class="first_cell" id="canvas"></Canvas>
				<FlexRow class="first_cell clickthrough" style="width: fit-content; height: 100%;">
					<FlexCol class="clickable" style="height: fit-content;">
						{#each modes as mode}
						<Button
							toggled={currentPanel === mode}
							style={currentMode === mode ? "background:#047;" : ""}
							onclick={() => onclickSetPanelMode(mode)}
							title={titles.get(mode)}
						>{mode}</Button>
						{/each}
					</FlexCol>
					<FlexCol class="clickable" style="height: fit-content; background: #000a;">
						{#each modes as mode}
						<div style={currentPanel === mode ? "" : "display: none;"}>
							{@render panels.get(mode)?.()}
						</div>
						{/each}
					</FlexCol>
				</FlexRow>
			</Grid>
		</FlexGrow>
	</FlexCol>
	<div style={popup_visible ? "" : "visibility:hidden;"}>
		<Popup {...popup_props}></Popup>
	</div>
	<div style={tooltip_visible ? "" : "visibility:hidden;"}>
		<Tooltip {...tooltip_props}></Tooltip>
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
	overflow: clip;
}

</style>
