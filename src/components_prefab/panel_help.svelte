<script>
	import { Popup, Button, Grid, FlexCol } from "../components/exports";
	import { main } from "../application/Main";
	import * as Help from "./panel_help";

	function onclose() {
		main.gameUI.setCurrentPanel_callback(null);
	}

	const TABS = {
		INTRO	: { head:Help.HEAD_INTRO	, text:Help.TEXT_INTRO	, name: "Introduction" },
		FILE	: { head:Help.HEAD_FILE		, text:Help.TEXT_FILE	, name: "File" },
		SELECT	: { head:Help.HEAD_SELECT	, text:Help.TEXT_SELECT	, name: "Select" },
		VALUES	: { head:Help.HEAD_VALUES	, text:Help.TEXT_VALUES	, name: "Outputs" },
		CELLS	: { head:Help.HEAD_CELLS	, text:Help.TEXT_CELLS	, name: "Cells" },
		LINKS	: { head:Help.HEAD_LINKS	, text:Help.TEXT_LINKS	, name: "Links" },
		BLOCKS	: { head:Help.HEAD_BLOCKS	, text:Help.TEXT_BLOCKS	, name: "Blocks" },
		ROOT	: { head:Help.HEAD_ROOT		, text:Help.TEXT_ROOT	, name: "Template" },
	};
	const TABS_ARR = [...Object.entries(TABS)];
	let currentTab = $state(null);

	function strformat(str) {
		return str
			// remove first newline.
			.replace("\n", "")
			// line breaks.
			.replaceAll("\n", "<br/>")
			// bullet points.
			.replaceAll(">- ", "><span style='display:inline-block; margin-top:10px; margin-right:5px;'>-</span>")
			// parenthesis.
			.replaceAll("(", "<span style='color:#cce'>(")
			.replaceAll(")", ")</span>")
			// indentation.
			.replaceAll("\t", "<span style='margin-right:20px'></span>");
	}

</script>

<style>
</style>

<Popup onclose={onclose} id="panel_help">
	<Grid cols="auto 1fr" style="width:90vw; height:85vh;">
		<FlexCol>
		{#each TABS_ARR as [key,tab]}
			<Button
				onclick={() => { currentTab = tab; console.log("<>onclick"); }}
				toggled={currentTab === tab}
			>{tab.name}</Button>
		{/each}
		</FlexCol>
		<FlexCol style="padding-right:10px; margin-left:10px; padding-top:5px;">
			{#if currentTab}
			<b style="background:#234; padding:5px;">
				{@html strformat(currentTab.head)}
			</b>
			<p>
				{@html strformat(currentTab.text)}
			</p>
			{/if}
		</FlexCol>
	</Grid>
</Popup>
