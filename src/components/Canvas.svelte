
<script>
	const props = $props();

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

<canvas onresize={onresize} {...props}>
</canvas>
