<script>
	const props = $props();
</script>

<style>
	div {
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: auto;

		min-width: 0px;
		max-width: 100%;
		min-height: 0px;
		max-height: 100%;
	}
</style>

<div {...props}>
	{@render props?.children()}
</div>
