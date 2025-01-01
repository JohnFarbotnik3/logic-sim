
<script>
	const props = $props();

	// add to element map.
	import { main } from "../application/Main.js";
	let element = $state(null);
	$effect(() => { main.gameUI.elementMap.set(props.id, element); });
</script>

<style>
	div {
		padding: 2px;
		margin: 2px;
		background: #000;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	div[toggled=true] {
		background: #333;
		filter: brightness(1.5);
	}
	div:hover {
		background: #443;
	}
</style>

<div {...props}>
	{@render props?.children()}
</div>
