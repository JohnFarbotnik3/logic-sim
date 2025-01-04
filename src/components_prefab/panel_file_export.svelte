<script>
	import { InputArea, Button} from "../components/exports";
	import { main } from "../application/Main";

	const gameUI = main.gameUI;
	const exp_params = gameUI.input_file_export_exp;
	const imp_params = gameUI.input_file_export_imp;
	const exp_props = {...exp_params.input, style:exp_params.style};
	const imp_props = {...imp_params.input, style:imp_params.style};
	const onnewtmp = () => gameUI.show_new_template_popup.call(gameUI);
	const onexport = () => gameUI.onclick_file_export.call(gameUI);
	const onimport = () => gameUI.onclick_file_import.call(gameUI);
</script>

<div>
	<div class="outline" style="margin:5px; padding:2px;">
		<Button onclick={onnewtmp} style="width:100%;">New Block</Button>
	</div>
	<div class="outline" style="margin:5px; padding:2px;">
		<Button onclick={onimport} style="width:100%;">Import</Button>
		<InputArea {...imp_props} />
	</div>
	<div class="outline" style="margin:5px; padding:2px;">
		<Button onclick={onexport} style="width:100%;">Export</Button>
		<InputArea {...exp_props} />
	</div>
</div>
