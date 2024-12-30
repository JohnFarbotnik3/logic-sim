<script>
	import InputTable from "../InputTable.svelte";
	import Button from "../Button.svelte";
	import Grid from "../Grid.svelte";
	import { gameUI } from "../../application/Main";
	import { CELL_PROPERTIES } from "../../application/content/CellTypes";

	const ctypes = [...Object.values(CELL_PROPERTIES)];

	function onclick_cell_type(event, ctype) {
		gameUI.onclick_cell_type.call(gameUI, event, ctype);
	}

	function packedRGBA(clr) {
		const r = ((clr >> 24) & 0xff) / 2;
		const g = ((clr >> 16) & 0xff) / 2;
		const b = ((clr >>  8) & 0xff) / 2;
		const a = ((clr >>  0) & 0xff);
		return (r<<24)|(g<<16)|(b<<8)|a;
	}
</script>

<div>
	<InputTable {...gameUI.table_place_cells} />
	<div style="margin:5px;">
		<Grid cols="1fr 1fr">
			{#each ctypes as ct}
			<Button
				onclick={(event) => onclick_cell_type(event, ct.type)}
				class="outline"
				style={`
					height:24px; border-radius:2px; margin:1px;
					background:#${packedRGBA(ct.clr).toString(16)};
				`}
			>
				{ct.tstr}
			</Button>
			{/each}
		</Grid>
	</div>
</div>
