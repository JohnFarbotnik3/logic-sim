<script>
	import Grid from "../components/Grid.svelte";
	import Header from "../components/Header.svelte";
	import Button from "../components/Button.svelte";
	import Canvas from "../components/Canvas.svelte";

	import { main, gameUI } from "../application/Main.js";

	//main.init().then(() => {});

	const modes = [...Object.values(gameUI.MODES)];
	let currentMode = $state(modes[0]);
	let currentTime = $state(Date.now());
	$effect(() => {
		gameUI.setCurrentMode(currentMode);
	});

</script>

<style>

#page {
	background: #000;
	position: absolute;
	width: 100vw;
	height: 100vh;
	top: 0px;
	left: 0px;
	color: #fff;
}

#sidebar {
	width: fit-content;
	height: fit-content;
}

.sidepanel {
	width: fit-content;
}

</style>

<div id="page">
	<Grid rows="auto 1fr">
		<Header id="header" class="outline">
			abc
		</Header>
		<div>
			<Canvas id="canvas" style="position: absolute;" onclick={() => currentTime+=1}></Canvas>
			<Grid cols="auto auto" style="position: absolute; width: fit-content;">
				<div id="sidebar">
					{#each modes as mode}
						<Button
							class={currentMode === mode ? "outline_1" : "outline_0"}
							onclick={() => currentMode = mode}
						>{mode}</Button>
					{/each}
				</div>
				{#each modes as mode}
					<div class="sidepanel" style={currentMode === mode ? "" : "display: none"}>
						{mode}
					</div>
				{/each}
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
