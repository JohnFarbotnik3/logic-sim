<script>
	import { InputTable } from "../components/exports";
	import { main } from "../application/Main";

	// TODO: figure out how to do this onMount instead, this may be a race condition.
	$effect(() => {
		main.gameUI.on_selection_update();
	})
</script>

<div>
	<InputTable {...main.gameUI.table_select_cells} />
	<InputTable {...main.gameUI.table_select_blocks} />
</div>
