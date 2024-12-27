<script>
	import Grid from "./Grid.svelte"
	import Input from "./Input.svelte"

	const props = $props();
	const { title, enabled, inputs } = props;
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
		<Input {...input} disabled={!enabled} />
	{/each}
</div>
