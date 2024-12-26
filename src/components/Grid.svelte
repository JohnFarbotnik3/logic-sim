
<script>
	const props = $props();
	const rows = $derived(props.rows ? `grid-template-rows: ${props.rows};` : "");
	const cols = $derived(props.cols ? `grid-template-columns: ${props.cols};` : "");
</script>

<style>
	div {
		display: grid;
		height: 100%;
		width: 100%;
	}
</style>

<div
	id={props?.id}
	class={props?.class}
	style="{cols} {rows} {props?.style}"
>
	{@render props?.children()}
</div>
