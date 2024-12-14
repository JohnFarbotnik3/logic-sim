
# Introduction

first, a couple basic notes about how this app works:

1. You can place cells, which perform logical (or arithmetic) operations on their inputs, for example NAND, or MULTIPLY.
2. You can link cell outputs to cell inputs.
3. You can place "blocks", which are instances of "block-templates". The one you are currently editing is called the "root block-template" or "current template". You can also import and export collections of block-templates as JSON text.
4. When you place an item, the simulation will automatically rebuild (this is why some cells flicker after placing an item).


# Cells

To place cells, open the "Cells" panel and select one of the available cell types then place them somewhere in the current template. To Change the size or rotation of placed cells, change the values in the "Properties" table.

Notes:
- All cells have 3 values: INPUT-A, INPUT-B, and OUTPUT. The two exceptions to this rule are the CONSTANT cell, which just outputs some constant value, the COPY cell, which copies the value from INPUT-A, and the NOT cell, which negates (bitwise) the value of INPUT-A.
- All cell values are 32-bit integers. This includes the output of logical operators such as '>' and '==', which output bitmasks where all bits are active. These can still be used to build single-bit circuits though, by treating "0xFFFFFFFF" as "1", and "0x00000000" as "0".


# Links

To place links, open the "Links" panel (this will automatically begin "link placement mode"), then click on (or near) one the the cells inputs/outputs, then click on a another cell's input/output.

To remove links, hold down the right mouse button and sweep across all links you want to delete (any link in the current template that touches the ring around the cursor will be deleted).


# Blocks

To place blocks, open the "Blocks" panel and press the middle button with the name of the block you want to place, then place it somewhere in the current template.

To switch to editing a different block-template, pres the "edit" button beside the name of the block you want to edit.

To delete a block-template, press the "X" button beside the name of the block you want to remove.

Notes:
- you cannot delete a block template that is currently being used by another template.
- you cannot place a block template inside of itself (or any blocks it contains), as this would cause infinite recursion.


# Selecting, modifying, and deleting contents.

To select cells and/or blocks, open the "Select" panel, then click, drag, and release to select all the cells/blocks in the highlighted area.

To move items, click on one of the items that are currently selected, then drag them to their new destination (this will move all other selected items as well).

To delete selected items, press the "delete" key.

To change properties of selected items (ex. width), change values in the "Cell properties" table or "Block properties" table.


# Modifying cell values

To change the current output value of cells, open the "Values" panel, then while left or right mouse button is held down, hover over cells. 

Modify the left (LMB) and right (RMB) values in the "Set cell values" table to pick what these values will be.

Notes:
- these values can be written as integers (ex. "1", "5", "2147483647"), but they can also be specified in hexidecimal by appending the "0x" prefix to the number, for example "0x5a" or "0xFFE3" or "0x0000ffe3".


# Creating a new block template

To create a new block tempalte, open the "File" panel, and press "New Block". Then, fill in the "width", "height", and "name" fields in the dialog that opens, then press "submit" (the "description" field is optional).


# Import and Export

To export all loaded block templates as JSON text, open the "File" panel and press the "Export" button, this will populate the text-area underneath.

To import block templates, paste valid JSON text in the text-area below the "Import" button, then press "Import".

Notes:
- placing invalid JSON in the import text-area may do nothing, spawn an error dialog or alert, or cause the app to crash.
- to change the order that blocks are shown in the list, you can re-arrange the order they appear in the exported JSON then re-import.
(the app doesnt yet have list management functionality, but it is on the to-do list.)
- WARNING: Editing the exported JSON may break the block templates, or cause cells to go missing that some links expect to be there. All components have an ID, which is used for linking, simulating, and drawing components, but modifying this manually can break things. At best the app will detect this and try to delete disconnected links (to prevent a crash), but it may also just crash.


# Editing the root block-template properties

To modify properties of the current template, open the "Root" panel, then input new values into the fields. To submit these changes, press "Submit". To reset the fields, press "Cancel".

Notes:
- the "internal width/height" fields determine how large the block is "on the inside" i.e. when you are editing it.
- the "default placement width/height" fields determine the initial dimensions of blocks that you are placing, i.e. how large they are "on the outside".



