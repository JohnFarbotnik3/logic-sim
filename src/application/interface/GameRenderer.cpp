#include <cstdint>
#include "../Imports.cpp"
#include "./VertexTypes.cpp"
#include "../lib/Transformation2D.cpp"
#include "../lib/Rectangle.cpp"
#include "../lib/VectorND.cpp"
#include "../lib/VectorUtil.cpp"
#include "../WebGL/FontEngine.cpp"
#include "./RenderTree.cpp"
#include "../simulation/GameSimulation.cpp"

struct GameRenderer {
	// ============================================================
	// Constants.
	// ------------------------------------------------------------
	const float pi_v  = 3.14159265358979f;
	const float tau_v = 3.14159265358979f * 2.0f;

	// Font renderer.
	FontRenderer fontRenderer;

	// ============================================================
	// Vertex buffers.
	// ------------------------------------------------------------

	using Ind = uint32_t;
	using Pos = VertexPos;
	using Clr = VertexClr;
	using Tex = VertexTex;

	Vector<Ind> triangles_ind;
	Vector<Pos> triangles_pos;
	Vector<Clr> triangles_clr;
	Vector<Ind> lines_ind;
	Vector<Pos> lines_pos;
	Vector<Clr> lines_clr;
	Vector<Ind> font_ind;
	Vector<Pos> font_pos;
	Vector<Clr> font_clr;
	Vector<Tex> font_tex;

	void clear_buffers(bool mysteryOffset) {
		triangles_ind.clear();
		triangles_pos.clear();
		triangles_clr.clear();
		lines_ind.clear();
		lines_pos.clear();
		lines_clr.clear();
		font_ind.clear();
		font_pos.clear();
		font_clr.clear();
		font_tex.clear();
		// add initial mystery offsets to integer data.
		if(mysteryOffset) {
			const int Q = 1;
			triangles_clr	.push_back(Clr(0xffffffff));
			lines_clr		.push_back(Clr(0xffffffff));
			font_clr		.push_back(Clr(0xffffffff));
		}
	}

	void transform_vdata(
		Vector<Pos>& vdata,
		const Transformation2D& tran,
		const float depth,
		const int vertBeg,
		const int vertEnd
	) {
		tran.apply<Pos>(vdata.data(), vertBeg, vertEnd);
		const float zofs = depth * -0.01;
		for(int i=vertBeg;i<vertEnd;i++) vdata[i].z += zofs;
	}

	void triangles_push(
		const Vector<Ind>& idata,
		const Vector<Pos>& vdata,
		const Vector<Clr>& cdata
	) {
		const Ind iofs = triangles_pos.size();
		for(int x=0;x<idata.size();x++) triangles_ind.push_back(idata[x] + iofs);
		for(int x=0;x<vdata.size();x++) triangles_pos.push_back(vdata[x]);
		for(int x=0;x<cdata.size();x++) triangles_clr.push_back(cdata[x]);
	}

	void lines_push(
		const Vector<Ind>& idata,
		const Vector<Pos>& vdata,
		const Vector<Clr>& cdata
	) {
		const Ind iofs = lines_pos.size();
		for(int x=0;x<idata.size();x++) lines_ind.push_back(idata[x] + iofs);
		for(int x=0;x<vdata.size();x++) lines_pos.push_back(vdata[x]);
		for(int x=0;x<cdata.size();x++) lines_clr.push_back(cdata[x]);
	}

	void font_push(
		const Vector<Ind>& idata,
		const Vector<Pos>& vdata,
		const Vector<Clr>& cdata,
		const Vector<Tex>& tdata
	) {
		const Ind iofs = font_pos.size();
		for(int x=0;x<idata.size();x++) font_ind.push_back(idata[x] + iofs);
		for(int x=0;x<vdata.size();x++) font_pos.push_back(vdata[x]);
		for(int x=0;x<cdata.size();x++) font_clr.push_back(cdata[x]);
		for(int x=0;x<tdata.size();x++) font_tex.push_back(tdata[x]);
	}

	// ============================================================
	// Shape generators.
	// ------------------------------------------------------------

	const float DEPTH_ON_TOP = 33.0f;

	// triangle-rectangles.
	void tri_rects_push(Transformation2D tran, float depth, Rectangle rect, Clr clr) {
		const auto& [x,y,w,h] = rect;
		Vector<Ind> idata = {0,1,2,2,3,0};
		Vector<Pos> vdata = {
			Pos{x+0, y+0, 0.0},
			Pos{x+w, y+0, 0.0},
			Pos{x+w, y+h, 0.0},
			Pos{x+0, y+h, 0.0},
		};
		Vector<Clr> cdata = {clr, clr, clr, clr};
		transform_vdata(vdata, tran, depth, 0, vdata.size());
		triangles_push(idata, vdata, cdata);
	}

	// line-rectangles
	void line_rects_push(Transformation2D tran, float depth, Rectangle rect, Clr clr) {
		const auto& [x,y,w,h] = rect;
		Vector<Ind> idata = {0,1,1,2,2,3,3,0};
		Vector<Pos> vdata = {
			Pos{x+0, y+0, 0.0},
			Pos{x+w, y+0, 0.0},
			Pos{x+w, y+h, 0.0},
			Pos{x+0, y+h, 0.0},
		};
		Vector<Clr> cdata = {clr, clr, clr, clr};
		transform_vdata(vdata, tran, depth, 0, vdata.size());
		lines_push(idata, vdata, cdata);
	}

	// lines
	void push_content_line(Transformation2D tran, float depth, Pos p0, Pos p1, Clr clr) {
		// generate data.
		Vector<Ind> idata = {0,1};
		Vector<Pos> vdata = {p0, p1};
		Vector<Clr> cdata = {clr, clr};
		// push data.
		transform_vdata(vdata, tran, depth, 0, vdata.size());
		lines_push(idata, vdata, cdata);
	}

	// line grid
	void push_content_line_grid(Transformation2D tran, float depth, Rectangle rect, Clr clr, int nx, int ny) {
		// generate data.
		const auto& [x,y,w,h] = rect;
		const int count = 2*(nx+1) + 2*(ny+1);
		Vector<Ind> idata(count);
		Vector<Pos> vdata(count);
		Vector<Clr> cdata(count);
		for(int i=0;i<count;i++) idata[i] = i;
		for(int i=0;i<count;i++) cdata[i] = clr;
		int i = 0;
		const float xincr = w / nx;
		const float yincr = h / ny;
		for(int n=0;n<=nx;n++) {
			const float px = x + (n * xincr);
			vdata[i++] = Pos{px, y+0, 0};
			vdata[i++] = Pos{px, y+h, 0};
		}
		for(int n=0;n<=ny;n++) {
			const float py = y + (n * yincr);
			vdata[i++] = Pos{x+0, py, 0};
			vdata[i++] = Pos{x+w, py, 0};
		}
		// push data.
		transform_vdata(vdata, tran, depth, 0, vdata.size());
		lines_push(idata, vdata, cdata);
	}

	// line circle
	void push_content_line_circle(Transformation2D tran, float depth, float x, float y, float r, int n, Clr clr) {
		Vector<Ind> idata(n*2);
		Vector<Pos> vdata(n);
		Vector<Clr> cdata(n);
		for(int i=0;i<n;i++) cdata[i] = clr;
		for(int i=0;i<n;i++) {
			idata[i*2+0] = i;
			idata[i*2+1] = i+1;
		}
		idata[idata.size() - 1] = 0;
		float aincr = tau_v / (n-1);
		for(int i=0;i<n;i++) {
			const float angle = i * aincr;
			vdata[i] = Pos{
				std::cosf(angle) * r + x,
				std::sinf(angle) * r + y,
				0
			};
		}
		// push data.
		transform_vdata(vdata, tran, depth, 0, vdata.size());
		lines_push(idata, vdata, cdata);
	}

	void push_content_text_box(
		const Transformation2D& tran,
		const String& str,
		float depth,
		float fontHeight,
		Clr fontColour,
		Rectangle boundingRect,
		Vector2D textAlign,
		Vector2D rectOrigin,
		bool wrap
	) {
		// generate data
		const Vector3D offset = {0.0, 0.0, 0.0};
		const Vector3D xbasis = {1.0, 0.0, 0.0};
		const Vector3D ybasis = {0.0, 1.0, 0.0};
		auto data = fontRenderer.generateVertexData3d<Ind, Pos, Tex>(
			str, fontHeight, wrap, boundingRect, textAlign, rectOrigin, offset, xbasis, ybasis
		);
		Vector<Clr> cdata;
		for(int x=0;x<data.vdata.size();x++) cdata.push_back(fontColour);
		// push data.
		transform_vdata(data.vdata, tran, depth, 0, data.vdata.size());
		font_push(data.idata, data.vdata, cdata, data.tdata);
	}

	void push_content_text_box_against_circle(
		const Transformation2D& tran,
		const String& str,
		float depth,
		float fontHeight,
		Clr fontColour,
		Vector2D unitRectPoint,
		float dist
	) {
		// get width.
		const float strh = fontHeight;
		const float strw = fontRenderer.getTotalWidth(str, fontHeight);
		// get box position.
		const bool wrap = false;
		const float rx = unitRectPoint.x;
		const float ry = unitRectPoint.y;
		const Vector2D rectOrigin = {
			1.0f - (((rx - 0.5f) * dist) + 0.5f),
			1.0f - (((ry - 0.5f) * dist) + 0.5f),
		};
		const Vector2D textAlign = {0.5, 0.5};
		const Rectangle boundingRect{rx, ry, strw, strh};
		// generate data
		const Vector3D offset = {0.0, 0.0, 0.0};
		const Vector3D xbasis = {1.0, 0.0, 0.0};
		const Vector3D ybasis = {0.0, 1.0, 0.0};
		auto data = fontRenderer.generateVertexData3d<Ind, Pos, Tex>(
			str, fontHeight, wrap, boundingRect, textAlign, rectOrigin, offset, xbasis, ybasis
		);
		Vector<Clr> cdata;
		for(int x=0;x<data.vdata.size();x++) cdata.push_back(fontColour);
		// push data.
		transform_vdata(data.vdata, tran, depth, 0, data.vdata.size());
		font_push(data.idata, data.vdata, cdata, data.tdata);
	}

	// ============================================================
	// Item generators.
	// ------------------------------------------------------------

	const Array<String, 3> cell_output_labels = {"OUT", "A", "B"};
	void draw_cell(
		const Cell& cell,
		const Transformation2D& tran,
		const float depth,
		const Array<uint32_t, 3> vals,
		bool shouldDrawText
	) {
		// draw cell areas.
		const Clr clr_on	= Clr(cell.clr);
		const Clr clr_off	= Clr(
			cell.clr.r >> 1,
			cell.clr.g >> 1,
			cell.clr.b >> 1,
			cell.clr.a
		);
		for(int i=0;i<3;i++) tri_rects_push(tran, depth, RenderTree::CELL_AREA_RECTS[i], vals[i] ? clr_on : clr_off);
		// draw link points.
		const int N = cell.numTargets;
		for(int i=0;i<N;i++) tri_rects_push(tran, depth, RenderTree::LINK_POINT_RECTS[i], 0xffeeccff);
		// draw text.
		/* TODO - go back to using average scale factor of containing block instead of applying basis vectors. */
		if(shouldDrawText) {
			const float textDepth = depth + 1;
			const float fontHeight = 0.30;
			const float dist = 1.2;
			const Clr bclr = 0x000000ff;
			const Clr fclr = 0xffffffff;
			// draw type code.
			{
				const Vector2D unitRectPoint {0.5, 1.0};
				push_content_text_box_against_circle(tran, cell.typeString, textDepth, fontHeight, bclr, unitRectPoint, dist);
				push_content_text_box_against_circle(tran, cell.typeString, textDepth, fontHeight, fclr, unitRectPoint, dist);
			}
			// draw values.
			for(int i=0;i<cell.numTargets;i++) {
				char buf[16];
				sprintf(buf, "%s:0x%08.0X", cell_output_labels[i].c_str(), vals[i]);
				for(int x=0;x<16;x++) if(buf[x] == ' ') buf[x] = '0';
				const String str = String(buf);
				const Clr clr = (vals[i] == 0 ? 0x777777ff : fclr);
				const Vector2D unitRectPoint = {
					RenderTree::LINK_POINTS[i].x,
					RenderTree::LINK_POINTS[i].y,
				};
				push_content_text_box_against_circle(tran, str, textDepth, fontHeight, bclr, unitRectPoint, dist);
				push_content_text_box_against_circle(tran, str, textDepth, fontHeight,  clr, unitRectPoint, dist);
			}
		}
	}
	void draw_cell_preview(
		const BlockWT& rootBlock,
		const Cell& cell
	) {
		const Transformation2D etran = RenderTree::get_content_transformation(rootBlock, Transformation2D());
		const Transformation2D itran = RenderTree::get_item_transformation(cell.dim, etran);
		const float depth = 0;
		const Array<u32, 3> vals = {0,0,0};
		const bool shouldDrawText = false;
		draw_cell(cell, itran, depth, vals, shouldDrawText);
	}

	void draw_link(Pos p0, Pos p1, Clr clr, float depth=0) {
		push_content_line(Transformation2D(), depth+1, p0, p1, clr);
	}
	void draw_link_preview(Vector<Pos> points, Clr clr) {
		// draw circles.
		for(const Pos point : points) push_content_line_circle(Transformation2D(), DEPTH_ON_TOP, point.x, point.y, 0.2, 20, clr);
		// draw link preview
		if(points.size() >= 2) draw_link(points[0], points[1], clr, DEPTH_ON_TOP);
	}

	void draw_text(
		const Text& text,
		const Transformation2D& tran,
		const float depth
	) {
		// draw background.
		// ...TODO...
		// draw outline.
		/// ...TODO...
		// draw text.
		{
			const Clr fontColour = text.fclr;
			const float fontHeight = text.fhgt;
			const ItemDim dim = text.dim;
			const Rectangle boundingRect{dim.x, dim.y, dim.w, dim.h};
			const Vector2D textAlign {0.0, 0.0};
			const Vector2D rectOrigin {0.0, 0.0};
			const bool wrap = true;
			push_content_text_box(tran, text.str, depth, fontHeight, fontColour, boundingRect, textAlign, rectOrigin, wrap);
		}
	}

	void draw_block_background(const RenderTree& rendertree) {
		const float depth = rendertree.depth - 0.5;
		const Transformation2D itran = rendertree.itemTran;
		// draw underlay.
		tri_rects_push(itran, depth, Rectangle{0,0,1,1}, 0x00000033);
		// draw grid.
		if(rendertree.depth == 0) {
			const float w = rendertree.block.blockTemplate->innerW;
			const float h = rendertree.block.blockTemplate->innerH;
			push_content_line_grid(itran, depth, Rectangle{0,0,1,1}, 0x77aaff99, w, h);
		} else {
			line_rects_push(itran, depth, Rectangle{0,0,1,1}, 0x77aaff99);
		}
	}
	void draw_block_placeholder(const RenderTree& rendertree, const Block& block) {
		const Transformation2D& tran = rendertree.itemTrans.at(block.id);
		const float depth = rendertree.depth;
		// draw background.
		tri_rects_push(tran, depth, Rectangle{0,0,1,1}, 0x00000033);
		// draw outline.
		line_rects_push(tran, depth, Rectangle{0,0,1,1}, 0x77aaff99);
	}
	void draw_block(
		const RenderTree& rendertree,
		float depth,
		float maxDepth,
		GameSimulation::SimulationPointer simptr,
		const Set<ItemId>& ids_selected = Set<ItemId>(),
		const Set<ItemId>& ids_hovered  = Set<ItemId>()
	) {
		const BlockTemplate& btmp = *rendertree.block.blockTemplate;
		// draw background.
		draw_block_background(rendertree);
		// draw texts.
		for(const auto& [id, text] : btmp.texts) {
			const Transformation2D& tran = rendertree.itemTrans.at(text.id);
			const float depth = rendertree.depth;
			draw_text(text, tran, depth);
		}
		// draw cells.
		const bool block_sel = ids_selected.contains(rendertree.block.id);
		const bool block_hvr = ids_hovered .contains(rendertree.block.id);
		for(const auto& [id, cell] : btmp.cells) {
			const Transformation2D& tran = rendertree.itemTrans.at(cell.id);
			const float depth = rendertree.depth;
			const Array<u32, 3> vals = simptr.get_cell_values(id);
			const bool cell_sel = ids_selected.contains(id);
			const bool cell_hvr = ids_hovered.contains(id);
			const bool shouldDrawText = block_sel | block_hvr | cell_sel | cell_hvr;
			draw_cell(cell, tran, depth, vals, shouldDrawText);
		}
		// draw links.
		for(const auto& [id, link] : btmp.links) {
			const Pos p0 = rendertree.get_link_point(link.src);
			const Pos p1 = rendertree.get_link_point(link.dst);
			draw_link(p0, p1, link.clr, rendertree.depth);
		}
		// draw blocks.
		if(depth < maxDepth)
				for(const auto& [id,child_block] : btmp.blocks)
					draw_block(rendertree.get_child(child_block.id), depth+1, maxDepth, simptr.get_child_pointer(id), ids_selected, ids_hovered);
		else	for(const auto& [id,child_block] : btmp.blocks)
					draw_block_placeholder(rendertree, child_block);
	}
	void draw_block_preview(
		const BlockWT& rootBlock,
		const BlockWT& block
	) {
		const Transformation2D etran = RenderTree::get_content_transformation(rootBlock, Transformation2D());
		const float depth		= 1;
		const float maxDepth	= 3;
		const RenderTree previewblock(block, etran, depth);
		draw_block(previewblock, depth, maxDepth, GameSimulation::SimulationPointer());
	}

	// ============================================================
	// Selection and hover
	// ------------------------------------------------------------

	void drawCursor(Pos pos, float radius) {
		const float depth = DEPTH_ON_TOP;
		const Clr clr = 0xffff99ff;
		push_content_line_circle(Transformation2D(), DEPTH_ON_TOP, pos.x, pos.y, radius, 30, clr);
	}

	void drawDragArea(Rectangle rect) {
		const Clr clr = 0xffffff55;
		tri_rects_push(Transformation2D(), DEPTH_ON_TOP, rect, clr);
	}

	void drawSelection(const RenderTree& rendertree, const Set<ItemId>& ids) {
		const float s = 0.03;
		const Rectangle rect {0.0f - s, 0.0f - s, 1.0f + s*2, 1.0f + s*2};
		const Clr clr = 0xffff55ff;
		for(const ItemId id : ids) { line_rects_push(rendertree.itemTrans.at(id), DEPTH_ON_TOP, rect, clr); }
	}

	void drawHovered(const RenderTree& rendertree, const Set<ItemId>& ids) {
		const float s = 0.00;
		const Rectangle rect {0.0f - s, 0.0f - s, 1.0f + s*2, 1.0f + s*2};
		const Clr clr = 0xaaccffff;
		for(const ItemId id : ids) { line_rects_push(rendertree.itemTrans.at(id), DEPTH_ON_TOP, rect, clr); }
	}

	// ============================================================
	// Combined draw function.
	// ------------------------------------------------------------

	void draw_all(
		const BlockWT& rootBlock,
		const GameSimulation& simulation,
		Set<ItemId> ids_selected,
		Set<ItemId> ids_hovered
	) {
		// clear buffers.
		clear_buffers(true);
		// create root render block.
		const RenderTree rendertree(rootBlock, Transformation2D(), 0);
		// get simulation pointer.
		const GameSimulation::SimulationPointer simptr = simulation.get_simtree_root_pointer();
		// draw root block contents.
		draw_block(rendertree, 0, 3, simptr, ids_selected, ids_hovered);
		// draw selection.
		drawSelection(rendertree, ids_selected);
		drawHovered(rendertree, ids_hovered);
	}

	// ============================================================
	// Extra rendering + geometry related helpers.
	// ------------------------------------------------------------

	// TODO - move these to GameControls.cpp
	using AABB = VectorUtil::AABB;
	bool is_item_in_aabb(const RenderTree& rendertree, const AABB& drag_aabb, ItemId id) {
		const Transformation2D& itran = rendertree.itemTrans.at(id);
		const AABB item_aabb = VectorUtil::get_axis_aligned_bounding_box(itran);
		return VectorUtil::collision_aabb_aabb_2d(drag_aabb, item_aabb);
	}
	Vector<ItemId> get_items_in_drag_area(const BlockWT& rootBlock, float x0, float y0, float x1, float y1) {
		const AABB drag_aabb{ Vector2D{x0,y0}, Vector2D{x1,y1} };
		const RenderTree rendertree(rootBlock, Transformation2D(), 0);
		Vector<ItemId> ids;
		// TODO - get seperate vectors for each item type instead.
		for(const auto& [id, item] : rootBlock.blockTemplate->cells ) if(is_item_in_aabb(rendertree, drag_aabb, id)) ids.push_back(item.id);
		for(const auto& [id, item] : rootBlock.blockTemplate->texts ) if(is_item_in_aabb(rendertree, drag_aabb, id)) ids.push_back(item.id);
		for(const auto& [id, item] : rootBlock.blockTemplate->blocks) if(is_item_in_aabb(rendertree, drag_aabb, id)) ids.push_back(item.id);
		return ids;
	}

	// TODO
	Vector<ItemId> getItemsHovered() {}
	Vector<ItemId> getLinksHovered() {}

	/*
	isItemHovered(item) {
		const aabb = main.gameRenderer.renderBlock.get_axis_aligned_bounding_box(item);
		VerificationUtil.verifyType_throw(aabb, Float32Array);
		return VectorUtil.collision_aabb_point_2d(aabb, this.cursor_pos);
	}
	isLinkHovered(link) {
		const points = main.gameRenderer.renderBlock.l_points.get(link.id);
		const pointC = new Vector2D(this.cursor_pos.slice(0,2));
		const pointA = new Vector2D(points.slice(0,2));
		const pointB = new Vector2D(points.slice(3,5));
		const nearest = VectorUtil.nearestPoint_point_line_segment_2d(pointC, pointA, pointB);
		const nearest3d = new Vector3D([nearest[0], nearest[1], 0.0]);
		const distance = nearest3d.add(this.cursor_pos, -1.0).hypot();
		return distance <= this.cursor_radius;
	}
	*/


};
