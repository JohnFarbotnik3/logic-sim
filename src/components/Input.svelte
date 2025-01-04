
<script>
	import { parse_input } from "./Input";
	const props = $props();
	const { type, label, initial, oninput } = props;

	// add to element map.
	import { main } from "../application/Main.js";
	let element = $state(null);
	$effect(() => { main.gameUI.elementMap.set(props.id, element); });

	let inputValue = $state(initial);
	let inputValid = $state(true);
	function oninputFunc() {
		const [value, valid] = parse_input(inputValue, type);
		inputValid = valid;
		if(valid) oninput.call(main.gameUI, value);
	};
</script>

<style>
	.valid {
		outline: 2px #3a3 solid;
	}
	.error {
		outline: 2px #f88 solid;
	}
	input {
		border: none;
		width: 100%;
		padding: 0px;
	}
	input:disabled {
		opacity: 0.5;
		background: #fff;
	}
</style>

<div>
	{#if label}
		<div>{label}</div>
	{/if}
	<input
		{...props}
		bind:this={element}
		bind:value={inputValue}
		class={inputValid ? "valid" : "error"}
		oninput={oninputFunc}
	/>
</div>
