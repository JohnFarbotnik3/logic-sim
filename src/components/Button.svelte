
<script>
	const props = $props();
</script>

<style>
	div {
		padding: 5px;
		background: #000;
	}
	div:hover {
		filter: brightness(1.5);
	}
</style>

<div class="outline" {...props}>
	{@render props?.children()}
</div>
