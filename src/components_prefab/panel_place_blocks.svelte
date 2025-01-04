<script>
	import { InputTable, Button, Grid } from "../components/exports";
	import { main } from "../application/Main";

	let infoList = $state([]);
	function update_template_list_callback(list) { infoList = list; }

	const gameUI = main.gameUI;
	gameUI.update_template_list_callback = update_template_list_callback;
</script>

<div>
	<InputTable {...gameUI.table_place_blocks} />
	<Grid cols="auto 1fr auto">
		{#each infoList as { templateId, name, isEditing, canPlace, canRemove }}
		<Button
			disabled={isEditing}
			onclick={(ev) => gameUI.onclick_block_edit(ev, templateId)}
			toggled={isEditing}
		>Edit</Button>
		<Button
			disabled={!canPlace}
			onclick={(ev) => gameUI.onclick_block_place(ev, templateId)}
			onmouseenter={(ev) => gameUI.onmouseenter_block_place(ev, templateId)}
			onmouseleave={(ev) => gameUI.onmouseleave_block_place(ev, templateId)}
		>{name}</Button>
		<Button
			disabled={!canRemove}
			onclick={(ev) => gameUI.onclick_block_remove(ev, templateId)}
			onmouseenter={(ev) => gameUI.onmouseenter_block_remove(ev, templateId)}
			onmouseleave={(ev) => gameUI.onmouseleave_block_remove(ev, templateId)}
			style="min-width:20px; background:#703;"
		>X</Button>
		{/each}
	</Grid>
</div>
