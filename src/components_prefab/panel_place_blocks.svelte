<script>
	import { InputTable, Button, Grid } from "../components/exports";
	import { main } from "../application/Main";
	import * as Ids from "../ElementIds.js";

	let infoList = $state([]);
	function update_template_list_callback(list) { infoList = list; }

	const gameUI = main.gameUI;
	gameUI.update_template_list_callback = update_template_list_callback;

	const onclick_new_block = () => gameUI.show_new_template_popup.call(gameUI);
</script>

<div>
	<InputTable {...gameUI.table_place_blocks} />
	<div class="outline" style="margin:5px; padding:2px;">
		<Button id={Ids.id_blocks_new} onclick={onclick_new_block} style="width:100%;">New Block</Button>
	</div>
	<Grid cols="auto 1fr auto">
		{#each infoList as { templateId, name, isEditing, canPlace, canRemove }}
		<Button
			id={Ids.id_blocks_edit(name)}
			disabled={isEditing}
			onclick={(ev) => gameUI.onclick_block_edit(ev, templateId)}
			toggled={isEditing}
		>Edit</Button>
		<Button
			id={Ids.id_blocks_select(name)}
			disabled={!canPlace}
			onclick={(ev) => gameUI.onclick_block_place(ev, templateId)}
			onmouseenter={(ev) => gameUI.onmouseenter_block_place(ev, templateId)}
			onmouseleave={(ev) => gameUI.onmouseleave_block_place(ev, templateId)}
		>{name}</Button>
		<Button
			id={Ids.id_blocks_remove(name)}
			disabled={!canRemove}
			onclick={(ev) => gameUI.onclick_block_remove(ev, templateId)}
			onmouseenter={(ev) => gameUI.onmouseenter_block_remove(ev, templateId)}
			onmouseleave={(ev) => gameUI.onmouseleave_block_remove(ev, templateId)}
			style="min-width:20px; background:#703;"
		>X</Button>
		{/each}
	</Grid>
</div>
