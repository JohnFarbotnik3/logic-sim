<script>
	import Button from "./Button.svelte";
	import Grid from "./Grid.svelte";
	let props = $props();
</script>

<style>
	.underlay {
		z-index: 1000;
		position:absolute;
		height: 100vh;
		width: 100vw;
		top: 0px;
		left: 0px;
		background: #0007;
		display: grid;
		align-content: center;
		justify-items: center;
	}

	.inner {
		width: fit-content;
		height: fit-content;
		background: #000;
		padding: 5px;
	}
</style>

<div class={`underlay ${props?.class}`} style={props?.style}>
	<div class="outline inner">
		<Grid rows="auto auto">
			<div style="margin-bottom:10px;">
				{@html props.innerHTML}
			</div>
			<Grid cols="1fr 1fr">
				<Button onclick={() => props.oncancel()} style="background:#300; left:0px;">Cancel</Button>
				<Button onclick={() => props.onsubmit()} style="background:#033; right:0px;">Submit</Button>
			</Grid>
		</Grid>
	</div>
</div>
