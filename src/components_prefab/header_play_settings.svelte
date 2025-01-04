<script>
	import { Input, InputArea, InputTable, Button, Grid, FlexRow } from "../components/exports";
	import { main } from "../application/Main";

	const gameUI = main.gameUI;
	let speed_slider = $state(null);
	let speed_label = $state(null);
	$effect(() => {
		const btn_reset = document.getElementById("btn_reset");
		const btn_play = document.getElementById("btn_play");
		gameUI.init_play_header.call(gameUI, btn_play, btn_reset, speed_slider, speed_label);
	})
</script>

<style>
</style>

<Grid cols="1fr auto auto auto 1fr">
	<div></div>
	<Button class="outline" id="btn_play">Play</Button>
	<Grid class="outline" cols="auto 200px">
		<input type="range" bind:this={speed_slider}>
		<div bind:this={speed_label} style="align-content:center;"></div>
	</Grid>
	<Button class="outline" id="btn_reset">Reset</Button>
</Grid>
