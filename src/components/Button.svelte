
<script>
	const props = $props();
</script>

<style>
	div {
		padding: 2px;
		margin: 2px;
		background: #000;
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
