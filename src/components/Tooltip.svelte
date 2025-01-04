<script>
	const props = $props();
	let element = $state(null);
	$effect(() => {
		// put tooltip beside target.
		// TODO: put beside mouse cursor instead.
		{
			const target = props.target;
			if(!target) return;
			const { x, y, width, height } = target.getClientRects()[0];
			element.style.top = `${y}px`;
			element.style.left = `${x + width + 5}px`;
		}
		// confine to screen area.
		// TODO: make this code more reliable.
		{
			const rect_page = element.parentElement.getClientRects()[0];
			const { x, y, width, height } = element.getClientRects()[0];
			const out_x = rect_page.right  - (x + width);
			const out_y = rect_page.bottom - (y + height);
			if(out_x < 0) {
				element.style.left = `${out_x + x + width}px`;
			}
			if(out_y < 0) {
				element.style.top = `${out_y + y}px`;
			}
		}
	});
</script>

<style>
	.tooltip {
		z-index: 1000;
		position: fixed;
		height: fit-content;
		width: fit-content;
		background: #000;
		padding: 2px;
	}
</style>

<div class="tooltip outline" bind:this={element}>
	{@html props.innerHTML}
</div>
