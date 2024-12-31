<script>
	import { gameUI } from "../application/Main";

	const props = $props();

	let element = $state(null);
	$effect(() => { gameUI.canvas = element; });

	function onresize(event) {
		console.log("resize", event);
	}


</script>

<style>
	canvas {
		height: 100%;
		width: 100%;
		background: #333;
	}
</style>

<canvas bind:this={element} onresize={onresize} {...props}>
</canvas>
