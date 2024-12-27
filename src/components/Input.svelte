
<script>
	import { parse_input } from "./Input";
	const props = $props();
	const { type, label, initial, oninput } = props;

	let inputValue = $state(initial);
	let inputValid = $state(true);
	function oninputFunc() {
		const [value, valid] = parse_input(inputValue, type);
		inputValid = valid;
		if(valid) oninput(value);
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
		width: calc(100% - 2 * 0px);
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
	<input {...props} bind:value={inputValue} class={inputValid ? "valid" : "error"} oninput={oninputFunc} />
</div>
