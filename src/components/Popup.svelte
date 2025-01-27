<script>
	import { Button, Grid } from "./exports";
	import * as Ids from "../ElementIds";

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

<div class={`underlay ${props?.class ?? ""}`} style={props?.style}>
	<div class="outline inner">
		<Grid rows="auto auto">
			<Grid cols="1fr">
				{#if props?.onclose}<Button onclick={() => props.onclose()} style="background:#033; right:0px;">Close</Button>{/if}
			</Grid>
			<div>
				{@html props?.innerHTML}
				{@render props?.children()}
			</div>
			<Grid cols="1fr 1fr">
				{#if props?.oncancel}<Button id={Ids.id_popup_cancel} onclick={() => props.oncancel()} style="background:#300; left:0px;">Cancel</Button>{/if}
				{#if props?.onsubmit}<Button id={Ids.id_popup_submit} onclick={() => props.onsubmit()} style="background:#033; right:0px;">Submit</Button>{/if}
			</Grid>
		</Grid>
	</div>
</div>
