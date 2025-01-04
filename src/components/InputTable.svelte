<script>
	import { Grid, Input } from "./exports"

	const props = $props();
	const { title, inputs } = props;
</script>

<style>
	.wrapper {
		margin: 5px;
		padding: 5px;
		border-radius: 5px;
	}
	.title {
		display: flex;
		justify-content: center;
		margin-bottom: 5px;
	}
</style>

<div class="wrapper outline" {...props}>
	<div class="title">{title}</div>
	{#each inputs as input}
		<Input {...input} />
	{/each}
</div>
