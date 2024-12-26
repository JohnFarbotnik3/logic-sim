
<script>
	const props = $props();
</script>

<div {...props}>
	{@render props?.children()}
</div>
