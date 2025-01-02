<script>
	import { main } from "../../application/Main";
	import InputTable from "../InputTable.svelte";
	import Button from "../Button.svelte";
	import Grid from "../Grid.svelte";

	let infoList = $state([]);
	function update_template_list_callback(list) { infoList = list; }

	main.gameUI.update_template_list_callback = update_template_list_callback;
</script>

<div>
	<InputTable {...main.gameUI.table_place_blocks} />
	<Grid cols="auto 1fr auto">
		{#each infoList as { templateId, name, isEditing, canPlace, canRemove }}
		<Button
			disabled={isEditing}
			onclick={(ev) => main.gameUI.onclick_block_edit(ev, templateId)}
			toggled={isEditing}
		>Edit</Button>
		<Button
			disabled={!canPlace}
			onclick={(ev) => main.gameUI.onclick_block_place(ev, templateId)}
		>{name}</Button>
		<Button
			disabled={!canRemove}
			onclick={(ev) => main.gameUI.onclick_block_remove(ev, templateId)}
			style="min-width:20px; background:#703;"
		>X</Button>
		{/each}
	</Grid>
</div>
