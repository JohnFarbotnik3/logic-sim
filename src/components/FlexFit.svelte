<script>
	const props = $props();
</script>

<style>
	div {
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: fit-content;
	}
</style>

<div {...props}>
	{@render props?.children()}
</div>
