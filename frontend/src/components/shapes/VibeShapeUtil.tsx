import { ShapeUtil, Rectangle2d, T, HTMLContainer } from "tldraw";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class VibeShapeUtil extends ShapeUtil<any> {
  static override type = "vibe" as const;

  static override props = {
    w: T.number,
    h: T.number,
    content: T.string,
  };

  // Track pending edits so onEditEnd can commit them even if onBlur doesn't fire
  private pendingContent = new Map<string, string>();

  override onEditEnd(shape: any) {
    const pending = this.pendingContent.get(shape.id);
    if (pending !== undefined && pending !== shape.props.content) {
      this.editor.updateShape({
        id: shape.id,
        type: "vibe" as any,
        props: { content: pending },
      });
    }
    this.pendingContent.delete(shape.id);
  }

  override getDefaultProps() {
    return { w: 220, h: 100, content: "" };
  }

  override getGeometry(shape: any) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override onResize(shape: any, info: any) {
    return {
      props: {
        w: Math.max(100, info.initialBounds.width * info.scaleX),
        h: Math.max(60, info.initialBounds.height * info.scaleY),
      },
    };
  }

  override component(shape: any) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: "all",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#f3e8ff",
            border: "2px solid #c4b5fd",
            borderRadius: 8,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 10px rgba(196, 181, 253, 0.25)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#7c3aed",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Vibe
          </div>
          {isEditing ? (
            <textarea
              defaultValue={shape.props.content}
              autoFocus
              onChange={(e) => {
                this.pendingContent.set(shape.id, e.currentTarget.value);
              }}
              onBlur={(e) => {
                this.editor.updateShape({
                  id: shape.id,
                  type: "vibe" as any,
                  props: { content: e.currentTarget.value },
                });
                this.pendingContent.delete(shape.id);
              }}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                color: "#581c87",
                fontSize: 13,
                fontFamily: "Georgia, serif",
                lineHeight: 1.5,
              }}
            />
          ) : (
            <span
              style={{
                color: "#581c87",
                fontSize: 13,
                fontFamily: "Georgia, serif",
                lineHeight: 1.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.content || "Double-click to add a vibe..."}
            </span>
          )}
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: any) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
        fill="none"
      />
    );
  }
}
