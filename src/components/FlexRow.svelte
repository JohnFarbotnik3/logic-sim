<script>
	const props = $props();
</script>

<style>
	div {
		display: flex;
		flex-direction: row;
		width: 100%;
		overflow-x: auto;

		min-width: 0px;
		max-width: 100%;
		min-height: 0px;
		max-height: 100%;
	}
</style>

<div {...props}>
	{@render props?.children()}
</div>
