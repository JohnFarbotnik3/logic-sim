
export const id_canvas			= "canvas";

export const id_popup_submit	= "popup_submit";
export const id_popup_cancel	= "popup_cancel";

export const id_panel			= (mode) => "panel_" + mode;
export const id_panel_btn		= (mode) => "panel_button_" + mode;

export const id_cells_type		= (tstr) => "panel_cells_button_" + tstr;

export const id_blocks_new		= "panel_blocks_new_block";
export const id_blocks_edit		= (name) => "panel_blocks_edit_"   + name.replaceAll(" ", "_");
export const id_blocks_select	= (name) => "panel_blocks_select_" + name.replaceAll(" ", "_");
export const id_blocks_remove	= (name) => "panel_blocks_remove_" + name.replaceAll(" ", "_");

export const id_new_template_w	= "ntpw";
export const id_new_template_h	= "ntph";
export const id_new_template_n	= "ntpn";
export const id_new_template_d	= "ntpd";
