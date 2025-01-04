
<script>
	const props = $props();

	// add to element map.
	import { main } from "../application/Main.js";
	let element = $state(null);
	$effect(() => { main.gameUI.elementMap.set(props.id, element); });
</script>

<style>
	button {
		width: 100%;
		min-width: fit-content;
		background: #000;
		color: inherit;
		font-family: inherit;
		display: flex;
		justify-content: center;
		align-items: center;
		border: none;
		cursor: pointer;
	}
	button[toggled=true] {
		background: #333 !important;
		filter: brightness(1.5);
	}
	button:hover {
		filter: contrast(0.7) brightness(1.5);
	}
	button:disabled {
		filter: contrast(0.7) brightness(0.7);
	}
</style>

<button {...props}>
	{@render props?.children()}
</button>
